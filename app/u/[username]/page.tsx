import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Cena, { type ItemCena } from "@/components/Cena";
import Creditos from "@/components/Creditos";
import { supabaseServidor } from "@/lib/supabase/server";
import { MUNDOS, type Mundo } from "@/lib/dados";

type Publico = { nome: string; username: string; mundo: Mundo | null; itens: ItemCena[]; musicas: { id: string; titulo: string; estilo: string }[] };

async function buscar(u: string): Promise<Publico | null> {
  const sb = await supabaseServidor();
  const { data } = await sb.rpc("mundo_publico", { p_username: u.slice(0, 30) });
  return (data as Publico) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const p = await buscar(username);
  return { title: p ? `O mundo de ${p.nome}` : "Mundo" };
}

export default async function MundoPublico({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const p = await buscar(username);
  if (!p) notFound();
  const m = p.mundo ? MUNDOS[p.mundo] : null;
  return (
    <main className="app sem-abas">
      <Link href="/" aria-label="Primeira Melodia"><img src="/marca/wordmark-claro.svg" alt="Primeira Melodia" width={200} height={30} /></Link>
      <p className="olho mt24">O mundo de {p.nome}</p>
      <h1 className="titulo">{m ? `${m.emoji} ${m.nome}` : "Ainda escolhendo"}</h1>
      {m ? <p className="sub">{m.frase}</p> : null}
      {p.mundo ? <div className="mt20"><Cena mundo={p.mundo} itens={p.itens} publico /></div> : null}
      {p.musicas.length ? (
        <>
          <h2 className="rotulo-secao">Músicas de {p.nome.split(" ")[0]}</h2>
          <ul className="lista">
            {p.musicas.map((x) => (
              <li key={x.id}><Link href={`/m/${x.id}`} className="item-lista"><span className="m"><b>{x.titulo}</b><span className="sub2">ouvir</span></span></Link></li>
            ))}
          </ul>
        </>
      ) : null}
      <Link href="/entrar?modo=cadastrar" className="btn btn-pri mt24">Criar o meu mundo</Link>
      <Creditos />
    </main>
  );
}
