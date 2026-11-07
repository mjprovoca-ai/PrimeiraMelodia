import BotaoRpc from "@/components/admin/BotaoRpc";
import { supabaseServidor } from "@/lib/supabase/server";
import { brl, dataHora } from "@/lib/dados";

const COR: Record<string, string> = { pago: "var(--verde-claro)", pendente: "var(--sol)", expirado: "var(--cinza)", cancelado: "var(--cinza)" };

export default async function AdminPedidos({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServidor();
  let q = sb.from("pedidos").select("id, codigo, user_id, creditos, valor_bruto, desconto, valor_final, cupom, metodo, status, created_at, pago_em, mp_order_id").order("created_at", { ascending: false }).limit(150);
  if (sp.status) q = q.eq("status", sp.status);
  const { data: pedidos } = await q;
  const ids = [...new Set((pedidos ?? []).map((p) => p.user_id))];
  const { data: pessoas } = ids.length ? await sb.from("profiles").select("id, nome, username").in("id", ids) : { data: [] };
  const nome = (id: string) => pessoas?.find((p) => p.id === id)?.nome ?? "—";
  return (
    <>
      <div className="chips">
        {["", "pago", "pendente", "expirado"].map((s) => (
          <a key={s} href={s ? `/admin/pedidos?status=${s}` : "/admin/pedidos"} className="chip laranja-on" aria-pressed={(sp.status ?? "") === s}>{s || "Todos"}</a>
        ))}
      </div>
      <p className="pequeno mt12">O Pix é confirmado sozinho pelo Mercado Pago. Use “Marcar como pago” só se a pessoa pagou por fora (por exemplo, Pix direto na conta).</p>
      <div className="tabela-wrap mt12">
        <table className="tabela">
          <thead><tr><th>Pedido</th><th>Pessoa</th><th>Valor</th><th>Créditos</th><th>Cupom</th><th>Status</th><th>Data</th><th /></tr></thead>
          <tbody>
            {(pedidos ?? []).map((p) => (
              <tr key={p.id}>
                <td><b>{p.codigo}</b><br /><span className="pequeno">{p.metodo}</span></td>
                <td>{nome(p.user_id)}</td>
                <td>{brl(p.valor_final)}{p.desconto ? <><br /><span className="pequeno">de {brl(p.valor_bruto)}</span></> : null}</td>
                <td>{p.creditos}</td>
                <td>{p.cupom ?? "—"}</td>
                <td style={{ color: COR[p.status], fontWeight: 800 }}>{p.status}</td>
                <td className="pequeno">{dataHora(p.created_at)}{p.pago_em ? <><br />pago {dataHora(p.pago_em)}</> : null}</td>
                <td>{p.status !== "pago" ? <BotaoRpc fn="admin_marcar_pago" args={{ p_pedido: p.id }} rotulo="Marcar como pago" confirmar={`Confirmar que ${p.codigo} foi pago? Os créditos serão liberados.`} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
