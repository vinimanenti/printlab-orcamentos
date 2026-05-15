import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/**
 * Tipografia PrintLab:
 *   - Manrope: sans-serif geométrica moderna, com 8 pesos.
 *     Caracteres limpos, alturas-x equilibradas, sem caudas/serifas.
 *   - JetBrains Mono: monoespaçada moderna para números/preços e códigos.
 */
const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s — PrintLab Orçamentos",
    default: "PrintLab Orçamentos",
  },
  description: "Sistema de orçamentos, pedidos e cálculo de adesivos da PrintLab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
