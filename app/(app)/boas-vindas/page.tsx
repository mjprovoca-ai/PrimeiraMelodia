import type { Metadata } from "next";
import EscolherMundo from "@/components/EscolherMundo";
import { meuPerfil } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Escolha seu mundo" };

export default async function BoasVindas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const perfil = await meuPerfil();
  const volta = sp.volta && sp.volta.startsWith("/") && !sp.volta.startsWith("//") ? sp.volta : "/criar";
  const primeiro = (perfil?.nome || "").split(" ")[0];
  return (
    <>
      <p className="olho">{sp.trocar ? "Trocar de mundo" : "Boas-vindas"}</p>
      <h1 className="titulo">{sp.trocar ? "Para qual mundo vamos?" : `Que bom ter você aqui${primeiro ? `, ${primeiro}` : ""}!`}</h1>
      <p className="sub">Escolha o seu mundo. Cada música que você criar faz ele crescer: uma árvore, um peixe, um bicho ou uma estrela.</p>
      <EscolherMundo atual={perfil?.mundo ?? null} volta={volta} trocar={Boolean(sp.trocar)} />
    </>
  );
}
