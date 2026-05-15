import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/session";
import { OrcamentoPDF, type OrcamentoPDFData } from "@/lib/pdf/orcamento-pdf";

/**
 * Endpoint que renderiza o orçamento em PDF.
 *
 *   GET /orcamentos/[id]/pdf            → inline (abre no browser)
 *   GET /orcamentos/[id]/pdf?download=1 → force-download
 *
 * Renderiza server-side com @react-pdf/renderer (sem Chrome headless).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await verifySession();
  const { id } = await params;
  const url = new URL(request.url);
  const isDownload = url.searchParams.get("download") === "1";

  const o = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: true,
      vendedor: { select: { nome: true } },
      itens: {
        orderBy: { ordem: "asc" },
        include: {
          material: { select: { nome: true } },
          impressao: { select: { nome: true } },
          acabamento: { select: { nome: true } },
        },
      },
    },
  });
  if (!o) notFound();

  const config = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
  });

  const data: OrcamentoPDFData = {
    numero: o.numero,
    criadoEm: o.criadoEm,
    validadeDias: o.validadeDias,
    prazoEntregaDias: o.prazoEntregaDias,
    observacoes: o.observacoes,
    condicoesPagamento: o.condicoesPagamento,
    subtotal: Number(o.subtotal),
    desconto: Number(o.desconto),
    total: Number(o.total),
    cliente: {
      nome: o.cliente.nome,
      tipo: o.cliente.tipo,
      documento: o.cliente.documento,
      telefone: o.cliente.telefone,
      email: o.cliente.email,
    },
    vendedor: { nome: o.vendedor.nome },
    itens: o.itens.map((it) => ({
      descricao: it.descricao,
      larguraCm: Number(it.larguraCm),
      alturaCm: Number(it.alturaCm),
      quantidade: it.quantidade,
      precoUnitario: Number(it.precoUnitario),
      precoTotal: Number(it.precoTotal),
      material: it.material?.nome,
      impressao: it.impressao?.nome,
      acabamento: it.acabamento?.nome,
    })),
    empresa: {
      nome: config?.empresaNome ?? "PrintLab",
      cnpj: config?.empresaCnpj,
      telefone: config?.empresaTelefone ?? "",
      email: config?.empresaEmail,
      endereco: config?.empresaEndereco,
      // Lê a logo do disco se existir, passa como data URL (react-pdf
      // não aceita src com path relativo do public/)
      logoDataUrl: config?.empresaLogoPath
        ? await lerLogoComoDataUrl(config.empresaLogoPath).catch(() => null)
        : null,
    },
  };

  const buffer = await renderToBuffer(<OrcamentoPDF data={data} />);

  // Nome do arquivo: orcamento-N-cliente-snake-case.pdf
  const slug = data.cliente.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const filename = `orcamento-${String(data.numero).padStart(4, "0")}-${slug}.pdf`;

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Lê a logo do disco e converte para data URL.
 * react-pdf não aceita `/uploads/...` como src; precisa de data URL ou
 * caminho absoluto do filesystem. Data URL é mais portável.
 */
async function lerLogoComoDataUrl(publicPath: string): Promise<string> {
  const abs = path.join(process.cwd(), "public", publicPath);
  const buf = await fs.readFile(abs);
  const ext = path.extname(publicPath).toLowerCase().replace(".", "");
  const mime =
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
