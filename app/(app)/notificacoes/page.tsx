import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServidor } from "@/lib/supabase/server";
import { dataHora } from "@/lib/dados";
import MarcarLidas from "@/components/MarcarLidas";
import { IcVoltar } from "@/components/Icones";

export const metadata: Metadata = { title: "Avisos" };

export default async function Notificacoes() {
  const sb = await supabaseServidor();
  const { data } = await sb.from("notificacoes").select("id, titulo, corpo, link, lida, created_at").order("created_at", { ascending: false }).limit(60);
  const lista = data ?? [];
  return (
    <>
      <Link href="/perfil" className="voltar"><IcVoltar /> Perfil</Link>
      <h1 className="titulo mt20">Avisos</h1>
      <MarcarLidas />
      {lista.length === 0 ? <p className="sub">Nada por aqui ainda.</p> : (
        <ul className="lista mt20">
          {lista.map((n) => (
            <li key={n.id}>
              <Link href={n.link || "#"} className="item-lista" style={{ borderColor: n.lida ? undefined : "rgba(255,138,0,.55)" }}>
                <span className="m">
                  <b style={{ whiteSpace: "normal" }}>{n.titulo}</b>
                  {n.corpo ? <span className="sub2" style={{ color: "#d4d4d8" }}>{n.corpo}</span> : null}
                  <span className="sub2">{dataHora(n.created_at)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
