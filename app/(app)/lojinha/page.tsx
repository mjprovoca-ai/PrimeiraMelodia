import type { Metadata } from "next";
import Link from "next/link";
import Loja from "@/components/Loja";
import { meuPerfil, supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Lojinha" };

export default async function Lojinha() {
  const sb = await supabaseServidor();
  const [perfil, { data: itens }] = await Promise.all([
    meuPerfil(),
    sb.from("catalogo_itens").select("id, mundo, nome, arte, preco_sementes, descricao, especial").not("preco_sementes", "is", null).order("ordem"),
  ]);
  return (
    <>
      <p className="olho centro">Lojinha</p>
      <h1 className="titulo centro">Itens para o seu mundo</h1>
      <p className="sub centro">Use as sementes que você ganha criando, compartilhando e convidando.</p>
      {perfil?.mundo ? (
        <Loja itens={itens ?? []} mundo={perfil.mundo} sementes={perfil.sementes} />
      ) : (
        <Link href="/boas-vindas?volta=/lojinha" className="btn btn-pri mt24">Escolher meu mundo primeiro</Link>
      )}

      <h2 className="rotulo-secao">Em breve</h2>
      <div className="pilha">
        <div className="cartao breve"><span className="emoji">👕</span><span><b>Camisetas oficiais</b><span className="pequeno">Vista sua emoção e ajude o planeta.</span></span></div>
        <div className="cartao breve"><span className="emoji">🎁</span><span><b>Presentes com a sua música</b><span className="pequeno">Quadros e cartões com QR Code da sua canção.</span></span></div>
      </div>
      <p className="rodape-frase">Cada compra ajuda projetos ambientais e apoia artistas do Primeira Melodia. 💚</p>
    </>
  );
}
