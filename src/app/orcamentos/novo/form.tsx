"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  calcularPorM2,
  formatBRL,
  formatM2,
  formatPct,
  type CalculoMaterial,
  type CalculoImpressao,
  type CalculoAcabamento,
} from "@/lib/calculadoras";
import { criarOrcamento } from "@/lib/actions/orcamentos";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NENHUM = "__nenhum__";

export type ClienteOption = {
  id: string;
  nome: string;
  tipo: "PF" | "PJ";
  telefone: string;
};

export type CatalogoData = {
  materiais: (CalculoMaterial & { nome: string })[];
  impressoes: (CalculoImpressao & { nome: string })[];
  acabamentos: (CalculoAcabamento & { nome: string })[];
  margemMinimaPct: number;
  validadeOrcamentoDias: number;
};

type ItemForm = {
  /** ID local apenas para chave do React */
  uid: string;
  descricao: string;
  larguraCm: string;
  alturaCm: string;
  quantidade: string;
  materialId: string;
  impressaoId: string;
  acabamentoId: string; // NENHUM ou id
  margemPct: string;
};

function novoItem(catalogo: CatalogoData): ItemForm {
  return {
    uid: Math.random().toString(36).slice(2),
    descricao: "",
    larguraCm: "10",
    alturaCm: "10",
    quantidade: "100",
    materialId: catalogo.materiais[0]?.id ?? "",
    impressaoId: catalogo.impressoes[0]?.id ?? "",
    acabamentoId: NENHUM,
    margemPct: "50",
  };
}

