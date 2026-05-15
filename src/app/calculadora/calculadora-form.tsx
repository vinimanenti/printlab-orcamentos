"use client";

import { useMemo, useState } from "react";
import { Check, Copy, AlertTriangle, MessageCircle } from "lucide-react";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export type CalculadoraFormProps = {
  materiais: (CalculoMaterial & { nome: string })[];
  impressoes: (CalculoImpressao & { nome: string })[];
  acabamentos: (CalculoAcabamento & { nome: string })[];
  margemMinimaPct: number;
  empresaNome: string;
};

const NENHUM = "__nenhum__";

export function CalculadoraForm({
  materiais,
  impressoes,
  acabamentos,
  margemMinimaPct,
  empresaNome,
}: CalculadoraFormProps) {
  const [larguraCm, setLarguraCm] = useState("10");
  const [alturaCm, setAlturaCm] = useState("10");
  const [quantidade, setQuantidade] = useState("100");
  const [materialId, setMaterialId] = useState(materiais[0]?.id ?? "");
  const [impressaoId, setImpressaoId] = useState(impressoes[0]?.id ?? "");
  const [acabamentoId, setAcabamentoId] = useState<string>(NENHUM);
  const [margemPct, setMargemPct] = useState("50");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");

  const resultado = useMemo(() => {
    const lc = Number(larguraCm);
    const ac = Number(alturaCm);
    const qty = Number(quantidade);
    const m = materiais.find((x) => x.id === materialId);
    const i = impressoes.find((x) => x.id === impressaoId);
    const acab = acabamentoId !== NENHUM ? acabamentos.find((x) => x.id === acabamentoId) : null;
    if (!m || !i || !Number.isFinite(lc) || !Number.isFinite(ac) || !Number.isFinite(qty)) {
      return null;
    }
    if (lc <= 0 || ac <= 0 || qty <= 0) return null;
    return calcularPorM2({
      larguraCm: lc,
      alturaCm: ac,
      quantidade: qty,
      material: m,
      impressao: i,
      acabamento: acab ?? null,
      margemPct: Number(margemPct) || 0,
      margemMinimaPct,
    });
  }, [
    larguraCm,
    alturaCm,
    quantidade,
    materialId,
    impressaoId,
    acabamentoId,
    margemPct,
    margemMinimaPct,
    materiais,
    impressoes,
    acabamentos,
  ]);

  const materialEscolhido = materiais.find((m) => m.id === materialId);
  const impressaoEscolhida = impressoes.find((i) => i.id === impressaoId);
  const acabamentoEscolhido =
    acabamentoId !== NENHUM ? acabamentos.find((a) => a.id === acabamentoId) : null;

  const textoWhatsApp = useMemo(() => {
    if (!resultado || !materialEscolhido || !impressaoEscolhida) return "";
    const saudacao = nomeCliente ? `Olá, ${nomeCliente}!` : "Olá!";
    const linhas = [
      saudacao,
      `Cotação rápida — ${empresaNome}:`,
      "",
      `📐 ${larguraCm} × ${alturaCm} cm`,
      `🔢 ${quantidade} ${Number(quantidade) === 1 ? "unidade" : "unidades"}`,
      `📦 ${materialEscolhido.nome}`,
      `🖨️ ${impressaoEscolhida.nome}`,
      acabamentoEscolhido ? `✨ ${acabamentoEscolhido.nome}` : null,
      "",
      `Valor unitário: ${formatBRL(resultado.precoUnitario)}`,
      `*Total: ${formatBRL(resultado.precoTotal)}*`,
      "",
      "Posso fechar?",
    ].filter(Boolean);
    return linhas.join("\n");
  }, [
    resultado,
    materialEscolhido,
    impressaoEscolhida,
    acabamentoEscolhido,
    larguraCm,
    alturaCm,
    quantidade,
    nomeCliente,
    empresaNome,
  ]);

  function copiarTexto() {
    if (!textoWhatsApp) return;
    navigator.clipboard.writeText(textoWhatsApp).then(
      () => toast.success("Texto copiado", { icon: <Check className="size-4" /> }),
      () => toast.error("Não foi possível copiar"),
    );
  }

  function abrirWhatsApp() {
    if (!textoWhatsApp) return;
    const fone = telefoneCliente.replace(/\D/g, "");
    const url = fone
      ? `https://wa.me/${fone.startsWith("55") ? fone : "55" + fone}?text=${encodeURIComponent(textoWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* ============= COLUNA 1: FORMULÁRIO ============= */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do adesivo</CardTitle>
          <CardDescription>Preencha as medidas e o material — o cálculo é instantâneo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="largura">Largura (cm)</Label>
              <Input
                id="largura"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={larguraCm}
                onChange={(e) => setLarguraCm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="altura">Altura (cm)</Label>
              <Input
                id="altura"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={alturaCm}
                onChange={(e) => setAlturaCm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qtd">Quantidade</Label>
              <Input
                id="qtd"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={materialId} onValueChange={(v) => v && setMaterialId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {materiais.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome} — {formatBRL(m.precoM2)}/m² · bobina {m.larguraBobinaCm}cm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de impressão</Label>
            <Select value={impressaoId} onValueChange={(v) => v && setImpressaoId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {impressoes.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                    {i.precoM2 > 0 ? ` (+${formatBRL(i.precoM2)}/m²)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Acabamento (opcional)</Label>
            <Select value={acabamentoId} onValueChange={(v) => v && setAcabamentoId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Sem acabamento adicional</SelectItem>
                {acabamentos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                    {a.precoM2 ? ` (+${formatBRL(a.precoM2)}/m²)` : ""}
                    {a.precoFixo ? ` (+${formatBRL(a.precoFixo)}/un)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="margem">Margem de lucro desejada (%)</Label>
            <Input
              id="margem"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={margemPct}
              onChange={(e) => setMargemPct(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Margem mínima configurada: <strong>{margemMinimaPct}%</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ============= COLUNA 2: RESULTADO ============= */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resultado</CardDescription>
            <CardTitle className="text-4xl font-bold tabular-nums">
              {resultado ? formatBRL(resultado.precoTotal) : "—"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {resultado
                ? `${formatBRL(resultado.precoUnitario)} por unidade · ${quantidade} ${Number(quantidade) === 1 ? "un" : "uns"}`
                : "Preencha as medidas para calcular"}
            </p>
          </CardHeader>
          {resultado ? (
            <CardContent className="space-y-4">
              {resultado.margemAbaixoDaMinima ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-sm">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong>Margem ajustada pela mínima.</strong> Pediu {margemPct}%, sistema aplicou{" "}
                    {resultado.margemPct.toFixed(0)}% (mínima configurada).
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <KV label="Área unitária" value={formatM2(resultado.areaUnitariaM2)} />
                <KV label="Aproveitamento" value={formatPct(resultado.aproveitamentoPct)} />
                <KV label="Bobina consumida" value={formatM2(resultado.areaTotalM2)} />
                <KV label="Margem aplicada" value={formatPct(resultado.margemPct)} />
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <h4 className="font-medium mb-2">Composição de custo (interno)</h4>
                <Row label="Material" value={formatBRL(resultado.custoMaterial)} />
                <Row label="Impressão" value={formatBRL(resultado.custoImpressao)} />
                {resultado.custoAcabamento > 0 ? (
                  <Row label="Acabamento" value={formatBRL(resultado.custoAcabamento)} />
                ) : null}
                <Separator className="my-1" />
                <Row label="Custo total" value={formatBRL(resultado.custoTotal)} strong />
                <Row
                  label="Lucro estimado"
                  value={formatBRL(resultado.precoTotal - resultado.custoTotal)}
                />
              </div>
            </CardContent>
          ) : null}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              Texto para WhatsApp
            </CardTitle>
            <CardDescription>
              Pronto para colar ou enviar direto pelo wa.me.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nomeCliente">Nome do cliente</Label>
                <Input
                  id="nomeCliente"
                  placeholder="ex: Maria"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="foneCliente">WhatsApp (opcional)</Label>
                <Input
                  id="foneCliente"
                  placeholder="ex: 11 98765-4321"
                  inputMode="tel"
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                />
              </div>
            </div>

            <Textarea
              value={textoWhatsApp}
              readOnly
              rows={10}
              className="font-mono text-xs"
            />

            <div className="flex gap-2">
              <Button onClick={copiarTexto} variant="outline" className="flex-1" disabled={!textoWhatsApp}>
                <Copy className="size-4" /> Copiar texto
              </Button>
              <Button onClick={abrirWhatsApp} className="flex-1" disabled={!textoWhatsApp}>
                <MessageCircle className="size-4" /> Abrir no WhatsApp
              </Button>
            </div>
            {!telefoneCliente && (
              <p className="text-xs text-muted-foreground">
                Sem número: abre o WhatsApp para você escolher o contato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-medium tabular-nums">{value}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
