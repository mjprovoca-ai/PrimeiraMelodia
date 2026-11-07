import BotaoRpc from "@/components/admin/BotaoRpc";
import FormCupom from "@/components/admin/FormCupom";
import Grafico from "@/components/admin/Grafico";
import { supabaseServidor } from "@/lib/supabase/server";
import { dataCurta } from "@/lib/dados";

type Cupom = { codigo: string; percentual: number; usos: number; usos_max: number | null; ativo: boolean; valido_ate: string | null; descricao: string | null; um_por_pessoa: boolean; created_at: string };

export default async function AdminCupons() {
  const sb = await supabaseServidor();
  const { data: r } = await sb.rpc("admin_resumo", { p_dias: 30 });
  const cupons = (r?.cupons ?? []) as Cupom[];
  const serie = (r?.serie ?? []) as { dia: string; cupons: number }[];
  const porCupom = cupons.filter((c) => c.usos > 0).slice(0, 12).map((c) => ({ rotulo: c.codigo, valor: c.usos }));
  return (
    <div className="pilha" style={{ gap: 18 }}>
      <FormCupom />
      <div className="grade-2">
        <Grafico titulo="Cupons usados por dia (30 dias)" dados={serie.map((d) => ({ rotulo: d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7), valor: d.cupons }))} cor="#FFC93A" />
        <Grafico titulo="Usos por cupom" dados={porCupom} cor="#FF8A00" />
      </div>
      <div className="tabela-wrap">
        <table className="tabela">
          <thead><tr><th>Código</th><th>Desconto</th><th>Usos</th><th>Validade</th><th>Descrição</th><th>Status</th><th /></tr></thead>
          <tbody>
            {cupons.map((c) => (
              <tr key={c.codigo}>
                <td><b>{c.codigo}</b></td>
                <td>{c.percentual}%{c.percentual === 100 ? " · grátis" : ""}</td>
                <td>{c.usos}{c.usos_max ? ` / ${c.usos_max}` : ""}{c.um_por_pessoa ? <><br /><span className="pequeno">1 por pessoa</span></> : null}</td>
                <td className="pequeno">{c.valido_ate ? `até ${dataCurta(c.valido_ate)}` : "sem prazo"}</td>
                <td className="pequeno">{c.descricao ?? ""}</td>
                <td style={{ color: c.ativo ? "var(--verde-claro)" : "var(--cinza)", fontWeight: 800 }}>{c.ativo ? "ativo" : "pausado"}</td>
                <td><BotaoRpc fn="admin_cupom_ativo" args={{ p_codigo: c.codigo, p_ativo: !c.ativo }} rotulo={c.ativo ? "Pausar" : "Reativar"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
