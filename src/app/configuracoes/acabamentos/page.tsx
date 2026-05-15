import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/calculadoras";
import { AtivoToggle } from "../_components/ativo-toggle";
import { AcabamentoDialog } from "./acabamento-dialog";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Acabamentos" };

export default async function AcabamentosPage() {
  const user = await verifySession();
  const isAdmin = user.perfil === "ADM";

  const items = await prisma.acabamento.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Acabamentos" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Catálogo"
          title="Acabamentos"
          description={
            <>
              {items.length} cadastrados.{" "}
              {!isAdmin && (
                <span className="text-yellow">
                  Somente leitura — apenas administradores podem editar.
                </span>
              )}
            </>
          }
          actions={isAdmin && <AcabamentoDialog variant="new" />}
        />

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Preço/m²</TableHead>
                <TableHead className="text-right">Preço fixo (un)</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} className={!a.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.precoM2 ? formatBRL(Number(a.precoM2)) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.precoFixo ? formatBRL(Number(a.precoFixo)) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <AtivoToggle id={a.id} ativo={a.ativo} entidade="acabamento" />
                    ) : a.ativo ? (
                      <Badge>Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <AcabamentoDialog
                        acabamento={{
                          id: a.id,
                          nome: a.nome,
                          precoM2: a.precoM2 ? Number(a.precoM2) : null,
                          precoFixo: a.precoFixo ? Number(a.precoFixo) : null,
                          ativo: a.ativo,
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
