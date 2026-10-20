import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import { meuPerfil } from "@/lib/supabase/server";
import { IcVoltar } from "@/components/Icones";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await meuPerfil();
  if (!perfil) redirect("/entrar?volta=/admin&admin=1");
  if (perfil.role !== "admin") redirect("/perfil");
  return (
    <main className="app admin sem-abas">
      <Link href="/perfil" className="voltar"><IcVoltar /> Voltar ao app</Link>
      <p className="olho mt20">Administração</p>
      <h1 className="titulo">Painel da Primeira Melodia</h1>
      <AdminNav />
      <div className="mt24">{children}</div>
    </main>
  );
}
