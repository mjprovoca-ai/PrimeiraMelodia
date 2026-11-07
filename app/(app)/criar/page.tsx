import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CriarWizard from "@/components/CriarWizard";
import { meuPerfil } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Criar" };

export default async function Criar() {
  const perfil = await meuPerfil();
  if (!perfil) redirect("/entrar?volta=/criar");
  if (!perfil.mundo) redirect("/boas-vindas?volta=/criar");
  const primeiroNome = (perfil.nome || "").split(" ")[0] || "artista";
  return (
    <>
      <p className="olho">Primeira Melodia</p>
      <h1 className="titulo">Vamos criar sua música</h1>
      <p className="sub">Olá, {primeiroNome}. Um passo de cada vez.</p>
      <CriarWizard creditos={perfil.creditos} />
    </>
  );
}
