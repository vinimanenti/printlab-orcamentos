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
import { MaterialDialog } from "./material-dialog";
import { AtivoToggle } from "../_components/ativo-toggle";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Materiais" };

export default async function MateriaisPage() {
  const user = await verifySession();
  const isAdmin = user.perfil === "ADM";

  const materiais = await prisma.material.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <div className="min-h-screen">
      <AppHeader
        user={user}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Materiais" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Catálogo"
          title="Materiais"
          description={
            <>
              {materiais.length} cadastrados.{" "}
              {!isAdmin && (
                <span className="text-yellow">Somente leitura — apenas administradores podem editar.</span>
              )}
            </>
          }
          actions={isAdmin && <MaterialDialog variant="new" />}
        />

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Preço/m²</TableHead>
                <TableHead className="text-right">Bobina (cm)</TableHead>
                <TableHead className="text-right">Estoque mín. (m²)</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiais.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum material cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                materiais.map((m) => (
                  <TableRow key={m.id} className={!m.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{m.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(m.precoM2))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(m.larguraBobinaCm).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {Number(m.estoqueMinimoM2).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <AtivoToggle id={m.id} ativo={m.ativo} entidade="material" />
                      ) : m.ativo ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <MaterialDialog
                          material={{
                            id: m.id,
                            nome: m.nome,
                            precoM2: Number(m.precoM2),
                            larguraBobinaCm: Number(m.larguraBobinaCm),
                            estoqueMinimoM2: Number(m.estoqueMinimoM2),
                            ativo: m.ativo,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
