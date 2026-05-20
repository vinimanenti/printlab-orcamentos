/**
 * Smoke test do R2 — sobe um arquivo de 1 byte, lê de volta, deleta.
 * Roda com: npx tsx scripts/testar-r2.ts
 */
import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
const faltando = required.filter((k) => !process.env[k]);
if (faltando.length) {
  console.error(`❌ Faltam variáveis: ${faltando.join(", ")}`);
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.R2_BUCKET!;
const key = `_smoke-test-${Date.now()}.txt`;

(async () => {
  try {
    console.log(`→ Subindo objeto teste em "${bucket}/${key}"...`);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: "Hello from PrintLab!",
        ContentType: "text/plain",
      }),
    );
    console.log("  ✓ PUT OK");

    console.log("→ Lendo objeto de volta...");
    const get = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const conteudo = await get.Body!.transformToString();
    console.log(`  ✓ GET OK — conteúdo: "${conteudo}"`);

    console.log("→ Deletando teste...");
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log("  ✓ DELETE OK");

    if (process.env.R2_PUBLIC_URL) {
      console.log(`\n✓ Tudo funcionando. R2_PUBLIC_URL: ${process.env.R2_PUBLIC_URL}`);
    } else {
      console.log("\n✓ Tudo funcionando. (R2_PUBLIC_URL não setada — sistema usa proxy /api/files)");
    }
  } catch (e) {
    console.error("❌ Erro:", e);
    process.exit(1);
  }
})();
