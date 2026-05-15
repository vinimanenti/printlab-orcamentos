import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculadoraForm } from "./calculadora-form";
import { CartelaForm } from "./cartela-form";

export const metadata = { title: "Calculadora" };

export default async function CalculadoraPage() {
  const user = await verifySession();

  const [materiaisRaw, impressoesRaw, acabamentosRaw, config] = await Promise.all([
    prisma.material.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.tipoImpressao.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.acabamento.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.configuracaoSistema.findUnique({ where: { id: "singleton" } }),
  ]);

  const materiais = materiaisRaw.map((m) => ({
    id: m.id,
    nome: m.nome,
    precoM2: Number(m.precoM2),
    larguraBobinaCm: Number(m.larguraBobinaCm),
  }));
  const impressoes = impressoesRaw.map((i) => ({
    id: i.id,
    nome: i.nome,
    precoM2: Number(i.precoM2),
  }));
  const acabamentos = acabamentosRaw.map((a) => ({
    id: a.id,
    nome: a.nome,
    precoM2: a.precoM2 ? Number(a.precoM2) : null,
    precoFixo: a.precoFixo ? Number(a.precoFixo) : null,
  }));

  const margemMinimaPct = config ? Number(config.margemMinimaPct) : 20;
  const empresaNome = config?.empresaNome ?? "PrintLab";

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Calculadora" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <Tabs defaultValue="m2" className="space-y-4">
          <TabsList>
            <TabsTrigger value="m2">Por medida (m²)</TabsTrigger>
            <TabsTrigger value="cartela">Por cartela</TabsTrigger>
          </TabsList>
          <TabsContent value="m2">
            <CalculadoraForm
              materiais={materiais}
              impressoes={impressoes}
              acabamentos={acabamentos}
              margemMinimaPct={margemMinimaPct}
              empresaNome={empresaNome}
            />
          </TabsContent>
          <TabsContent value="cartela">
            <CartelaForm
              materiais={materiais}
              impressoes={impressoes}
              acabamentos={acabamentos}
              margemMinimaPct={margemMinimaPct}
              empresaNome={empresaNome}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
