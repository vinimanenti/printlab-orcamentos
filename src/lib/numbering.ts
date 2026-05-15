import type { Prisma } from "@prisma/client";

/**
 * Gera o próximo número sequencial para orçamento ou pedido.
 *
 * Atômico porque usa `update` do Prisma com `increment`, que vira um
 * `valor = valor + 1` no banco — sem race condition entre requisições.
 *
 * Use sempre dentro de uma transação para garantir que se a criação do
 * orçamento/pedido falhar, o número não seja "queimado".
 */
export async function proximoNumero(
  tx: Prisma.TransactionClient,
  chave: "orcamento" | "pedido",
): Promise<number> {
  const counter = await tx.sequenceCounter.update({
    where: { chave },
    data: { valor: { increment: 1 } },
  });
  return counter.valor;
}
