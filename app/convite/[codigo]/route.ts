import { NextResponse, type NextRequest } from "next/server";

// Link de convite: guarda o código por 30 dias e leva para o cadastro.
export async function GET(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const limpo = String(codigo || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  const resposta = NextResponse.redirect(new URL("/entrar?modo=cadastrar", request.url));
  if (limpo) resposta.cookies.set("pm-convite", limpo, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  return resposta;
}
