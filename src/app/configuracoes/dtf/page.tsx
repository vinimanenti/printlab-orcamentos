import Link from "next/link";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DTF_PRICING } from "@/lib/dtf";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { DtfPrecosForm } from "./precos-form";

export const metadata = { title: "Preços DTF" };

export default async function DtfPrecosPage() {
  const user = await verifySession();
  const config = await prisma.configuracaoSistema.findUnique({ where: { id: "singleton" } });
  const initial = config ? {
    cliente: Number(config.dtfClienteMetro),
    revendedor: Number(config.dtfRevendedorMetro),
    abaixo10Cm: Number(config.dtfAbaixo10CmMetro),
  } : DEFAULT_DTF_PRICING;

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[
        { href: "/configuracoes", label: "Configurações" },
        { label: "Preços DTF" },
      ]} />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow="Sistema"
          title="Preços DTF"
          description="Defina os valores por metro linear usados nas cotações DTF."
          actions={<Link href="/calculadora?tipo=dtf" className="text-sm underline underline-offset-4">Abrir calculadora DTF</Link>}
        />
        <DtfPrecosForm initial={initial} podeEditar={user.perfil === "ADM"} />
      </main>
    </div>
  );
}
