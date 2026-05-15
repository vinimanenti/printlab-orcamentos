import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Entrar — PrintLab Orçamentos",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // Em Next.js 16, searchParams é Promise.
  const params = await searchParams;
  const session = await getSession();
  if (session) redirect(params.next ?? "/");

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">PrintLab Orçamentos</CardTitle>
          <CardDescription>Entre para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm next={params.next} />
        </CardContent>
      </Card>
    </main>
  );
}
