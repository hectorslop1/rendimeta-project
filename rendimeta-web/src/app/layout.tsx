import type { Metadata } from "next";
import { Space_Grotesk, Manrope, Geist } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { FilterProvider } from "@/providers/filter-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppShellProvider } from "@/providers/app-shell-provider";
import "./globals.css";
import { cn } from "@/lib/utils";

// Configurar fuentes de Google
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Rendimeta",
  description: "Sistema de gestión y productividad para estaciones de servicio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("h-full antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <body
        className={`min-h-full flex flex-col ${geist.variable} ${spaceGrotesk.variable}`}
      >
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <AppShellProvider>
                <FilterProvider>{children}</FilterProvider>
              </AppShellProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
