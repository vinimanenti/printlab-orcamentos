import Link from "next/link";

export const metadata = { title: "Sem permissão" };

export default function SemPermissaoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-sm">
        <h1 className="text-2xl font-semibold">Sem permissão</h1>
        <p className="text-muted-foreground">
          Seu perfil não tem acesso a esta área. Fale com o administrador.
        </p>
        <Link href="/" className="text-sm underline">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
