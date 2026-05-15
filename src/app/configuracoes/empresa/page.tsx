import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { EmpresaForm } from "./empresa-form";

export const metadata = { title: "Empresa" };

export default async function EmpresaPage() {
  const user = await verifySession();
  const podeEditar = user.perfil === "ADM";

  const config = await prisma.configuracaoSistema.findUnique({
    where: { id: "singleton" },
  });

  // Caso o singleton ainda não exista (seed não rodado), entrega defaults
  const initial = {
    empresaNome: config?.empresaNome ?? "",
    empresaCnpj: config?.empresaCnpj ?? null,
    empresaTelefone: config?.empresaTelefone ?? "",
    empresaEmail: config?.empresaEmail ?? null,
    empresaEndereco: config?.empresaEndereco ?? null,
    margemMinimaPct: config ? Number(config.margemMinimaPct) : 20,
    prefixoOrcamento: config?.prefixoOrcamento ?? "ORC",
    prefixoPedido: config?.prefixoPedido ?? "PED",
    validadeOrcamentoDias: config?.validadeOrcamentoDias ?? 7,
    validadeAprovacaoDias: config?.validadeAprovacaoDias ?? 7,
  };

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Empresa" },
        ]}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <PageHeader
          eyebrow="Sistema"
          title="Dados da empresa"
          description={
            podeEditar ? (
              "Esses dados aparecem no cabeçalho do PDF de orçamento e em mensagens automáticas para o cliente."
            ) : (
              <span className="text-yellow">Somente leitura — apenas administradores podem editar.</span>
            )
          }
        />

        <EmpresaForm initial={initial} podeEditar={podeEditar} />
      </main>
    </div>
  );
}
