import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PerfilEdicao from "@/components/PerfilEdicao";
import { meuPerfil } from "@/lib/supabase/server";
import { MUNDOS, type Mundo } from "@/lib/dados";
import { SITE_URL } from "@/lib/config";
import { IcDoc, IcEscudo, IcMedalha, IcSair, IcSeta, IcSino, IcPresente, IcAlvo } from "@/components/Icones";

export const metadata: Metadata = { title: "Perfil" };

export default async function Perfil({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const p = await meuPerfil();
  if (!p) redirect("/entrar?volta=/perfil");
  const mundo = p.mundo ? MUNDOS[p.mundo as Mundo] : null;
  const linkConvite = `${SITE_URL}/convite/${p.convite_codigo}`;
  return (
    <>
      <h1 className="titulo">Perfil</h1>

      <div className="cartao forte linha-flex mt20" style={{ gap: 16 }}>
        <span className="avatar">{p.avatar_url ? <img src={p.avatar_url} alt="" referrerPolicy="no-referrer" /> : (p.nome || "?").slice(0, 1).toUpperCase()}</span>
        <span style={{ minWidth: 0 }}>
          <b style={{ fontSize: 20, display: "block" }}>{p.nome}</b>
          <span className="pequeno" style={{ wordBreak: "break-all" }}>{p.email}</span>
          <span className="pequeno" style={{ display: "block" }}>@{p.username}</span>
        </span>
      </div>

      <Link href="/mundo" className="cartao forte mt12" style={{ display: "block", textDecoration: "none" }}>
        <span className="pequeno" style={{ letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 800 }}>Seu ecossistema</span>
        <b style={{ display: "block", fontSize: 28, fontWeight: 900, marginTop: 4 }}>{mundo ? `${mundo.emoji} ${mundo.nome}` : "Escolha seu mundo"}</b>
        <span className="sub" style={{ display: "block", marginTop: 2 }}>{mundo ? mundo.frase : "Cada música faz o seu mundo crescer."}</span>
      </Link>

      <div className="numeros mt12">
        <Link href="/comprar" className="cartao numero" style={{ textDecoration: "none" }}><b>{p.creditos}</b><span>{p.creditos === 1 ? "crédito" : "créditos"} · comprar mais</span></Link>
        <Link href="/lojinha" className="cartao numero" style={{ textDecoration: "none" }}><b>{p.sementes}</b><span>sementes · Lojinha</span></Link>
        <div className="cartao numero"><b>{p.contagens?.musicas ?? 0}</b><span>músicas criadas</span></div>
        <div className="cartao numero"><b>{p.contagens?.convites ?? 0}</b><span>pessoas convidadas</span></div>
      </div>

      <h2 className="rotulo-secao">Convide quem você ama</h2>
      <PerfilEdicao nome={p.nome} username={p.username} linkConvite={linkConvite} senhaNova={sp.senha === "nova"} />

      <h2 className="rotulo-secao">Conta</h2>
      <div className="cartao menu-lista">
        <Link href="/notificacoes"><IcSino /> Avisos {p.nao_lidas ? <span className="etiqueta vivo" style={{ marginLeft: 6 }}><i />{p.nao_lidas}</span> : null}<IcSeta className="seta" /></Link>
        <Link href="/comprar"><IcPresente /> Comprar créditos ou usar cupom<IcSeta className="seta" /></Link>
        {p.role === "admin" ? <Link href="/admin"><IcAlvo /> Painel da administração<IcSeta className="seta" /></Link> : null}
      </div>

      <h2 className="rotulo-secao">Legal</h2>
      <div className="cartao menu-lista">
        <Link href="/termos"><IcDoc /> Termos de uso<IcSeta className="seta" /></Link>
        <Link href="/privacidade"><IcEscudo /> Política de privacidade<IcSeta className="seta" /></Link>
        <Link href="/direitos"><IcMedalha /> Direitos autorais (50/50)<IcSeta className="seta" /></Link>
      </div>

      <div className="cartao menu-lista mt16">
        <form action="/auth/sair" method="post" style={{ display: "contents" }}>
          <button type="submit" className="perigo"><IcSair /> Sair<IcSeta className="seta" /></button>
        </form>
      </div>

      <p className="rodape-frase">Primeira Melodia · Música em apoio ao planeta 🌍<br />10% da receita das músicas para projetos ambientais.</p>
    </>
  );
}
