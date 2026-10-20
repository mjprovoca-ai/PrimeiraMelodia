import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PedidoPix from "@/components/PedidoPix";
import { supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pagamento" };

export default async function Pedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServidor();
  const { data: p } = await sb.from("pedidos")
    .select("id, codigo, status, valor_final, creditos, pix_copia_cola, pix_qr_base64, pix_ticket_url, expira_em, created_at")
    .eq("id", id).maybeSingle();
  if (!p) notFound();
  const volta = sp.volta && sp.volta.startsWith("/") && !sp.volta.startsWith("//") ? sp.volta : "/criar";
  return (
    <>
      <p className="olho">Pedido {p.codigo}</p>
      <h1 className="titulo">Pague com Pix</h1>
      <PedidoPix pedido={p} volta={volta} />
    </>
  );
}
