"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import { IcCopiar, IcEditar, IcOk, IcWhats } from "@/components/Icones";

export default function PerfilEdicao({ nome, username, linkConvite, senhaNova }: { nome: string; username: string; linkConvite: string; senhaNova: boolean }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [n, setN] = useState(nome);
  const [u, setU] = useState(username);
  const [senha, setSenha] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseNavegador().rpc("atualizar_perfil", { p_nome: n, p_username: u });
    if (error) setMsg({ ok: false, t: mensagemErro(error) });
    else {
      setMsg({ ok: true, t: "Perfil atualizado." });
      setEditando(false);
      router.refresh();
    }
  }
  async function trocarSenha(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseNavegador().auth.updateUser({ password: senha });
    setMsg(error ? { ok: false, t: mensagemErro(error) } : { ok: true, t: "Senha nova salva." });
  }
  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem área de transferência */
    }
  }
  const texto = `Vem criar uma música comigo no Primeira Melodia! Cada canção ajuda o planeta 🌱 ${linkConvite}`;

  return (
    <div className="pilha">
      <div className="cartao pilha">
        <p className="sub" style={{ marginTop: 0 }}>Quem entra pelo seu link vira seu convidado, e você ganha sementes e itens especiais.</p>
        <div className="copia">{linkConvite}</div>
        <div className="linha-flex">
          <a className="btn btn-verde btn-p" style={{ flex: 1 }} href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener"><IcWhats /> WhatsApp</a>
          <button type="button" className="btn btn-sec btn-p" style={{ flex: 1 }} onClick={copiar}>{copiado ? <><IcOk /> Copiado</> : <><IcCopiar /> Copiar</>}</button>
        </div>
      </div>

      {senhaNova ? (
        <form className="cartao pilha" onSubmit={trocarSenha}>
          <b>Crie sua senha nova</b>
          <input className="campo" type="password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          <button className="btn btn-pri">Salvar senha</button>
        </form>
      ) : null}

      {editando ? (
        <form className="cartao pilha" onSubmit={salvar}>
          <div className="campo-grupo"><label htmlFor="pn">Nome</label><input id="pn" className="campo" value={n} onChange={(e) => setN(e.target.value)} maxLength={60} /></div>
          <div className="campo-grupo"><label htmlFor="pu">Usuário (endereço do seu mundo)</label><input id="pu" className="campo" value={u} onChange={(e) => setU(e.target.value.toLowerCase())} maxLength={24} /></div>
          <div className="linha-flex">
            <button type="button" className="btn btn-sec" onClick={() => setEditando(false)}>Cancelar</button>
            <button className="btn btn-pri">Salvar</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-sec" onClick={() => setEditando(true)}><IcEditar /> Editar nome e usuário</button>
      )}
      {msg ? <p className={msg.ok ? "ok-msg" : "erro-msg"}>{msg.t}</p> : null}
    </div>
  );
}
