import type { Metadata } from "next";
import PalcoTela from "@/components/PalcoTela";
import TabBar from "@/components/TabBar";
import Creditos from "@/components/Creditos";
import { meuPerfil } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Palco · Boate Primeira Melodia",
  description: "Todas as músicas criadas no Primeira Melodia tocando ao vivo, uma depois da outra, com karaokê.",
};

export default async function Palco() {
  const perfil = await meuPerfil();
  return (
    <>
      <main className={`app${perfil ? "" : " sem-abas"}`}>
        <PalcoTela logado={Boolean(perfil)} />
        <Creditos />
      </main>
      {perfil ? <TabBar naoLidas={perfil.nao_lidas} /> : null}
    </>
  );
}
