"use client";

import { useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { IcGoogle } from "@/components/Icones";

export default function BotaoGoogle({ volta = "/criar" }: { volta?: string }) {
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function entrar() {
    setIndo(true);
    setErro(null);
    const { error } = await supabaseNavegador().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?volta=${encodeURIComponent(volta)}` },
    });
    if (error) {
      setIndo(false);
      setErro(/provider is not enabled|Unsupported provider/i.test(error.message)
        ? "O login com Google está sendo ativado. Por enquanto, entre com e-mail e senha."
        : "Não foi possível abrir o Google agora.");
    }
  }
  return (
    <>
      <button type="button" className="btn btn-sec" onClick={entrar} disabled={indo}>
        <IcGoogle /> {indo ? "Abrindo o Google…" : "Continuar com Google"}
      </button>
      {erro ? <p className="erro-msg">{erro}</p> : null}
    </>
  );
}
