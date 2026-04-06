import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnero",
  description: "SaaS multi-tenant para gestion de turnos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
