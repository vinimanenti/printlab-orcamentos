import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PrintLabMark } from "@/components/brand/printlab-mark";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar — PrintLab Orçamentos",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session) redirect(params.next ?? "/");

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* ============= LADO BRAND ============= */}
      <aside className="hidden lg:flex relative bg-[oklch(0.18_0.005_80)] text-white overflow-hidden">
        {/* Faixa CMYK lateral esquerda */}
        <div className="absolute left-0 top-0 bottom-0 w-3 flex flex-col">
          <div className="flex-1 bg-cyan" />
          <div className="flex-1 bg-magenta" />
          <div className="flex-1 bg-yellow" />
          <div className="flex-1 bg-white" />
        </div>

        <div className="flex flex-col justify-between p-12 pl-16 w-full max-w-2xl mx-auto">
          <div className="space-y-12">
            <div className="text-white">
              <PrintLabMark variant="wordmark" className="text-2xl" />
            </div>

            <div className="space-y-6">
              <h1 className="display-2xl">
                Orçar.
                <br />
                Imprimir.
                <br />
                Entregar.
              </h1>
              <p className="text-white/60 text-lg max-w-md leading-relaxed">
                Sistema interno da PrintLab para cotação, pedidos, aprovação de
                arte e produção de adesivos, etiquetas e impressos.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rule-thick border-white" />
            <div className="grid grid-cols-4 gap-px text-[10px] uppercase tracking-[0.15em] text-white/50 font-mono">
              <div>C 100</div>
              <div>M 100</div>
              <div>Y 100</div>
              <div>K 100</div>
            </div>
            <p className="text-xs text-white/40 font-mono">
              PrintLab Orçamentos · v0.1
            </p>
          </div>
        </div>
      </aside>

      {/* ============= FORM ============= */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Marca pequena no mobile */}
          <div className="lg:hidden">
            <PrintLabMark variant="wordmark" className="text-xl" />
          </div>

          <div className="space-y-2">
            <p className="label-eyebrow">Acesso restrito</p>
            <h2 className="display-lg">Entrar no sistema</h2>
            <p className="text-muted-foreground text-sm">
              Use suas credenciais da PrintLab.
            </p>
          </div>

          <LoginForm next={params.next} />

          <div className="rule-thin" />

          <p className="text-xs text-muted-foreground">
            Problema para entrar? Fale com o administrador.
          </p>
        </div>
      </section>
    </main>
  );
}
