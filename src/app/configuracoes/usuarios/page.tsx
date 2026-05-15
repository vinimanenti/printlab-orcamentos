import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PERFIL_LABELS } from "@/lib/actions/usuarios";
import { UsuarioDialog } from "./usuario-dialog";
import { ResetSenhaDialog } from "./reset-senha-dialog";
import { AtivoToggleUsuario } from "./ativo-toggle-usuario";

export const metadata = { title: "Usuários" };

const PERFIL_VARIANTS = {
  ADM: { className: "bg-foreground text-background border-foreground" },
  VEN: { className: "bg-cyan text-white border-cyan" },
  PRO: { className: "border-yellow text-yellow" },
  FIN: { className: "" },
} as const;

export default async function UsuariosPage() {
  const me = await verifySession();
  if (me.perfil !== "ADM") {
    redirect("/sem-permissao");
  }

  const usuarios = await prisma.user.findMany({
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  const ativos = usuarios.filter((u) => u.ativo).length;

  return (
    <div className="min-h-screen">
      <AppHeader
        user={me}
        breadcrumbs={[
          { href: "/configuracoes", label: "Configurações" },
          { label: "Usuários" },
        ]}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-5">
        <PageHeader
          eyebrow="Equipe"
          title="Usuários"
          description={
            <>
              {usuarios.length} cadastrado(s), {ativos} ativo(s). Apenas você (admin) acessa esta tela.
            </>
          }
          actions={<UsuarioDialog variant="new" />}
        />

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-40 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const variantCls = PERFIL_VARIANTS[u.perfil]?.className ?? "";
                const isMe = u.id === me.id;
                return (
                  <TableRow key={u.id} className={!u.ativo ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {u.nome}
                      {isMe && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.perfil === "ADM" ? "default" : "outline"}
                        className={variantCls}
                      >
                        {PERFIL_LABELS[u.perfil]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.perfil === "VEN" ? (
                        `${Number(u.comissaoPct).toFixed(1)}%`
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(u.criadoEm, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <AtivoToggleUsuario id={u.id} ativo={u.ativo} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <ResetSenhaDialog userId={u.id} userNome={u.nome} />
                      <UsuarioDialog
                        usuario={{
                          id: u.id,
                          nome: u.nome,
                          email: u.email,
                          perfil: u.perfil,
                          telefone: u.telefone,
                          comissaoPct: Number(u.comissaoPct),
                          ativo: u.ativo,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <details className="text-xs text-muted-foreground bg-muted/40 rounded-md p-4">
          <summary className="cursor-pointer label-eyebrow">
            Quem pode o quê?
          </summary>
          <ul className="mt-3 space-y-2">
            <li><strong>Administrador</strong> — Acesso total: configurações, usuários, preços, todos os dados.</li>
            <li><strong>Vendedor</strong> — Cria clientes, orçamentos e pedidos. Vê os pedidos que ele mesmo lançou.</li>
            <li><strong>Produção</strong> — Visualiza pedidos e atualiza etapas de produção. Não vê valores.</li>
            <li><strong>Financeiro</strong> — Visualiza tudo + registra pagamentos. Não edita orçamentos.</li>
          </ul>
        </details>
      </main>
    </div>
  );
}
