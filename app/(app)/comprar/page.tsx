import type { Metadata } from "next";
import Comprar from "@/components/Comprar";
import { meuPerfil, supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Comprar créditos" };

export default async function PaginaComprar({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServidor();
  const [{ data: pacotes }, perfil] = await Promise.all([
    sb.from("pacotes").select("id, nome, creditos, preco_centavos, destaque").eq("ativo", true).order("ordem"),
    meuPerfil(),
  ]);
  const volta = sp.volta && sp.volta.startsWith("/") && !sp.volta.startsWith("//") ? sp.volta : "/criar";
  return (
    <>
      <p className="olho">Créditos</p>
      <h1 className="titulo">Escolha seu pacote</h1>
      <p className="sub">Cada crédito vira uma música, com duas versões. Pagamento por Pix, liberado na hora.</p>
      <Comprar pacotes={pacotes ?? []} saldo={perfil?.creditos ?? 0} volta={volta} cupomInicial={sp.cupom ?? ""} />
    </>
  );
}
