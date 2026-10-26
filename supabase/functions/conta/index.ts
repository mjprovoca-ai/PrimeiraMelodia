// Primeira Melodia · cadastro por e-mail e senha
//
// POST /conta/cadastrar  { nome, email, senha, convite? }
// Cria a conta já confirmada (o app não depende de e-mail de confirmação) e o app entra em seguida com a senha.
// Limite simples por IP para evitar cadastros em massa.

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

function chaveServico(): string {
  const k = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (k) return k;
  const todas = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (todas) {
    try {
      const v = Object.values(JSON.parse(todas))[0];
      if (typeof v === "string") return v;
    } catch (_) { /* segue */ }
  }
  throw new Error("Chave de serviço ausente");
}

const admin = createClient(SUPABASE_URL, chaveServico(), { auth: { persistSession: false, autoRefreshToken: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

async function cadastrar(req: Request) {
  const { nome, email, senha, convite, site } = await req.json().catch(() => ({}));
  if (site) return json({ ok: true }); // armadilha para robôs
  const n = String(nome ?? "").trim();
  const e = String(email ?? "").trim().toLowerCase();
  const s = String(senha ?? "");
  if (n.length < 2 || n.length > 60) return json({ erro: "Escreva seu nome." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return json({ erro: "Esse e-mail não parece certo." }, 400);
  if (s.length < 6) return json({ erro: "A senha precisa ter pelo menos 6 caracteres." }, 400);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconhecido";
  const { data: permitido } = await admin.rpc("cadastro_permitido", { p_ip: ip });
  if (permitido === false) return json({ erro: "Muitos cadastros seguidos daqui. Tente de novo em uma hora." }, 429);

  const { error } = await admin.auth.admin.createUser({
    email: e,
    password: s,
    email_confirm: true,
    user_metadata: { nome: n, convite: String(convite ?? "").trim().toUpperCase() || undefined },
  });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
      return json({ erro: "Esse e-mail já tem conta. Entre com sua senha." }, 409);
    }
    if (msg.includes("password")) return json({ erro: "Escolha uma senha mais forte." }, 400);
    console.error("cadastro", error.message);
    return json({ erro: "Não foi possível criar a conta agora." }, 500);
  }
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  try {
    if (rota === "cadastrar" && req.method === "POST") return await cadastrar(req);
    return json({ ok: true, servico: "conta" });
  } catch (e) {
    console.error("conta", e);
    return json({ erro: "Erro inesperado." }, 500);
  }
});
