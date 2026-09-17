"use client";

import { useActionState, useState } from "react";
import { salvarPrecosDtf, type DtfActionResult } from "@/lib/actions/dtf";
import type { DtfPricing } from "@/lib/dtf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const campos = [
  { name: "cliente", label: "Cliente final (R$/m)" },
  { name: "revendedor", label: "Revendedor (R$/m)" },
  { name: "abaixo10Cm", label: "Abaixo de 10 cm (R$/m)" },
] as const;

export function DtfPrecosForm({ initial, podeEditar }: { initial: DtfPricing; podeEditar: boolean }) {
  const [values, setValues] = useState(() => ({
    cliente: initial.cliente.toFixed(2).replace(".", ","),
    revendedor: initial.revendedor.toFixed(2).replace(".", ","),
    abaixo10Cm: initial.abaixo10Cm.toFixed(2).replace(".", ","),
  }));
  const [state, action, pending] = useActionState<DtfActionResult | undefined, FormData>(salvarPrecosDtf, undefined);

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tarifas por metro linear</CardTitle>
          <CardDescription>Os valores salvos passam a valer para toda a equipe ao abrir a calculadora.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <fieldset disabled={!podeEditar || pending} className="grid gap-4 sm:grid-cols-3">
            <legend className="sr-only">Preços DTF em reais por metro</legend>
            {campos.map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type="text"
                  inputMode="decimal"
                  required
                  maxLength={9}
                  value={values[name]}
                  onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
                />
              </div>
            ))}
          </fieldset>
          <p className="text-sm text-muted-foreground">
            A tarifa abaixo de 10 cm vale para cliente final e revendedor e considera a metragem total do orçamento, incluindo os espaços entre adesivos. A partir de 10 cm, vale a tarifa do tipo de cliente. Não há desconto por quantidade.
          </p>
          {!podeEditar && <p className="text-sm text-muted-foreground">Somente leitura — apenas administradores podem alterar os preços.</p>}
        </CardContent>
      </Card>
      {state && "error" in state && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state && "ok" in state && <p role="status" className="text-sm text-green-700 dark:text-green-400">Preços DTF salvos com sucesso.</p>}
      {podeEditar && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar preços"}</Button>
        </div>
      )}
    </form>
  );
}
