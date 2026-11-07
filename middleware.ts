import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

const PRIVADAS = ["/criar", "/comprar", "/pedido", "/minhas", "/mundo", "/lojinha", "/perfil", "/notificacoes", "/boas-vindas", "/admin"];

export async function middleware(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista) {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const privada = PRIVADAS.some((p) => caminho === p || caminho.startsWith(p + "/"));
  if (!user && privada) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?volta=${encodeURIComponent(caminho + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (user && (caminho === "/" || caminho === "/entrar")) {
    const volta = request.nextUrl.searchParams.get("volta") || "";
    const destino = volta.startsWith("/") && !volta.startsWith("//") ? volta : "/criar";
    return NextResponse.redirect(new URL(destino, request.url));
  }
  return resposta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|opengraph-image.png|mundos/|marca/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|mp3|wav)$).*)"],
};
