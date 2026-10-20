import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { nomeEstilo } from "@/lib/dados";
import MusicaOuvir from "@/components/MusicaOuvir";
import Creditos from "@/components/Creditos";

type Musica = {
  id: string; titulo: string; para_quem: string | null; letra: string | null; estilo: string; mundo: string; status: string; publico: string;
  karaoke: { t: number; f: number; l: string }[] | null; dono: boolean;
  autor: { nome: string; username: string; convite: string };
  faixas: { id: string; versao: number; storage_path: string; duracao: number }[];
};

async function buscar(id: string): Promise<Musica | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = await supabaseServidor();
  const { data } = await sb.rpc("musica_publica", { p_id: id });
  return (data as Musica) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = await buscar(id);
  if (!m) return { title: "Música" };
  const desc = `Uma música ${nomeEstilo(m.estilo)} criada por ${m.autor.nome} no Primeira Melodia${m.para_quem ? `, para ${m.para_quem}` : ""}. Escute e crie a sua.`;
  return { title: m.titulo, description: desc, openGraph: { title: `${m.titulo} · Primeira Melodia`, description: desc } };
}

export default async function MusicaPublica({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const m = await buscar(id);
  if (!m) {
    return (
      <main className="app sem-abas">
        <p className="olho">Primeira Melodia</p>
        <h1 className="titulo">Essa música é privada</h1>
        <p className="sub">Quem criou ainda não deixou ela pública. Que tal criar a sua?</p>
        <Link href="/" className="btn btn-pri mt24">Conhecer o Primeira Melodia</Link>
        <Creditos />
      </main>
    );
  }
  const convite = (sp.c || m.autor.convite || "").replace(/[^A-Za-z0-9]/g, "");
  return (
    <main className="app sem-abas">
      <Link href="/" aria-label="Primeira Melodia"><img src="/marca/wordmark-claro.svg" alt="Primeira Melodia" width={220} height={33} /></Link>
      <p className="olho mt24">{m.para_quem ? `Para ${m.para_quem}` : "Uma música"}</p>
      <h1 className="titulo">{m.titulo}</h1>
      <p className="sub">por {m.autor.nome} · {nomeEstilo(m.estilo)}</p>
      {m.status === "pronta" ? <MusicaOuvir faixas={m.faixas} karaoke={m.karaoke} letra={m.letra} convite={convite} /> : <p className="sub mt16">Essa música ainda está sendo criada. Volte em alguns minutos.</p>}

      <div className="cartao mt24 centro">
        <h2>Crie uma música. Emocione quem você ama.</h2>
        <p className="sub">Conte uma história e receba duas versões de uma música feita para alguém especial. 10% vai para projetos que cuidam do planeta.</p>
        <Link href={convite ? `/convite/${convite}` : "/entrar?modo=cadastrar"} className="btn btn-pri mt16">Criar a minha</Link>
        <Link href="/palco" className="btn btn-palco mt12"><span className="ponto" /> Ouvir o Palco ao vivo</Link>
      </div>
      <Creditos />
    </main>
  );
}
