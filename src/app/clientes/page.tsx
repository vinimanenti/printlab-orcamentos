import Link from "next/link";
import { Search } from "lucide-react";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClienteDialog } from "./cliente-dialog";
import { PageHeader } from "@/components/page-header";

export const metadata = { title: "Clientes" };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; arquivados?: string }>;
}) {
  const user = await verifySession();
  const { q = "", arquivados } = await searchParams;
  const podeEditar = user.perfil === "ADM" || user.perfil === "VEN";

  const termo = q.trim();
  const soDigitos = termo.replace(/\D/g, "");
  const where = {
    AND: [
      arquivados === "1" ? {} : { ativo: true },
      termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              soDigitos.length >= 4 ? { telefone: { contains: soDigitos } } : null,
              soDigitos.length >= 4 ? { whatsapp: { contains: soDigitos } } : null,
              soDigitos.length >= 4 ? { documento: { contains: soDigitos } } : null,
            ].filter((c): c is NonNullable<typeof c> => c !== null),
          }
        : {},
    ],
  };

  const clientes = await prisma.cliente.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    take: 200,
  });

  return (
    <div className="min-h-screen">
      <AppHeader user={user} breadcrumbs={[{ label: "Clientes" }]} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Cadastro"
          title="Clientes"
          description={
            <>
              {clientes.length} {termo ? "resultado(s)" : "ativo(s)"}.{" "}
              {!podeEditar && (
                <span className="text-yellow">Somente leitura para seu perfil.</span>
              )}
            </>
          }
          actions={podeEditar && <ClienteDialog variant="new" />}
        />

        <form className="flex gap-2 max-w-xl" action="/clientes" method="get">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Buscar por nome, telefone, CPF/CNPJ…"
              defaultValue={termo}
              className="pl-9"
            />
          </div>
          {arquivados === "1" && <input type="hidden" name="arquivados" value="1" />}
        </form>

        <div className="flex items-center gap-3 text-sm">
          {arquivados === "1" ? (
            <Link href={`/clientes${termo ? `?q=${encodeURIComponent(termo)}` : ""}`} className="underline">
              Mostrar apenas ativos
            </Link>
          ) : (
            <Link
              href={`/clientes?arquivados=1${termo ? `&q=${encodeURIComponent(termo)}` : ""}`}
              className="text-muted-foreground hover:underline"
            >
              Incluir arquivados
            </Link>
          )}
        </div>

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {termo
                      ? `Nenhum cliente encontrado para "${termo}".`
                      : "Nenhum cliente cadastrado ainda."}
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((c) => (
                  <TableRow key={c.id} className={!c.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {c.nome}
                      {!c.ativo && (
                        <Badge variant="secondary" className="ml-2">
                          arquivado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.tipo === "PJ" ? "Empresa" : "PF"}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{c.telefone}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {c.whatsapp || "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDoc(c.documento, c.tipo)}
                    </TableCell>
                    <TableCell className="text-right">
                      {podeEditar && (
                        <ClienteDialog
                          cliente={{
                            id: c.id,
                            tipo: c.tipo,
                            nome: c.nome,
                            documento: c.documento,
                            email: c.email,
                            telefone: c.telefone,
                            whatsapp: c.whatsapp,
                            observacoes: c.observacoes,
                            ativo: c.ativo,
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

function formatDoc(doc: string | null, tipo: "PF" | "PJ"): string {
  if (!doc) return "—";
  const d = doc.replace(/\D/g, "");
  if (tipo === "PJ" && d.length === 14) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  }
  if (tipo === "PF" && d.length === 11) {
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }
  return d;
}
