"use client";

import { useMemo, useState } from "react";
import { Check, Copy, AlertTriangle, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import {
  calcularPorCartela,
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

export type CartelaFormProps = {
  materiais: (CalculoMaterial & { nome: string })[];
  impressoes: (CalculoImpressao & { nome: string })[];
  acabamentos: (CalculoAcabamento & { nome: string })[];
  margemMinimaPct: number;
  empresaNome: string;
};

const NENHUM = "__nenhum__";

/**
 * Calculadora por cartela (folhas com N adesivos).
 *
 * Cenários típicos:
 *   - Etiqueta para tempero: cartela A4 com 30 etiquetas, 100 cartelas
 *   - Cartela de mantimentos: 21x14cm com 12 etiquetas
 *
 * O cálculo internamente trata a cartela como o "item" da calculadora por m².
 * O número de adesivos é apenas multiplicador informativo no resumo.
 */
export function CartelaForm({
  materiais,
  impressoes,
  acabamentos,
  margemMinimaPct,
  empresaNome,
}: CartelaFormProps) {
  const [larguraCm, setLarguraCm] = useState("21");
  const [alturaCm, setAlturaCm] = useState("29.7");
  const [quantidadeCartelas, setQuantidadeCartelas] = useState("50");
  const [adesivosPorCartela, setAdesivosPorCartela] = useState("12");
  const [materialId, setMaterialId] = useState(materiais[0]?.id ?? "");
  const [impressaoId, setImpressaoId] = useState(impressoes[0]?.id ?? "");
  const [acabamentoId, setAcabamentoId] = useState<string>(NENHUM);
  const [margemPct, setMargemPct] = useState("50");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");

  const resultado = useMemo(() => {
    const lc = Number(larguraCm);
    const ac = Number(alturaCm);
    const qtyCart = Number(quantidadeCartelas);
    const adsCart = Number(adesivosPorCartela);
    const m = materiais.find((x) => x.id === materialId);
    const i = impressoes.find((x) => x.id === impressaoId);
    const acab = acabamentoId !== NENHUM ? acabamentos.find((x) => x.id === acabamentoId) : null;
    if (!m || !i || !(lc > 0) || !(ac > 0) || !(qtyCart > 0) || !(adsCart > 0)) {
      return null;
    }
    return calcularPorCartela({
      larguraCartelaCm: lc,
      alturaCartelaCm: ac,
      quantidadeCartelas: qtyCart,
      adesivosPorCartela: adsCart,
      material: m,
      impressao: i,
      acabamento: acab ?? null,
      margemPct: Number(margemPct) || 0,
      margemMinimaPct,
    });
  }, [
    larguraCm,
    alturaCm,
    quantidadeCartelas,
    adesivosPorCartela,
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
      `📋 Cartela ${larguraCm} × ${alturaCm} cm`,
      `🧮 ${adesivosPorCartela} adesivos por cartela × ${quantidadeCartelas} cartelas = ${resultado.adesivosTotais} adesivos`,
      `📦 ${materialEscolhido.nome}`,
      `🖨️ ${impressaoEscolhida.nome}`,
      acabamentoEscolhido ? `✨ ${acabamentoEscolhido.nome}` : null,
      "",
      `Valor por cartela: ${formatBRL(resultado.precoUnitario)}`,
      `Valor por adesivo: ${formatBRL(resultado.precoPorAdesivo)}`,
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
    quantidadeCartelas,
    adesivosPorCartela,
    nomeCliente,
    empresaNome,
  ]);

  function copiarTexto() {
    if (!textoWhatsApp) return;
    navigator.clipboard
      .writeText(textoWhatsApp)
      .then(() => toast.success("Texto copiado", { icon: <Check className="size-4" /> }));
  }

  function abrirWhatsApp() {
    if (!textoWhatsApp) return;
    const fone = telefoneCliente.replace(/\D/g, "");
    const url = fone
      ? `https://wa.me/${fone.startsWith("55") ? fone : "55" + fone}?text=${encodeURIComponent(textoWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;
    window.open(url, "_blank", "noopener");
  }

  const materiaisItems = Object.fromEntries(materiais.map((m) => [m.id, m.nome]));
  const impressoesItems = Object.fromEntries(impressoes.map((i) => [i.id, i.nome]));
  const acabamentosItems: Record<string, string> = {
    [NENHUM]: "Sem acabamento adicional",
    ...Object.fromEntries(acabamentos.map((a) => [a.id, a.nome])),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Dados da cartela</CardTitle>
          <CardDescription>
            Para etiquetas em folha — temperos, mantimentos, lavanderia, kits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="larguraC">Largura da cartela (cm)</Label>
              <Input
                id="larguraC"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={larguraCm}
                onChange={(e) => setLarguraCm(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alturaC">Altura da cartela (cm)</Label>
              <Input
                id="alturaC"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                value={alturaCm}
                onChange={(e) => setAlturaCm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="qtdCart">Quantidade de cartelas</Label>
              <Input
                id="qtdCart"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={quantidadeCartelas}
                onChange={(e) => setQuantidadeCartelas(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adsCart">Adesivos por cartela</Label>
              <Input
                id="adsCart"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={adesivosPorCartela}
                onChange={(e) => setAdesivosPorCartela(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Multiplicador informativo do total.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select
              value={materialId}
              onValueChange={(v) => v && setMaterialId(v)}
              items={materiaisItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
            <Select
              value={impressaoId}
              onValueChange={(v) => v && setImpressaoId(v)}
              items={impressoesItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {impressoes.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Acabamento (opcional)</Label>
            <Select
              value={acabamentoId}
              onValueChange={(v) => v && setAcabamentoId(v)}
              items={acabamentosItems}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Sem acabamento adicional</SelectItem>
                {acabamentos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="margemC">Margem (%)</Label>
            <Input
              id="margemC"
              type="number"
              min="0"
              step="1"
              value={margemPct}
              onChange={(e) => setMargemPct(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mínima configurada: <strong>{margemMinimaPct}%</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resultado</CardDescription>
            <CardTitle className="text-4xl font-bold tabular-nums">
              {resultado ? formatBRL(resultado.precoTotal) : "—"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {resultado
                ? `${formatBRL(resultado.precoUnitario)} por cartela · ${formatBRL(resultado.precoPorAdesivo)} por adesivo`
                : "Preencha os campos para calcular"}
            </p>
          </CardHeader>
          {resultado ? (
            <CardContent className="space-y-4">
              {resultado.margemAbaixoDaMinima && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-sm">
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <strong>Margem ajustada pela mínima.</strong> Pediu {margemPct}%, sistema aplicou{" "}
                    {resultado.margemPct.toFixed(0)}%.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <KV label="Cartelas" value={`${quantidadeCartelas} un`} />
                <KV
                  label="Total de adesivos"
                  value={resultado.adesivosTotais.toLocaleString("pt-BR")}
                />
                <KV label="Área por cartela" value={formatM2(resultado.areaUnitariaM2)} />
                <KV label="Aproveitamento" value={formatPct(resultado.aproveitamentoPct)} />
                <KV label="Margem aplicada" value={formatPct(resultado.margemPct)} />
                <KV label="Bobina consumida" value={formatM2(resultado.areaTotalM2)} />
              </div>

              <Separator />

              <div className="space-y-1.5 text-sm">
                <h4 className="font-medium mb-2">Composição de custo (interno)</h4>
                <Row label="Material" value={formatBRL(resultado.custoMaterial)} />
                <Row label="Impressão" value={formatBRL(resultado.custoImpressao)} />
                {resultado.custoAcabamento > 0 && (
                  <Row label="Acabamento" value={formatBRL(resultado.custoAcabamento)} />
                )}
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
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nomeC2">Nome do cliente</Label>
                <Input
                  id="nomeC2"
                  placeholder="ex: Maria"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="foneC2">WhatsApp (opcional)</Label>
                <Input
                  id="foneC2"
                  placeholder="ex: 11 98765-4321"
                  inputMode="tel"
                  value={telefoneCliente}
                  onChange={(e) => setTelefoneCliente(e.target.value)}
                />
              </div>
            </div>

            <Textarea value={textoWhatsApp} readOnly rows={11} className="font-mono text-xs" />

            <div className="flex gap-2">
              <Button onClick={copiarTexto} variant="outline" className="flex-1" disabled={!textoWhatsApp}>
                <Copy className="size-4" /> Copiar texto
              </Button>
              <Button onClick={abrirWhatsApp} className="flex-1" disabled={!textoWhatsApp}>
                <MessageCircle className="size-4" /> Abrir no WhatsApp
              </Button>
            </div>
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
