import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateDialog } from "./template-dialog";

export const metadata = { title: "Templates de mensagem" };

export default async function TemplatesPage() {
  const user = await verifySession();
  const isAdmin = user.perfil === "ADM";

  const templates = await prisma.mensagemTemplate.findMany({
    orderBy: { chave: "asc" },
  });

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Templates de mensagem" },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Templates de mensagem</h1>
          <p className="text-muted-foreground text-sm">
            Textos prontos enviados ao cliente pelo WhatsApp. Use{" "}
            <code className="bg-muted px-1 rounded">{"{{variavel}}"}</code> para campos
            substituídos automaticamente. Variáveis disponíveis variam por template.
          </p>
          {!isAdmin && (
            <p className="text-amber-700 text-sm mt-2">
              Somente leitura — apenas administradores podem editar.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {templates.map((t) => (
            <Card key={t.id} className={!t.ativo ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {t.nome}
                      {!t.ativo && <Badge variant="secondary">inativo</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <code className="text-xs">{t.chave}</code>
                    </CardDescription>
                  </div>
                  {isAdmin && <TemplateDialog template={t} />}
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap font-sans bg-muted/40 rounded p-3 leading-relaxed">
                  {t.corpo}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
