import Link from "next/link";
import Grafico from "@/components/admin/Grafico";
import { supabaseServidor } from "@/lib/supabase/server";
import { brl } from "@/lib/dados";

type Dia = { dia: string; receita: number; pagos: number; cupons: number; musicas: number; cadastros: number };

const dia = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

export default async function AdminResumo() {
  const sb = await supabaseServidor();
  const { data: r, error } = await sb.rpc("admin_resumo", { p_dias: 30 });
  if (error || !r) return <p className="erro-msg">{error?.message ?? "Não foi possível carregar."}</p>;
  const serie = (r.serie ?? []) as Dia[];
  const alertas = [
    r.em_analise ? { t: `${r.em_analise} música(s) esperando aprovação para o Palco`, href: "/admin/musicas" } : null,
    r.esg_curadoria ? { t: `${r.esg_curadoria} projeto(s) ESG para a curadoria`, href: "/admin/esg" } : null,
    r.licencas_abertas ? { t: `${r.licencas_abertas} pedido(s) de uso comercial`, href: "/admin/config#licencas" } : null,
    r.erros ? { t: `${r.erros} criação(ões) com erro nos últimos 7 dias`, href: "/admin/musicas?status=erro" } : null,
    r.pedidos_pendentes ? { t: `${r.pedidos_pendentes} Pix aguardando pagamento`, href: "/admin/pedidos" } : null,
  ].filter(Boolean) as { t: string; href: string }[];

  return (
    <div className="pilha" style={{ gap: 18 }}>
      <div className="kpis">
        <div className="cartao forte kpi"><span>Receita (30 dias)</span><b>{brl(r.receita_periodo)}</b></div>
        <div className="cartao forte kpi"><span>Receita total</span><b>{brl(r.receita_total)}</b></div>
        <div className="cartao forte kpi"><span>Fundo ESG {new Date().getFullYear()}</span><b className="verde">{brl(r.fundo_ano)}</b></div>
        <div className="cartao forte kpi"><span>Pedidos pagos</span><b>{r.pedidos_pagos}</b></div>
        <div className="cartao forte kpi"><span>Músicas prontas</span><b>{r.musicas}</b></div>
        <div className="cartao forte kpi"><span>No estúdio agora</span><b>{r.na_fila}</b></div>
        <div className="cartao forte kpi"><span>Pessoas</span><b>{r.usuarios}</b></div>
      </div>

      {alertas.length ? (
        <div className="cartao forte">
          <b>Para olhar</b>
          <ul className="lista mt12">
            {alertas.map((a) => <li key={a.t}><Link href={a.href} className="laranja">{a.t} →</Link></li>)}
          </ul>
        </div>
      ) : null}

      <div className="grade-2">
        <Grafico titulo="Receita por dia" dados={serie.map((d) => ({ rotulo: dia(d.dia), valor: d.receita }))} formato={brl} />
        <Grafico titulo="Músicas criadas por dia" dados={serie.map((d) => ({ rotulo: dia(d.dia), valor: d.musicas }))} cor="#22C55E" />
        <Grafico titulo="Cupons usados por dia" dados={serie.map((d) => ({ rotulo: dia(d.dia), valor: d.cupons }))} cor="#FFC93A" />
        <Grafico titulo="Cadastros por dia" dados={serie.map((d) => ({ rotulo: dia(d.dia), valor: d.cadastros }))} cor="#86EFAC" />
      </div>
    </div>
  );
}
