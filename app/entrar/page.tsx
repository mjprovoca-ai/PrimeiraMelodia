import type { Metadata } from "next";
import EntrarForm from "@/components/EntrarForm";
import Creditos from "@/components/Creditos";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const volta = sp.volta && sp.volta.startsWith("/") && !sp.volta.startsWith("//") ? sp.volta : "/criar";
  return (
    <main className="app sem-abas">
      <EntrarForm modoInicial={sp.modo === "cadastrar" ? "cadastrar" : "entrar"} volta={volta} admin={sp.admin === "1"} erroUrl={sp.erro} />
      <Creditos />
    </main>
  );
}
