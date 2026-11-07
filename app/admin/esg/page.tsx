import BotaoRpc from "@/components/admin/BotaoRpc";
import { supabaseServidor } from "@/lib/supabase/server";
import { dataCurta } from "@/lib/dados";

const STATUS: Record<string, string> = { em_curadoria: "Em curadoria", finalista: "Finalista", vencedor: "Vencedor", arquivado: "Arquivado", recusado: "Recusado" };

export default async function AdminEsg() {
  const sb = await supabaseServidor();
  const { data: projetos } = await sb.from("esg_projetos").select("id, titulo, descricao, causa, link, status, ano, votos, created_at").order("created_at", { ascending: false }).limit(200);
  const finalistas = (projetos ?? []).filter((p) => p.status === "finalista" && p.ano === new Date().getFullYear()).length;
  return (
    <>
      <p className="pequeno">A Eterna faz a pré-curadoria e escolhe até 3 finalistas por ano. A votação abre sozinha para os finalistas; no fim do ano, marque o vencedor. Finalistas agora: <b>{finalistas}/3</b>.</p>
      <div className="pilha mt16">
        {(projetos ?? []).map((p) => (
          <div key={p.id} className="cartao forte">
            <div className="entre"><b style={{ fontSize: 17 }}>{p.titulo}</b><span className="etiqueta verde-e">{p.causa}</span></div>
            <p className="sub" style={{ whiteSpace: "pre-wrap" }}>{p.descricao}</p>
            {p.link ? <a href={p.link} target="_blank" rel="noopener" className="pequeno laranja">{p.link}</a> : null}
            <p className="pequeno mt8">{STATUS[p.status]} · {p.votos} votos · enviado em {dataCurta(p.created_at)} · {p.ano}</p>
            <div className="linha-flex mt12" style={{ flexWrap: "wrap", gap: 8 }}>
              {p.status !== "finalista" ? <BotaoRpc fn="admin_esg_status" args={{ p_projeto: p.id, p_status: "finalista" }} rotulo="Tornar finalista" classe="btn btn-verde btn-p" /> : null}
              {p.status === "finalista" ? <BotaoRpc fn="admin_esg_status" args={{ p_projeto: p.id, p_status: "vencedor" }} rotulo="Marcar vencedor" classe="btn btn-pri btn-p" confirmar="Marcar este projeto como o vencedor do ano?" /> : null}
              {p.status !== "em_curadoria" ? <BotaoRpc fn="admin_esg_status" args={{ p_projeto: p.id, p_status: "em_curadoria" }} rotulo="Voltar para curadoria" /> : null}
              {p.status !== "arquivado" ? <BotaoRpc fn="admin_esg_status" args={{ p_projeto: p.id, p_status: "arquivado" }} rotulo="Arquivar" /> : null}
            </div>
          </div>
        ))}
        {!projetos?.length ? <p className="sub">Nenhum projeto enviado ainda.</p> : null}
      </div>
    </>
  );
}
