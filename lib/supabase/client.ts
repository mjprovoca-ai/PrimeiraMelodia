"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

let cliente: SupabaseClient | null = null;

export function supabaseNavegador(): SupabaseClient {
  if (!cliente) cliente = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return cliente;
}

/** Mensagem amigável a partir de um erro do Supabase (as funções do banco já falam português). */
export function mensagemErro(e: unknown, padrao = "Algo deu errado. Tente de novo."): string {
  const m = (e as { message?: string })?.message;
  if (!m) return padrao;
  if (/JWT|token/i.test(m)) return "Sua sessão expirou. Entre de novo.";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Sem conexão. Confira a internet e tente de novo.";
  return m;
}

/** Chama uma Edge Function com a sessão do usuário. */
export async function chamarFuncao<T = unknown>(rota: string, corpo: unknown = {}): Promise<T> {
  const sb = supabaseNavegador();
  const { data: s } = await sb.auth.getSession();
  const token = s.session?.access_token;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${rota}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(corpo),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.erro || "Não foi possível concluir agora.");
  return json as T;
}
