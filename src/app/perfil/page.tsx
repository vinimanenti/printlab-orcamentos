import { Lock, User } from "lucide-react";
import { verifySession } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { SenhaForm } from "./senha-form";

export const metadata = { title: "Meu perfil" };

const PERFIL_LABELS: Record<string, string> = {
  ADM: "Administrador",
  VEN: "Vendedor",
  PRO: "Produção",
  FIN: "Financeiro",
};

export default async function PerfilPage() {
  const user = await verifySession();

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Meu perfil" }]} />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow="Conta"
          title="Meu perfil"
          description="Suas informações de acesso ao sistema."
        />

        <div className="grid gap-6 sm:grid-cols-[1fr_2fr]">
          {/* COLUNA 1: dados do usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="size-4" /> Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="label-eyebrow mb-1">Nome</p>
                <p className="font-medium">{user.nome}</p>
              </div>
              <div>
                <p className="label-eyebrow mb-1">E-mail</p>
                <p className="font-mono text-xs">{user.email}</p>
              </div>
              <div>
                <p className="label-eyebrow mb-1">Perfil</p>
                <Badge variant="outline">{PERFIL_LABELS[user.perfil] ?? user.perfil}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* COLUNA 2: troca de senha */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="size-4" /> Alterar senha
              </CardTitle>
              <CardDescription>
                Para sua segurança, informe sua senha atual antes de definir uma nova.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SenhaForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
