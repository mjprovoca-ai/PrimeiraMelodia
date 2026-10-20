import BotaoRpc from "@/components/admin/BotaoRpc";
import { supabaseServidor } from "@/lib/supabase/server";
import { STATUS_CRIACAO, dataHora, nomeEstilo } from "@/lib/dados";

const PUBLICO: Record<string, string> = { publica: "no Palco", privada: "privada", em_analise: "esperando aprovação", removida: "retirada" };

export default async function AdminMusicas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServidor();
  let q = sb.from("criacoes").select("id, user_id, titulo, para_quem, estilo, status, publico, created_at, letra").order("created_at", { ascending: false }).limit(120);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.publico) q = q.eq("publico", sp.publico);
  const { data: lista } = await q;
  const ids = [...new Set((lista ?? []).map((m) => m.user_id))];
  const { data: pessoas } = ids.length ? await sb.from("profiles").select("id, nome").in("id", ids) : { data: [] };
  const nome = (id: string) => pessoas?.find((p) => p.id === id)?.nome ?? "—";
  const filtros = [["", "", "Todas"], ["publico", "em_analise", "Esperando aprovação"], ["publico", "publica", "No Palco"], ["publico", "removida", "Retiradas"], ["status", "erro", "Com erro"]];
  return (
    <>
      <div className="chips">
        {filtros.map(([k, v, t]) => (
          <a key={t} href={k ? `/admin/musicas?${k}=${v}` : "/admin/musicas"} className="chip laranja-on" aria-pressed={(k ? sp[k] === v : !sp.status && !sp.publico)}>{t}</a>
        ))}
      </div>
      <p className="pequeno mt12">Regra do Palco: só músicas para emocionar. Superação vale; história triste, ofensa ou propaganda, não. Retirar do Palco não apaga a música da pessoa.</p>
      <div className="tabela-wrap mt12">
        <table className="tabela">
          <thead><tr><th>Música</th><th>Pessoa</th><th>Status</th><th>Palco</th><th>Data</th><th /></tr></thead>
          <tbody>
            {(lista ?? []).map((m) => (
              <tr key={m.id}>
                <td><b>{m.titulo}</b><br /><span className="pequeno">{nomeEstilo(m.estilo)}{m.para_quem ? ` · para ${m.para_quem}` : ""}</span>
                  {m.letra ? <details><summary className="pequeno" style={{ cursor: "pointer" }}>letra</summary><p className="pequeno" style={{ whiteSpace: "pre-wrap", maxWidth: 420 }}>{m.letra}</p></details> : null}
                </td>
                <td>{nome(m.user_id)}</td>
                <td style={{ color: STATUS_CRIACAO[m.status]?.cor, fontWeight: 700 }}>{STATUS_CRIACAO[m.status]?.rotulo ?? m.status}</td>
                <td>{PUBLICO[m.publico] ?? m.publico}</td>
                <td className="pequeno">{dataHora(m.created_at)}</td>
                <td>
                  <span className="linha-flex" style={{ gap: 6 }}>
                    {m.status === "pronta" && m.publico !== "publica" ? <BotaoRpc fn="admin_moderar" args={{ p_criacao: m.id, p_acao: "publicar" }} rotulo="Pôr no Palco" classe="btn btn-verde btn-p" /> : null}
                    {m.publico === "publica" || m.publico === "em_analise" ? <BotaoRpc fn="admin_moderar" args={{ p_criacao: m.id, p_acao: "remover" }} rotulo="Tirar do Palco" classe="btn btn-perigo btn-p" confirmar={`Tirar "${m.titulo}" do Palco?`} /> : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
