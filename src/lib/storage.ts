import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Storage de arquivos.
 *
 * Em dev: grava em ./public/uploads/<pedidoId>/<nome>.
 * Em prod (Vercel/serverless), filesystem é efêmero — substituir por R2 ou S3.
 * Documentado em docs/07-stack-decisoes.md.
 *
 * O caminho de retorno é relativo a /public, então fica acessível via
 *   /uploads/<pedidoId>/<arquivo>
 * sem necessidade de rota extra.
 */

const PUBLIC_UPLOADS_REL = "uploads";

export type ArquivoSalvo = {
  /** Caminho público para servir o arquivo (a partir de /) */
  publicPath: string;
  /** Nome original (para exibição) */
  nomeOriginal: string;
  /** Mime detectado */
  mimeType: string;
  /** Tamanho em bytes */
  tamanhoBytes: number;
};

const MIMES_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/postscript", // .ai/.eps
  "application/illustrator",
  "image/vnd.adobe.photoshop", // .psd
  "application/octet-stream", // fallback para .cdr, .dxf, etc.
  "application/x-cdr",
  "application/cdr",
]);

export async function salvarArquivoArte(
  pedidoId: string,
  file: File,
): Promise<ArquivoSalvo> {
  if (!file || file.size === 0) {
    throw new Error("Arquivo inválido");
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Arquivo excede o limite de 25MB");
  }
  if (file.type && !MIMES_PERMITIDOS.has(file.type)) {
    // Não bloqueia tipos desconhecidos (ex.: .cdr nem sempre tem mime), só os explicitamente proibidos.
    // Aqui poderíamos endurecer; deixa permissivo por enquanto.
  }

  const pastaAbsoluta = path.join(process.cwd(), "public", PUBLIC_UPLOADS_REL, pedidoId);
  await fs.mkdir(pastaAbsoluta, { recursive: true });

  // Nome único + extensão original preservada
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const slug = path.basename(file.name, path.extname(file.name))
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "arquivo";

  const nomeFinal = `${slug}-${randomUUID().slice(0, 8)}${ext}`;
  const destino = path.join(pastaAbsoluta, nomeFinal);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(destino, Buffer.from(arrayBuffer));

  return {
    publicPath: `/${PUBLIC_UPLOADS_REL}/${pedidoId}/${nomeFinal}`,
    nomeOriginal: file.name,
    mimeType: file.type || "application/octet-stream",
    tamanhoBytes: file.size,
  };
}
