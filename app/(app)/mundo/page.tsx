import type { Metadata } from "next";
import Link from "next/link";
import Cena, { type ItemCena } from "@/components/Cena";
import { meuPerfil, supabaseServidor } from "@/lib/supabase/server";
import { MUNDOS, type Mundo } from "@/lib/dados";
import { IcSemente } from "@/components/Icones";

export const metadata: Metadata = { title: "Meu mundo" };

type Meta = { id: string; tipo: string; limiar: number; sementes: number; especial: number | null; titulo: string; descricao: string; atual: number; atingida: boolean };

const TIPO: Record<string, { nome: string; emoji: string }> = {
  musicas: { nome: "Músicas criadas", emoji: "🎵" },
  plays: { nome: "Plays de outras pessoas", emoji: "🎧" },
  compartilhamentos: { nome: "Compartilhamentos", emoji: "📣" },
  convites: { nome: "Pessoas que você trouxe", emoji: "🤝" },
};

export default async function MeuMundo({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServidor();
  const [perfil, { data: mundo }, { data: prog }] = await Promise.all([meuPerfil(), sb.rpc("meu_mundo"), sb.rpc("meu_progresso")]);
  if (!perfil?.mundo) {
    return (
      <>
        <p className="olho">Mundo</p>
        <h1 className="titulo">Escolha seu mundo</h1>
        <p className="sub">Cada música que você cria faz o seu mundo crescer.</p>
        <Link href="/boas-vindas?volta=/mundo" className="btn btn-pri mt24">Escolher agora</Link>
      </>
    );
  }
  const m = MUNDOS[perfil.mundo as Mundo];
  const itens = (mundo?.itens ?? []) as ItemCena[];
  const metas = (prog?.metas ?? []) as Meta[];
  const proximas = Object.keys(TIPO).map((tipo) => metas.find((x) => x.tipo === tipo && !x.atingida)).filter(Boolean) as Meta[];
  const feitas = metas.filter((x) => x.atingida);

  return (
    <>
      <p className="olho">Seu ecossistema</p>
      <h1 className="titulo">{m.emoji} {m.nome}</h1>
      <p className="sub">{m.frase}</p>

      <div className="numeros mt20">
        <div className="cartao numero"><b>{itens.length}</b><span>itens no seu mundo</span></div>
        <div className="cartao numero"><b className="linha-flex" style={{ gap: 6 }}><IcSemente style={{ width: 24, height: 24 }} />{perfil.sementes}</b><span>sementes para a Lojinha</span></div>
      </div>

      <div className="mt16"><Cena mundo={perfil.mundo as Mundo} itens={itens} novo={sp.novo} /></div>

      <div className="linha-flex mt16">
        <Link href="/lojinha" className="btn btn-pri">Lojinha</Link>
        <Link href={`/u/${perfil.username}`} className="btn btn-sec">Mundo público</Link>
      </div>

      <h2 className="rotulo-secao">Próximas conquistas</h2>
      <ul className="cartao lista metas" style={{ gap: 0, padding: "4px 18px" }}>
        {proximas.map((x) => (
          <li key={x.id}>
            <span className="icone-meta">{TIPO[x.tipo]?.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b>{x.titulo}</b> <span className="pequeno">· {TIPO[x.tipo]?.nome}</span>
              <div className="progresso"><i style={{ width: `${Math.min(100, (x.atual / x.limiar) * 100)}%` }} /></div>
              <span className="pequeno">{x.atual}/{x.limiar} · +{x.sementes} sementes{x.especial ? " + item especial" : ""}</span>
            </span>
          </li>
        ))}
      </ul>

      {feitas.length ? (
        <>
          <h2 className="rotulo-secao">Conquistas ({feitas.length})</h2>
          <ul className="cartao lista metas" style={{ gap: 0, padding: "4px 18px" }}>
            {feitas.map((x) => (
              <li key={x.id} className="ok">
                <span className="icone-meta">✅</span>
                <span><b>{x.titulo}</b><br /><span className="pequeno">{x.descricao}</span></span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="centro mt24"><Link href="/boas-vindas?trocar=1&volta=/mundo" className="link">Trocar de mundo</Link></p>
    </>
  );
}