export function NovoOrcamentoForm({
  clientes,
  catalogo,
}: {
  clientes: ClienteOption[];
  catalogo: CatalogoData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clienteId, setClienteId] = useState<string>(clientes[0]?.id ?? "");
  const [validadeDias, setValidadeDias] = useState(String(catalogo.validadeOrcamentoDias));
  const [prazoDias, setPrazoDias] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [desconto, setDesconto] = useState("0");
  const [itens, setItens] = useState<ItemForm[]>([novoItem(catalogo)]);

  // Calcula resultado de cada item
  const resultados = useMemo(
    () =>
      itens.map((it) => {
        const lc = Number(it.larguraCm);
        const ac = Number(it.alturaCm);
        const qty = Number(it.quantidade);
        const m = catalogo.materiais.find((x) => x.id === it.materialId);
        const i = catalogo.impressoes.find((x) => x.id === it.impressaoId);
        const acab =
          it.acabamentoId !== NENHUM
            ? catalogo.acabamentos.find((x) => x.id === it.acabamentoId)
            : null;
        if (!m || !i || !(lc > 0) || !(ac > 0) || !(qty > 0)) return null;
        return calcularPorM2({
          larguraCm: lc,
          alturaCm: ac,
          quantidade: qty,
          material: m,
          impressao: i,
          acabamento: acab ?? null,
          margemPct: Number(it.margemPct) || 0,
          margemMinimaPct: catalogo.margemMinimaPct,
        });
      }),
    [itens, catalogo],
  );

  const subtotal = resultados.reduce((s, r) => s + (r?.precoTotal ?? 0), 0);
  const descNum = Math.max(0, Number(desconto) || 0);
  const total = Math.max(0, subtotal - descNum);

  function patchItem(uid: string, patch: Partial<ItemForm>) {
    setItens((prev) => prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItens((prev) => [...prev, novoItem(catalogo)]);
  }

  function removeItem(uid: string) {
    setItens((prev) => (prev.length === 1 ? prev : prev.filter((it) => it.uid !== uid)));
  }

  function podeSalvar(): { ok: true } | { ok: false; reason: string } {
    if (!clienteId) return { ok: false, reason: "Selecione um cliente." };
    if (itens.length === 0) return { ok: false, reason: "Adicione ao menos um item." };
    for (let ix = 0; ix < itens.length; ix++) {
      const it = itens[ix];
      if (!it.descricao.trim()) return { ok: false, reason: `Item ${ix + 1}: informe a descrição.` };
      if (!resultados[ix]) return { ok: false, reason: `Item ${ix + 1}: dados incompletos ou inválidos.` };
    }
    return { ok: true };
  }

  function salvar() {
    const check = podeSalvar();
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }

    startTransition(async () => {
      const result = await criarOrcamento({
        clienteId,
        validadeDias: Number(validadeDias) || catalogo.validadeOrcamentoDias,
        prazoEntregaDias: prazoDias ? Number(prazoDias) : null,
        observacoes,
        condicoesPagamento,
        desconto: descNum,
        itens: itens.map((it, ix) => {
          const r = resultados[ix]!;
          return {
            descricao: it.descricao,
            larguraCm: Number(it.larguraCm),
            alturaCm: Number(it.alturaCm),
            quantidade: Number(it.quantidade),
            materialId: it.materialId,
            impressaoId: it.impressaoId,
            acabamentoId: it.acabamentoId === NENHUM ? null : it.acabamentoId,
            margemPct: r.margemPct,
            areaUnitariaM2: r.areaUnitariaM2,
            areaTotalM2: r.areaTotalM2,
            aproveitamentoPct: r.aproveitamentoPct,
            custoTotal: r.custoTotal,
            precoUnitario: r.precoUnitario,
            precoTotal: r.precoTotal,
          };
        }),
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Orçamento salvo!");
      router.push(`/orcamentos/${result.id}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* ============= CENTRAL: ITENS ============= */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>Quem está pedindo este orçamento.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={clienteId} onValueChange={(v) => v && setClienteId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                    {c.tipo === "PJ" ? " (empresa)" : ""} — {c.telefone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {itens.map((it, ix) => (
          <ItemCard
            key={it.uid}
            numero={ix + 1}
            item={it}
            catalogo={catalogo}
            resultado={resultados[ix]}
            onChange={(patch) => patchItem(it.uid, patch)}
            onRemove={itens.length > 1 ? () => removeItem(it.uid) : undefined}
          />
        ))}

        <Button onClick={addItem} variant="outline" className="w-full">
          <Plus className="size-4" /> Adicionar outro item
        </Button>
      </div>

      {/* ============= LATERAL: TOTAIS + AÇÕES ============= */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardDescription>Total do orçamento</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatBRL(total)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Subtotal" value={formatBRL(subtotal)} />
            <Row label="Desconto" value={`− ${formatBRL(descNum)}`} />
            <Separator />
            <Row label="Total" value={formatBRL(total)} strong />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Condições</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="validade">Validade (dias)</Label>
                <Input
                  id="validade"
                  type="number"
                  min="1"
                  value={validadeDias}
                  onChange={(e) => setValidadeDias(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prazo">Prazo (dias)</Label>
                <Input
                  id="prazo"
                  type="number"
                  min="0"
                  value={prazoDias}
                  onChange={(e) => setPrazoDias(e.target.value)}
                  placeholder="opcional"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Desconto (R$)</Label>
              <Input
                id="desc"
                type="number"
                min="0"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cond">Forma de pagamento</Label>
              <Input
                id="cond"
                value={condicoesPagamento}
                onChange={(e) => setCondicoesPagamento(e.target.value)}
                placeholder="ex: 50% antecipado, 50% na entrega"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Notas para o cliente"
              />
            </div>
          </CardContent>
        </Card>

        <Button className="w-full" onClick={salvar} disabled={pending} size="lg">
          {pending ? "Salvando…" : "Salvar orçamento"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Salvo como <strong>Rascunho</strong>. Você muda o status no detalhe depois.
        </p>
      </div>
    </div>
  );
}

function ItemCard({
  numero,
  item,
  catalogo,
  resultado,
  onChange,
  onRemove,
}: {
  numero: number;
  item: ItemForm;
  catalogo: CatalogoData;
  resultado: ReturnType<typeof calcularPorM2> | null;
  onChange: (patch: Partial<ItemForm>) => void;
  onRemove?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Badge variant="outline">Item {numero}</Badge>
        </CardTitle>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Descrição</Label>
          <Input
            value={item.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
            placeholder="ex: Adesivos personalizados marca X"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Largura (cm)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={item.larguraCm}
              onChange={(e) => onChange({ larguraCm: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Altura (cm)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={item.alturaCm}
              onChange={(e) => onChange({ alturaCm: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={item.quantidade}
              onChange={(e) => onChange({ quantidade: e.target.value })}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={item.materialId} onValueChange={(v) => v && onChange({ materialId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {catalogo.materiais.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Impressão</Label>
            <Select value={item.impressaoId} onValueChange={(v) => v && onChange({ impressaoId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {catalogo.impressoes.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Acabamento (opcional)</Label>
            <Select
              value={item.acabamentoId}
              onValueChange={(v) => v && onChange({ acabamentoId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Sem acabamento adicional</SelectItem>
                {catalogo.acabamentos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Margem (%)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={item.margemPct}
              onChange={(e) => onChange({ margemPct: e.target.value })}
            />
          </div>
        </div>

        {/* Resultado inline */}
        {resultado ? (
          <div className="bg-muted/40 rounded-md p-3 space-y-2">
            {resultado.margemAbaixoDaMinima && (
              <div className="flex items-start gap-2 text-amber-700 text-xs">
                <AlertTriangle className="size-3.5 mt-0.5" />
                Margem ajustada para a mínima ({resultado.margemPct.toFixed(0)}%).
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <KV label="Área unit." value={formatM2(resultado.areaUnitariaM2)} />
              <KV label="Aproveit." value={formatPct(resultado.aproveitamentoPct)} />
              <KV label="Unitário" value={formatBRL(resultado.precoUnitario)} />
              <KV
                label="Total"
                value={formatBRL(resultado.precoTotal)}
                strong
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3">
            Preencha medidas, quantidade, material e impressão para calcular.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-base" : ""}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function KV({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={`tabular-nums ${strong ? "font-semibold" : "font-medium"}`}>{value}</div>
    </div>
  );
}
