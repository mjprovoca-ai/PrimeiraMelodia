"use client";

import Link from "next/link";
import { useState } from "react";
import { chamarFuncao, mensagemErro, supabaseNavegador } from "@/lib/supabase/client";
import BotaoGoogle from "@/components/BotaoGoogle";
import { IcVoltar } from "@/components/Icones";

function lerConvite() {
  const m = document.cookie.match(/(?:^|; )pm-convite=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function EntrarForm({ modoInicial, volta, admin, erroUrl }: { modoInicial: "entrar" | "cadastrar"; volta: string; admin: boolean; erroUrl?: string }) {
  const [modo, setModo] = useState(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(erroUrl ? "Não foi possível entrar. Tente de novo." : null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setEnviando(true);
    const sb = supabaseNavegador();
    try {
      if (modo === "cadastrar") {
        await chamarFuncao("conta/cadastrar", { nome, email, senha, convite: lerConvite() });
      }
      const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
      if (error) {
        throw new Error(/invalid login|invalid credentials/i.test(error.message) ? "E-mail ou senha não conferem." : error.message);
      }
      const convite = lerConvite();
      if (convite) {
        await sb.rpc("aplicar_convite", { p_codigo: convite });
        document.cookie = "pm-convite=; path=/; max-age=0";
      }
      window.location.href = volta;
    } catch (err) {
      setErro(mensagemErro(err));
      setEnviando(false);
    }
  }

  async function esqueci() {
    setErro(null);
    if (!email) {
      setErro("Escreva seu e-mail acima e toque de novo em “Esqueci a senha”.");
      return;
    }
    const { error } = await supabaseNavegador().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/perfil?senha=nova`,
    });
    setAviso(error ? "Não conseguimos enviar o e-mail agora. Entre com Google ou fale com fundacaoweb3@gmail.com." : "Se esse e-mail tiver conta, chega um link para criar uma senha nova.");
  }

  return (
    <section>
      <Link href="/" className="voltar" aria-label="Voltar"><IcVoltar /> Voltar</Link>
      <p className="olho mt24">Primeira Melodia{admin ? " · Administração" : ""}</p>
      <h1 className="titulo">{modo === "cadastrar" ? "Criar minha conta" : "Que bom te ver"}</h1>

      <div className="segmento mt20" role="group" aria-label="Entrar ou cadastrar">
        <button type="button" aria-pressed={modo === "entrar"} onClick={() => setModo("entrar")}>Entrar</button>
        <button type="button" aria-pressed={modo === "cadastrar"} onClick={() => setModo("cadastrar")}>Cadastrar</button>
      </div>

      <form className="pilha mt20" onSubmit={enviar}>
        {modo === "cadastrar" ? (
          <div className="campo-grupo">
            <label htmlFor="nome">Nome</label>
            <input id="nome" className="campo" placeholder="Como devemos te chamar?" value={nome} onChange={(e) => setNome(e.target.value)} required minLength={2} maxLength={60} autoComplete="name" />
          </div>
        ) : null}
        <div className="campo-grupo">
          <label htmlFor="email">Email</label>
          <input id="email" className="campo" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" inputMode="email" />
        </div>
        <div className="campo-grupo">
          <label htmlFor="senha">Senha</label>
          <div style={{ position: "relative" }}>
            <input id="senha" className="campo" type={ver ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} autoComplete={modo === "cadastrar" ? "new-password" : "current-password"} style={{ paddingRight: 70 }} />
            <button type="button" onClick={() => setVer(!ver)} className="link" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", textDecoration: "none", color: "var(--suave)" }}>{ver ? "ocultar" : "ver"}</button>
          </div>
        </div>
        <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden style={{ position: "absolute", left: "-9999px" }} />
        {erro ? <p className="erro-msg" role="alert">{erro}</p> : null}
        {aviso ? <p className="ok-msg" role="status">{aviso}</p> : null}
        <button type="submit" className="btn btn-pri mt8" disabled={enviando}>
          {enviando ? "Um instante…" : modo === "cadastrar" ? "Criar conta" : "Entrar"}
        </button>
      </form>

      <div className="pilha mt16">
        <p className="pequeno centro">ou</p>
        <BotaoGoogle volta={volta} />
        {modo === "entrar" ? <button type="button" className="link centro" onClick={esqueci}>Esqueci a senha</button> : null}
        {modo === "cadastrar" ? (
          <p className="pequeno centro">Ao criar a conta você concorda com os <Link href="/termos">Termos de uso</Link> e a <Link href="/privacidade">Política de privacidade</Link>.</p>
        ) : null}
      </div>
    </section>
  );
}
