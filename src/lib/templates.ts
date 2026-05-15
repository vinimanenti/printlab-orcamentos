import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Engine de templates de mensagem.
 *
 * Os templates ficam em `MensagemTemplate` (editáveis em
 * /configuracoes/templates). Cada um tem placeholders no formato
 * `{{variavel}}` que esta engine substitui pelos valores reais.
 *
 * Se uma variável não vier nos vars, o placeholder fica literal —
 * facilita identificar buracos na conexão (em vez de aparecer string vazia).
 */

export type TemplateVars = Record<string, string | number | null | undefined>;

const PLACEHOLDER_RE = /\{\{\s*(\w+)\s*\}\}/g;

/**
 * Substitui {{vars}} no texto. Função pura — não toca banco.
 * Use diretamente quando você já tem o template em mão.
 */
export function aplicarVariaveis(texto: string, vars: TemplateVars): string {
  return texto.replace(PLACEHOLDER_RE, (full, chave: string) => {
    const v = vars[chave];
    return v !== undefined && v !== null ? String(v) : full;
  });
}

/**
 * Busca o template pela chave no banco e renderiza com as variáveis.
 * Retorna null se o template não existir ou estiver desativado.
 *
 * Uso típico em Server Components:
 *   const texto = await renderTemplate("orcamento_envio", {
 *     cliente: o.cliente.nome,
 *     numero: String(o.numero).padStart(4, "0"),
 *     total: formatBRL(o.total),
 *     validade: format(validadeAte, "dd/MM/yyyy"),
 *     prazo: o.prazoEntregaDias ?? "a combinar",
 *     itens: itensFormatados,
 *   });
 */
export async function renderTemplate(
  chave: string,
  vars: TemplateVars,
): Promise<string | null> {
  const tpl = await prisma.mensagemTemplate.findUnique({
    where: { chave },
    select: { corpo: true, ativo: true },
  });
  if (!tpl || !tpl.ativo) return null;
  return aplicarVariaveis(tpl.corpo, vars);
}

/**
 * Variante que NUNCA retorna null — usa fallback se template não existir.
 */
export async function renderTemplateOrFallback(
  chave: string,
  vars: TemplateVars,
  fallback: string,
): Promise<string> {
  const t = await renderTemplate(chave, vars);
  return t ?? aplicarVariaveis(fallback, vars);
}

/**
 * Lista todos os templates ativos como mapa `{ chave: corpo }`.
 * Útil pra UI que precisa de vários templates (ex: dropdown).
 */
export async function carregarTemplates(): Promise<Record<string, string>> {
  const todos = await prisma.mensagemTemplate.findMany({
    where: { ativo: true },
    select: { chave: true, corpo: true },
  });
  return Object.fromEntries(todos.map((t) => [t.chave, t.corpo]));
}
