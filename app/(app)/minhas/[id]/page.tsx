import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MinhaMusica from "@/components/MinhaMusica";
import { meuPerfil, supabaseServidor } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Minha música" };

export default async function PaginaMusica({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await supabaseServidor();
  const [{ data }, perfil] = await Promise.all([sb.rpc("minha_criacao", { p_id: id }), meuPerfil()]);
  if (!data) notFound();
  return <MinhaMusica inicial={data} nova={sp.nova === "1"} convite={perfil?.convite_codigo ?? ""} />;
}
