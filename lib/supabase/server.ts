import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

export async function supabaseServidor() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(lista) {
        try {
          lista.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // em Server Components não dá para gravar cookie; o middleware renova a sessão
        }
      },
    },
  });
}

export type Perfil = {
  id: string;
  nome: string;
  username: string;
  avatar_url: string | null;
  email: string;
  role: "user" | "admin";
  mundo: "floresta" | "oceano" | "animais" | "universo" | null;
  creditos: number;
  sementes: number;
  convite_codigo: string;
  created_at: string;
  nao_lidas: number;
  contagens: { musicas: number; plays: number; compartilhamentos: number; convites: number };
};

/** Perfil completo de quem está logado (ou null). */
export async function meuPerfil(): Promise<Perfil | null> {
  const sb = await supabaseServidor();
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return null;
  const { data } = await sb.rpc("meu_perfil");
  return (data as Perfil) ?? null;
}

/** Configurações públicas (modo de teste, aviso, % do fundo). */
export async function configPublica(): Promise<Record<string, unknown>> {
  const sb = await supabaseServidor();
  const { data } = await sb.from("config").select("chave, valor").eq("publico", true);
  const r: Record<string, unknown> = {};
  (data ?? []).forEach((c: { chave: string; valor: unknown }) => (r[c.chave] = c.valor));
  return r;
}
