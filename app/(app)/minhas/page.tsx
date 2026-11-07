import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { MUNDOS, STATUS_CRIACAO, dataCurta, nomeEstilo, type Mundo } from "@/lib/dados";
import { IcSeta } from "@/components/Icones";

export const metadata: Metadata = { title: "Minhas músicas" };

export default async function Minhas() {
  const sb = await supabaseServidor();
  const { data: u } = await sb.auth.getUser();
  const { data: lista } = await sb.from("criacoes")
    .select("id, titulo, para_quem, estilo, mundo, status, publico, created_at")
    .eq("user_id", u.user?.id ?? "").order("created_at", { ascending: false }).limit(200);
  const musicas = lista ?? [];
  return (
    <>
      <p className="olho">Minhas</p>
      <h1 className="titulo">Minhas músicas</h1>
      <p className="sub">{musicas.length ? `${musicas.length} ${musicas.length === 1 ? "música criada" : "músicas criadas"}. Ouça, compartilhe e convide.` : "Suas músicas aparecem aqui."}</p>

      {musicas.length === 0 ? (
        <div className="cartao centro mt24">
          <div style={{ fontSize: 44 }}>🎶</div>
          <h2 className="mt8">Nenhuma música ainda</h2>
          <p className="sub">A primeira melodia é a mais especial. Bora?</p>
          <Link href="/criar" className="btn btn-pri mt20">Criar minha primeira música</Link>
        </div>
      ) : (
        <ul className="lista mt24">
          {musicas.map((m) => {
            const st = STATUS_CRIACAO[m.status] ?? { rotulo: m.status, cor: "var(--cinza)" };
            const mundo = MUNDOS[(m.mundo as Mundo) ?? "floresta"];
            return (
              <li key={m.id}>
                <Link href={`/minhas/${m.id}`} className="item-lista">
                  <span className="capa" style={{ background: `linear-gradient(135deg, ${mundo.cor}33, #0d0b24)` }}>
                    <img src="/marca/simbolo.svg" alt="" />
                  </span>
                  <span className="m">
                    <b>{m.titulo}</b>
                    <span className="sub2">
                      <span style={{ color: st.cor, fontWeight: 700 }}>{st.rotulo}</span> · {nomeEstilo(m.estilo)} · {dataCurta(m.created_at)}
                      {m.publico === "publica" && m.status === "pronta" ? " · no Palco" : ""}
                    </span>
                  </span>
                  <IcSeta className="seta" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
