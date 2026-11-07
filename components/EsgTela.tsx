"use client";

import Link from "next/link";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { dataCurta } from "@/lib/dados";
import { IcAmpulheta } from "@/components/Icones";

type Projeto = { id: string; titulo: string; descricao: string; causa: string; link: string | null; votos: number; status: string };
type Painel = { ano: number; finalistas: Projeto[]; meu_voto: string | null; meus_projetos: { id: string; titulo: string; status: string; causa: string; created_at: string }[] };

const CAUSAS = [
  { id: "planeta", nome: "🌍 Planeta" },
  { id: "oceano", nome: "🐟 Oceano" },
  { id: "floresta", nome: "🌳 Floresta" },
];
const STATUS: Record<string, string> = { em_curadoria: "Em curadoria", finalista: "Finalista 🌱", vencedor: "Vencedor 💚", arquivado: "Não seguiu desta vez", recusado: "Não seguiu desta vez" };

export default function EsgTela({ painel, logado }: { painel: Painel; logado: boolean }) {
  const [finalistas, setFinalistas] = useState(painel.finalistas);
  const [meuVoto, setMeuVoto] = useState(painel.meu_voto);
  const [meus, setMeus] = useState(painel.meus_projetos);
  const [form, setForm] = useState({ titulo: "", descricao: "", causa: "planeta", link: "" });
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [erroVoto, setErroVoto] = useState<string | null>(null);
  const total = finalistas.reduce((s, f) => s + f.votos, 0) || 1;

  async function votar(id: string) {
    setErroVoto(null);
    const { data, error } = await supabaseNavegador().rpc("votar_esg", { p_projeto: id });
    if (error) setErroVoto(mensagemErro(error));
    else {
      setMeuVoto(id);
      setFinalistas((f) => f.map((x) => (x.id === id ? { ...x, votos: Number(data) } : x)));
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setMsg(null);
    const { data, error } = await supabaseNavegador().rpc("enviar_projeto_esg", { p_titulo: form.titulo, p_descricao: form.descricao, p_causa: form.causa, p_link: form.link });
    setEnviando(false);
    if (error) setMsg({ ok: false, t: mensagemErro(error) });
    else {
      setMsg({ ok: true, t: "Projeto enviado para a curadoria. Obrigado por cuidar do planeta! 💚" });
      setMeus((m) => [{ id: String(data), titulo: form.titulo, status: "em_curadoria", causa: form.causa, created_at: new Date().toISOString() }, ...m]);
      setForm({ titulo: "", descricao: "", causa: "planeta", link: "" });
    }
  }

  return (
    <>
      <h2 className="rotulo-secao">Finalistas de {painel.ano} · vote no seu favorito</h2>
      {finalistas.length === 0 ? (
        <div className="cartao centro" style={{ padding: "28px 20px" }}>
          <IcAmpulheta style={{ width: 34, height: 34, color: "#d4d4d8" }} />
          <p className="mt12" style={{ color: "#e4e4e7" }}>Os finalistas deste ano ainda serão anunciados pela curadoria. Envie o seu projeto abaixo!</p>
        </div>
      ) : (
        <div className="pilha">
          {finalistas.map((f) => (
            <div key={f.id} className="cartao finalista">
              <div className="entre"><b style={{ fontSize: 18 }}>{f.titulo}</b><span className="etiqueta verde-e">{CAUSAS.find((c) => c.id === f.causa)?.nome}</span></div>
              <p className="sub" style={{ marginTop: 0 }}>{f.descricao}</p>
              {f.link ? <a href={f.link} target="_blank" rel="noopener" className="pequeno laranja">Conhecer o projeto →</a> : null}
              <div className="barra-voto"><i style={{ width: `${(f.votos / total) * 100}%` }} /></div>
              <div className="entre">
                <span className="pequeno">{f.votos} {f.votos === 1 ? "voto" : "votos"}{f.status === "vencedor" ? " · vencedor 💚" : ""}</span>
                {!logado ? (
                  <Link href="/entrar?volta=/esg" className="btn btn-sec btn-p">Entrar para votar</Link>
                ) : meuVoto ? (
                  <span className="pequeno verde">{meuVoto === f.id ? "Seu voto ✓" : ""}</span>
                ) : f.status === "finalista" ? (
                  <button type="button" className="btn btn-verde btn-p" onClick={() => votar(f.id)}>Votar</button>
                ) : null}
              </div>
            </div>
          ))}
          {erroVoto ? <p className="erro-msg">{erroVoto}</p> : null}
          <p className="pequeno">Um voto por pessoa por ano.</p>
        </div>
      )}

      <h2 className="rotulo-secao">Envie seu projeto</h2>
      {logado ? (
        <form className="cartao pilha" onSubmit={enviar}>
          <input className="campo" placeholder="Título do projeto" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required minLength={3} maxLength={120} />
          <textarea className="campo" placeholder="Descreva o projeto: o que ele faz pelo planeta, oceano ou floresta? Qual o impacto esperado?" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} required minLength={20} maxLength={3000} />
          <input className="campo" placeholder="Site ou rede social do projeto (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} inputMode="url" />
          <div className="chips" role="group" aria-label="Causa">
            {CAUSAS.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={form.causa === c.id} onClick={() => setForm({ ...form, causa: c.id })}>{c.nome}</button>
            ))}
          </div>
          {msg ? <p className={msg.ok ? "ok-msg" : "erro-msg"}>{msg.t}</p> : null}
          <button className="btn btn-pri" disabled={enviando}>{enviando ? "Enviando…" : "Enviar para curadoria"}</button>
        </form>
      ) : (
        <div className="cartao">
          <p className="sub" style={{ marginTop: 0 }}>Entre na sua conta para enviar um projeto.</p>
          <Link href="/entrar?volta=/esg" className="btn btn-pri mt16">Entrar</Link>
        </div>
      )}

      {meus.length ? (
        <>
          <h2 className="rotulo-secao">Seus projetos</h2>
          <ul className="lista">
            {meus.map((m) => (
              <li key={m.id} className="item-lista">
                <span className="m"><b>{m.titulo}</b><span className="sub2">{STATUS[m.status] ?? m.status} · {dataCurta(m.created_at)}</span></span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
