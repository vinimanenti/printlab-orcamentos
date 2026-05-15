"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { salvarLogoEmpresa, removerLogoEmpresa } from "@/lib/actions/empresa";

/**
 * Upload e gerenciamento da logo da empresa.
 *
 * Comportamento:
 *   - Sem logo: mostra placeholder + botão de upload
 *   - Com logo: mostra preview + botão "Trocar" e "Remover"
 *   - PDF e telas usam a logo customizada se existir; senão, fallback
 *     no desenho "Print ●●●● Lab"
 */
export function LogoUpload({
  current,
  podeEditar,
}: {
  current: string | null;
  podeEditar: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const r = await salvarLogoEmpresa(formData);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Logo atualizada");
      setFileName(null);
      // Limpa o input
      const input = document.getElementById("logo-input") as HTMLInputElement | null;
      if (input) input.value = "";
      router.refresh();
    });
  }

  function handleRemover() {
    if (!confirm("Remover a logo atual? O PDF voltará a usar o desenho padrão da PrintLab.")) {
      return;
    }
    startTransition(async () => {
      const r = await removerLogoEmpresa();
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Logo removida");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="size-4" /> Logo no PDF
        </CardTitle>
        <CardDescription>
          Imagem que aparece no cabeçalho do PDF de orçamento. Se vazio, usa
          o desenho padrão <span className="font-semibold">Print ●●●● Lab</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PREVIEW */}
        <div className="border rounded-md bg-muted/40 p-6 flex items-center justify-center min-h-32">
          {current ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={current}
              alt="Logo da empresa"
              className="max-h-24 max-w-full object-contain"
            />
          ) : (
            <div className="text-center text-muted-foreground space-y-1">
              <ImageIcon className="size-8 mx-auto opacity-50" />
              <p className="text-xs">Nenhuma logo enviada</p>
              <p className="text-[10px]">Usando desenho padrão</p>
            </div>
          )}
        </div>

        {/* UPLOAD FORM */}
        {podeEditar && (
          <form action={handleUpload} encType="multipart/form-data" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="logo-input">
                {current ? "Trocar logo" : "Enviar logo"}
              </Label>
              <Input
                id="logo-input"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                required
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou WebP. Até 2MB. Ideal: fundo transparente,
                proporção horizontal (~3:1), altura mínima 200px.
              </p>
              {fileName && (
                <p className="text-xs text-cyan">📎 {fileName}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={pending} className="flex-1">
                <Upload className="size-4" />
                {pending ? "Enviando…" : current ? "Trocar logo" : "Enviar logo"}
              </Button>
              {current && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={handleRemover}
                  title="Remover logo personalizada"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
