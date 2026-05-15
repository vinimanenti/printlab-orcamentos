import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Storage de arquivos com dois backends:
 *
 *   • DEV: grava em ./public/uploads/<pasta>/<arquivo>
 *     — caminho público servido pelo Next.js sem código extra
 *
 *   • PROD: usa Cloudflare R2 (S3-compatible) quando as variáveis de
 *     ambiente R2_* estão configuradas. Filesystem do Vercel é
 *     efêmero (read-only após build), então o disco local não serve.
 *
 * A escolha é automática: se R2_BUCKET estiver no .env, usa R2. Senão,
 * usa disco. Sem flag manual — facilita testar local sem mexer em config.
 */

const R2_ENABLED = !!(
  process.env.R2_BUCKET &&
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
);

const PUBLIC_UPLOADS_REL = "uploads";

let s3Client: S3Client | null = null;
function getR2(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export type ArquivoSalvo = {
  /** Caminho/URL público para servir o arquivo */
  publicPath: string;
  nomeOriginal: string;
  mimeType: string;
  tamanhoBytes: number;
};

const MIMES_ARTE_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/postscript",
  "application/illustrator",
  "image/vnd.adobe.photoshop",
  "application/octet-stream",
  "application/x-cdr",
  "application/cdr",
]);

/**
 * Faz upload de um arquivo. Retorna caminho público para servir.
 *
 * @param pasta diretório lógico (ex: "empresa", "pedidos/{id}")
 * @param file File do FormData
 * @param opts.maxBytes limite de tamanho
 * @param opts.mimesPermitidos set de MIMEs aceitos (vazio = aceita tudo)
 */
export async function salvarArquivo(
  pasta: string,
  file: File,
  opts: {
    maxBytes?: number;
    mimesPermitidos?: Set<string>;
  } = {},
): Promise<ArquivoSalvo> {
  if (!file || file.size === 0) throw new Error("Arquivo inválido");
  if (opts.maxBytes && file.size > opts.maxBytes) {
    throw new Error(`Arquivo excede o limite de ${(opts.maxBytes / 1024 / 1024).toFixed(0)}MB`);
  }
  if (opts.mimesPermitidos && !opts.mimesPermitidos.has(file.type)) {
    throw new Error(`Formato ${file.type || "desconhecido"} não permitido.`);
  }

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const slug =
    path
      .basename(file.name, path.extname(file.name))
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "arquivo";
  const nomeFinal = `${slug}-${randomUUID().slice(0, 8)}${ext}`;
  const key = `${pasta}/${nomeFinal}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  if (R2_ENABLED) {
    // Sobe pro R2
    await getR2().send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    // R2 público: usa o domínio configurado, OU fallback pra rota proxy interna
    const publicPath = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`
      : `/api/files/${encodeURIComponent(key)}`;
    return {
      publicPath,
      nomeOriginal: file.name,
      mimeType: file.type || "application/octet-stream",
      tamanhoBytes: file.size,
    };
  }

  // Disco local (dev)
  const pastaAbs = path.join(process.cwd(), "public", PUBLIC_UPLOADS_REL, pasta);
  await fs.mkdir(pastaAbs, { recursive: true });
  await fs.writeFile(path.join(pastaAbs, nomeFinal), buffer);
  return {
    publicPath: `/${PUBLIC_UPLOADS_REL}/${pasta}/${nomeFinal}`,
    nomeOriginal: file.name,
    mimeType: file.type || "application/octet-stream",
    tamanhoBytes: file.size,
  };
}

/** Remove um arquivo do storage (no-op se não existir). */
export async function removerArquivo(publicPath: string): Promise<void> {
  if (R2_ENABLED && (publicPath.startsWith("/api/files/") || publicPath.includes(".r2.dev"))) {
    const key = publicPath.startsWith("/api/files/")
      ? decodeURIComponent(publicPath.replace("/api/files/", ""))
      : publicPath.split(".r2.dev/")[1] || publicPath.replace(/^.+?\/\//, "").split("/").slice(1).join("/");
    await getR2()
      .send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }))
      .catch(() => {});
    return;
  }
  // Disco local
  const abs = path.join(process.cwd(), "public", publicPath);
  await fs.unlink(abs).catch(() => {});
}

/**
 * Lê um arquivo como Buffer (para PDF logo embedded etc.).
 * Funciona tanto para arquivos R2 quanto disco local.
 */
export async function lerArquivo(publicPath: string): Promise<{ buffer: Buffer; mimeType: string }> {
  if (R2_ENABLED && (publicPath.startsWith("/api/files/") || publicPath.includes(".r2.dev"))) {
    const key = publicPath.startsWith("/api/files/")
      ? decodeURIComponent(publicPath.replace("/api/files/", ""))
      : publicPath.split(".r2.dev/")[1] || publicPath.replace(/^.+?\/\//, "").split("/").slice(1).join("/");
    const resp = await getR2().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
    );
    const bytes = await resp.Body!.transformToByteArray();
    return {
      buffer: Buffer.from(bytes),
      mimeType: resp.ContentType || "application/octet-stream",
    };
  }
  const abs = path.join(process.cwd(), "public", publicPath);
  const buffer = await fs.readFile(abs);
  const ext = path.extname(publicPath).toLowerCase().replace(".", "");
  const mimeType =
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    "application/octet-stream";
  return { buffer, mimeType };
}

// ============= Helpers específicos (preservam API anterior) =============

/** Upload de arte (PDF/PNG/JPG/AI etc.) — até 25MB. */
export async function salvarArquivoArte(
  pedidoId: string,
  file: File,
): Promise<ArquivoSalvo> {
  return salvarArquivo(`arte/${pedidoId}`, file, {
    maxBytes: 25 * 1024 * 1024,
    mimesPermitidos: MIMES_ARTE_PERMITIDOS,
  });
}

/** Indica se o storage de produção (R2) está configurado. */
export function storageR2Ativo(): boolean {
  return R2_ENABLED;
}
