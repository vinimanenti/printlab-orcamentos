import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * Proxy de arquivos do R2.
 *
 * Usado quando R2_PUBLIC_URL não está configurado — o sistema serve os
 * arquivos via este endpoint em vez de URL pública direta.
 *
 * Segurança: URLs têm UUID aleatório no nome — security through obscurity.
 * Quem tem o link consegue acessar (mesmo modelo do bucket público
 * com r2.dev URL). Aceitável para logo (visível no PDF) e arte
 * (cliente precisa abrir via link público de aprovação).
 *
 * Em dev (sem R2 configurado), este endpoint não é usado — arquivos vêm
 * diretamente de /public/uploads/...
 */

const R2_ENABLED = !!(
  process.env.R2_BUCKET &&
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY
);

let s3: S3Client | null = null;
function r2() {
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (!R2_ENABLED) {
    return new Response("Storage R2 não configurado", { status: 503 });
  }

  const { key: keyParts } = await params;
  const key = keyParts.map((p) => decodeURIComponent(p)).join("/");

  try {
    const resp = await r2().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
    );
    if (!resp.Body) return new Response("Arquivo não encontrado", { status: 404 });

    const bytes = await resp.Body.transformToByteArray();
    return new Response(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": resp.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("Erro proxy R2:", e);
    return new Response("Erro ao buscar arquivo", { status: 500 });
  }
}
