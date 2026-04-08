import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { FilterProvider } from "@/providers/filter-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { AppShellProvider } from "@/providers/app-shell-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard | Rendichicas",
  description: "Panel de control para estaciones de servicio Rendichicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
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
