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
import { ImpressaoDialog } from "./impressao-dialog";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Tipos de impressão" };

export default async function ImpressoesPage() {
  const user = await verifySession();
  const isAdmin = user.perfil === "ADM";

  const items = await prisma.tipoImpressao.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Tipos de impressão" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Catálogo"
          title="Tipos de impressão"
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
          actions={isAdmin && <ImpressaoDialog variant="new" />}
        />

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Custo/m²</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id} className={!i.ativo ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(i.precoM2))}
                  </TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <AtivoToggle id={i.id} ativo={i.ativo} entidade="impressao" />
                    ) : i.ativo ? (
                      <Badge>Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && (
                      <ImpressaoDialog
                        impressao={{
                          id: i.id,
                          nome: i.nome,
                          precoM2: Number(i.precoM2),
                          ativo: i.ativo,
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
