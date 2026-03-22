import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FGSystem",
  description: "Sistema de gestión de pacientes y plantillas",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="es" className={`${geistSans.variable} h-full`}>
      <body className="h-full flex bg-gray-50">
        {user && <Sidebar />}
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </body>
    </html>
  );
}
