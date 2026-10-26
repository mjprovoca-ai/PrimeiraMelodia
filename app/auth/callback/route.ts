import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/server";

// Volta do login com Google: troca o código pela sessão e aplica o convite, se houver.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const volta = url.searchParams.get("volta") || "/criar";
  const destino = volta.startsWith("/") && !volta.startsWith("//") ? volta : "/criar";
  if (!code) return NextResponse.redirect(new URL("/entrar?erro=1", request.url));
  const sb = await supabaseServidor();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/entrar?erro=1", request.url));
  const convite = request.cookies.get("pm-convite")?.value;
  const resposta = NextResponse.redirect(new URL(destino, request.url));
  if (convite) {
    await sb.rpc("aplicar_convite", { p_codigo: convite });
    resposta.cookies.set("pm-convite", "", { path: "/", maxAge: 0 });
  }
  return resposta;
}
