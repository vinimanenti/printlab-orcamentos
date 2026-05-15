import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { NovoOrcamentoForm, type ClienteOption, type CatalogoData } from "./form";

export const metadata = { title: "Novo orçamento" };

export default async function NovoOrcamentoPage() {
  const user = await verifySession();
  if (user.perfil === "PRO" || user.perfil === "FIN") {
    redirect("/orcamentos?erro=sem-permissao");
  }

  const [clientesRaw, materiaisRaw, impressoesRaw, acabamentosRaw, config] = await Promise.all([
    prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, tipo: true, telefone: true },
    }),
    prisma.material.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.tipoImpressao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.acabamento.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.configuracaoSistema.findUnique({ where: { id: "singleton" } }),
  ]);

  const clientes: ClienteOption[] = clientesRaw;
  const catalogo: CatalogoData = {
    materiais: materiaisRaw.map((m) => ({
      id: m.id,
      nome: m.nome,
      precoM2: Number(m.precoM2),
      larguraBobinaCm: Number(m.larguraBobinaCm),
    })),
    impressoes: impressoesRaw.map((i) => ({ id: i.id, nome: i.nome, precoM2: Number(i.precoM2) })),
    acabamentos: acabamentosRaw.map((a) => ({
      id: a.id,
      nome: a.nome,
      precoM2: a.precoM2 ? Number(a.precoM2) : null,
      precoFixo: a.precoFixo ? Number(a.precoFixo) : null,
    })),
    margemMinimaPct: config ? Number(config.margemMinimaPct) : 20,
    validadeOrcamentoDias: config?.validadeOrcamentoDias ?? 7,
  };

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/orcamentos", label: "Orçamentos" },
          { label: "Novo" },
        ]}
      />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <NovoOrcamentoForm clientes={clientes} catalogo={catalogo} />
      </main>
    </div>
  );
}
