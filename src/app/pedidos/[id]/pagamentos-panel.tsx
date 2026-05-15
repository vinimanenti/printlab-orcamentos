"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Check, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import type { PagamentoMetodo, PagamentoStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  salvarPagamento,
  marcarPagoRapido,
  cancelarPagamento,
  excluirPagamento,
  type PagamentoActionResult,
} from "@/lib/actions/pagamentos";
import { formatBRL } from "@/lib/calculadoras";

const METODOS: { value: PagamentoMetodo; label: string }[] = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

const STATUS_INFO: Record<
  PagamentoStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PREVISTO: { label: "Previsto", variant: "secondary" },
  PAGO: { label: "Pago", variant: "default" },
  ATRASADO: { label: "Atrasado", variant: "destructive" },
  CANCELADO: { label: "Cancelado", variant: "outline" },
};

type Pagamento = {
  id: string;
  valor: number;
  metodo: PagamentoMetodo;
  status: PagamentoStatus;
  vencimento: Date | null;
  pagoEm: Date | null;
  observacoes: string | null;
};

export function PagamentosPanel({
  pedidoId,
  total,
  totalPago,
  pagamentos,
  podeEditar,
  isAdmin,
}: {
  pedidoId: string;
  total: number;
  totalPago: number;
  pagamentos: Pagamento[];
  podeEditar: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const saldo = Math.max(0, total - totalPago);
  const quitado = saldo === 0 && pagamentos.some((p) => p.status === "PAGO");
  const previstos = pagamentos
    .filter((p) => p.status === "PREVISTO" || p.status === "ATRASADO")
    .reduce((s, p) => s + p.valor, 0);

  const [pending, startTransition] = useTransition();

  function quickAction(fn: () => Promise<PagamentoActionResult>, ok: string) {
    startTransition(async () => {
      const r = await fn();
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(ok);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="size-5" /> Pagamentos
          {quitado && <Badge className="ml-2 bg-emerald-600 hover:bg-emerald-700">Quitado</Badge>}
        </CardTitle>
        <CardDescription>
          Pago: <strong>{formatBRL(totalPago)}</strong> de {formatBRL(total)} ·{" "}
          {saldo > 0 ? (
            <>
              Saldo restante <strong className="text-amber-700">{formatBRL(saldo)}</strong>
            </>
          ) : (
            "Sem saldo aberto"
          )}
          {previstos > 0 && (
            <> · {formatBRL(previstos)} previsto(s) ainda não pago(s)</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pagamentos.length > 0 ? (
          <div className="space-y-2">
            {pagamentos.map((p) => {
              const info = STATUS_INFO[p.status];
              const atrasado =
                p.status === "PREVISTO" && p.vencimento && p.vencimento < new Date();
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tabular-nums">{formatBRL(p.valor)}</span>
                      <Badge variant={atrasado ? "destructive" : info.variant}>
                        {atrasado ? "Atrasado" : info.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {METODOS.find((m) => m.value === p.metodo)?.label ?? p.metodo}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      {p.pagoEm && (
                        <span>Pago em {format(p.pagoEm, "dd/MM/yyyy", { locale: ptBR })}</span>
                      )}
                      {p.vencimento && !p.pagoEm && (
                        <span>
                          Vence em {format(p.vencimento, "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                      {p.observacoes && <span>· {p.observacoes}</span>}
                    </div>
                  </div>
                  {podeEditar && (
                    <div className="flex gap-1 shrink-0">
                      {p.status === "PREVISTO" && (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => quickAction(() => marcarPagoRapido(p.id), "Pagamento confirmado")}
                          title="Marcar como pago"
                        >
                          <Check className="size-3.5" />
                        </Button>
                      )}
                      {p.status !== "CANCELADO" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => quickAction(() => cancelarPagamento(p.id), "Pagamento cancelado")}
                          title="Cancelar"
                        >
                          <X className="size-3.5" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending}
                          onClick={() => {
                            if (confirm("Excluir este pagamento? Esta ação não pode ser desfeita.")) {
                              quickAction(() => excluirPagamento(p.id), "Pagamento excluído");
                            }
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">Nenhum pagamento registrado ainda.</p>
        )}

        {podeEditar && (
          <div className="flex gap-2 flex-wrap">
            <PagamentoDialog pedidoId={pedidoId} valorSugerido={saldo} />
            {saldo > 0 && (
              <PagamentoDialog
                pedidoId={pedidoId}
                valorSugerido={saldo}
                comoPago
                label={`Receber ${formatBRL(saldo)} agora`}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PagamentoDialog({
  pedidoId,
  valorSugerido,
  comoPago,
  label,
}: {
  pedidoId: string;
  valorSugerido: number;
  comoPago?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [metodo, setMetodo] = useState<PagamentoMetodo>("PIX");
  const [state, action, pending] = useActionState<PagamentoActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarPagamento(prev, formData);
      if (r && "ok" in r) {
        toast.success("Pagamento registrado");
        setOpen(false);
      }
      return r;
    },
    undefined,
  );

  return (
    <>
      <Button
        variant={comoPago ? "default" : "outline"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {comoPago ? <Check className="size-4" /> : <Plus className="size-4" />}
        {label ?? "Adicionar pagamento"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{comoPago ? "Receber pagamento" : "Registrar pagamento"}</DialogTitle>
            <DialogDescription>
              {comoPago
                ? "Registrar uma entrada já confirmada."
                : "Programar uma cobrança previsão de recebimento."}
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-3">
            <input type="hidden" name="pedidoId" value={pedidoId} />
            <input type="hidden" name="status" value={comoPago ? "PAGO" : "PREVISTO"} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  name="valor"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={valorSugerido > 0 ? valorSugerido.toFixed(2) : ""}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select
                  value={metodo}
                  onValueChange={(v) => v && setMetodo(v as PagamentoMetodo)}
                  items={Object.fromEntries(METODOS.map((m) => [m.value, m.label]))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="metodo" value={metodo} />
              </div>
            </div>

            {comoPago ? (
              <div className="space-y-1.5">
                <Label htmlFor="pagoEm">Data do pagamento</Label>
                <Input
                  id="pagoEm"
                  name="pagoEm"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="vencimento">Vencimento</Label>
                <Input id="vencimento" name="vencimento" type="date" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={2}
                placeholder="ex: PIX da Maria, 50% do total"
              />
            </div>

            {state && "error" in state ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
