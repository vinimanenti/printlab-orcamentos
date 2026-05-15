"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Building2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { salvarEmpresa, type EmpresaActionResult } from "@/lib/actions/empresa";

export type EmpresaInitial = {
  empresaNome: string;
  empresaCnpj: string | null;
  empresaTelefone: string;
  empresaEmail: string | null;
  empresaEndereco: string | null;
  margemMinimaPct: number;
  prefixoOrcamento: string;
  prefixoPedido: string;
  validadeOrcamentoDias: number;
  validadeAprovacaoDias: number;
};

export function EmpresaForm({
  initial,
  podeEditar,
}: {
  initial: EmpresaInitial;
  podeEditar: boolean;
}) {
  const [state, action, pending] = useActionState<EmpresaActionResult | undefined, FormData>(
    async (prev, formData) => {
      const r = await salvarEmpresa(prev, formData);
      if (r && "ok" in r) {
        toast.success("Dados da empresa atualizados");
      }
      return r;
    },
    undefined,
  );

  return (
    <form action={action} className="space-y-6">
      {/* DADOS DA EMPRESA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4" /> Dados da empresa
          </CardTitle>
          <CardDescription>
            Aparecem no cabeçalho do PDF de orçamento e em mensagens automáticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="empresaNome">Razão social / Nome</Label>
            <Input
              id="empresaNome"
              name="empresaNome"
              required
              defaultValue={initial.empresaNome}
              disabled={!podeEditar}
              placeholder="PRINTLAB LTDA"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="empresaCnpj">CNPJ</Label>
              <Input
                id="empresaCnpj"
                name="empresaCnpj"
                defaultValue={initial.empresaCnpj ?? ""}
                disabled={!podeEditar}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empresaTelefone">Telefone / WhatsApp</Label>
              <Input
                id="empresaTelefone"
                name="empresaTelefone"
                required
                defaultValue={initial.empresaTelefone}
                disabled={!podeEditar}
                placeholder="(14) 99153-5620"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresaEmail">E-mail (opcional)</Label>
            <Input
              id="empresaEmail"
              name="empresaEmail"
              type="email"
              defaultValue={initial.empresaEmail ?? ""}
              disabled={!podeEditar}
              placeholder="contato@printlab.com.br"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="empresaEndereco">Endereço completo</Label>
            <Textarea
              id="empresaEndereco"
              name="empresaEndereco"
              rows={2}
              defaultValue={initial.empresaEndereco ?? ""}
              disabled={!podeEditar}
              placeholder="Rua Getúlio Vargas 461 - José Ribeiro - Garça - SP - 17404-524"
            />
            <p className="text-xs text-muted-foreground">
              Tudo numa linha — quebra automaticamente no PDF.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* REGRAS DO SISTEMA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="size-4" /> Regras do sistema
          </CardTitle>
          <CardDescription>
            Padrões aplicados em novos orçamentos e pedidos. Pode mudar a qualquer momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="margemMinimaPct">Margem mínima protegida (%)</Label>
            <Input
              id="margemMinimaPct"
              name="margemMinimaPct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              required
              defaultValue={initial.margemMinimaPct}
              disabled={!podeEditar}
            />
            <p className="text-xs text-muted-foreground">
              A calculadora sempre eleva a margem para este valor se você pedir menos —
              protege contra vender abaixo do custo.
            </p>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="validadeOrcamentoDias">Validade padrão do orçamento (dias)</Label>
              <Input
                id="validadeOrcamentoDias"
                name="validadeOrcamentoDias"
                type="number"
                min="1"
                max="365"
                required
                defaultValue={initial.validadeOrcamentoDias}
                disabled={!podeEditar}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validadeAprovacaoDias">Validade do link de aprovação de arte (dias)</Label>
              <Input
                id="validadeAprovacaoDias"
                name="validadeAprovacaoDias"
                type="number"
                min="1"
                max="90"
                required
                defaultValue={initial.validadeAprovacaoDias}
                disabled={!podeEditar}
              />
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prefixoOrcamento">Prefixo de orçamento</Label>
              <Input
                id="prefixoOrcamento"
                name="prefixoOrcamento"
                required
                maxLength={8}
                defaultValue={initial.prefixoOrcamento}
                disabled={!podeEditar}
                placeholder="ORC"
              />
              <p className="text-xs text-muted-foreground">Aparece como ORC-0042</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prefixoPedido">Prefixo de pedido</Label>
              <Input
                id="prefixoPedido"
                name="prefixoPedido"
                required
                maxLength={8}
                defaultValue={initial.prefixoPedido}
                disabled={!podeEditar}
                placeholder="PED"
              />
              <p className="text-xs text-muted-foreground">Aparece como PED-0042</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {state && "error" in state ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      {podeEditar && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      )}
    </form>
  );
}
