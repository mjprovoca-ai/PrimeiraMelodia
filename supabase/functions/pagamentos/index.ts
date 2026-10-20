// Primeira Melodia · Pix automático pelo Mercado Pago (API de Orders)
//
// Rotas (POST):
//   /pagamentos/criar     usuário logado: gera o QR Code Pix de um pedido pendente
//   /pagamentos/status    usuário logado: confere no Mercado Pago se o Pix caiu (a tela consulta a cada poucos segundos)
//   /pagamentos/webhook   Mercado Pago avisa (opcional: configurar a URL no painel "Suas integrações")
//   /pagamentos/conferir  agendador do banco (a cada minuto): confere todos os Pix pendentes
//
// Segredos (Supabase > Edge Functions > Secrets):
//   MP_ACCESS_TOKEN     Access Token de produção da conta Mercado Pago que recebe (começa com APP_USR-)
//   MP_WEBHOOK_SECRET   (opcional) assinatura secreta dos webhooks
//
// Regra de ouro: nunca confiamos no aviso; sempre buscamos o pedido no Mercado Pago antes de liberar crédito.

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const MP = "https://api.mercadopago.com";

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
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// deno-lint-ignore no-explicit-any
type Pedido = Record<string, any>;

async function usuario(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

const tokenMP = () => Deno.env.get("MP_ACCESS_TOKEN") ?? "";

// deno-lint-ignore no-explicit-any
async function mp(caminho: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(MP + caminho, {
    ...init,
    headers: { Authorization: `Bearer ${tokenMP()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const txt = await res.text();
  let body: unknown = null;
  try {
    body = JSON.parse(txt);
  } catch (_) {
    body = { raw: txt };
  }
  return { ok: res.ok, status: res.status, body };
}

const reais = (centavos: number) => (centavos / 100).toFixed(2);

// deno-lint-ignore no-explicit-any
function foiPago(order: any): boolean {
  if (!order) return false;
  const pg = order?.transactions?.payments?.[0];
  if (order.status === "processed" && (!order.status_detail || order.status_detail === "accredited")) return true;
  return pg?.status === "processed" && (pg?.status_detail === "accredited" || order.status === "processed");
}

// deno-lint-ignore no-explicit-any
function cancelado(order: any): boolean {
  return ["canceled", "cancelled", "expired", "failed", "refunded"].includes(String(order?.status ?? ""));
}

// deno-lint-ignore no-explicit-any
function dadosPix(order: any) {
  const pm = order?.transactions?.payments?.[0]?.payment_method ?? {};
  return { copia_cola: pm.qr_code ?? null, qr_base64: pm.qr_code_base64 ?? null, ticket_url: pm.ticket_url ?? null };
}

function resposta(p: Pedido) {
  return {
    status: p.status,
    codigo: p.codigo,
    valor_final: p.valor_final,
    creditos: p.creditos,
    copia_cola: p.pix_copia_cola,
    qr_base64: p.pix_qr_base64,
    ticket_url: p.pix_ticket_url,
    expira_em: p.expira_em,
  };
}

async function conferirPedido(p: Pedido): Promise<string> {
  if (p.status === "pago") return "pago";
  if (!p.mp_order_id || !tokenMP()) return p.status;
  const r = await mp(`/v1/orders/${encodeURIComponent(p.mp_order_id)}`);
  if (!r.ok) {
    console.error("MP consulta", r.status, JSON.stringify(r.body).slice(0, 400));
    return p.status;
  }
  if (foiPago(r.body)) {
    const ref = String(r.body?.transactions?.payments?.[0]?.id ?? r.body?.id ?? "");
    const { error } = await admin.rpc("pagamento_confirmado", { p_pedido: p.id, p_ref: "mp:" + ref });
    if (error) console.error("liberar", error.message);
    return "pago";
  }
  if (cancelado(r.body) && p.status === "pendente") {
    await admin.from("pedidos").update({ status: "expirado", updated_at: new Date().toISOString() })
      .eq("id", p.id).eq("status", "pendente");
    return "expirado";
  }
  return p.status;
}

async function criar(req: Request) {
  const user = await usuario(req);
  if (!user) return json({ erro: "Entre na sua conta." }, 401);
  const { pedido_id } = await req.json().catch(() => ({}));
  const { data: p } = await admin.from("pedidos").select("*").eq("id", pedido_id).eq("user_id", user.id).maybeSingle();
  if (!p) return json({ erro: "Pedido não encontrado." }, 404);
  if (p.status === "pago") return json(resposta(p));
  if (p.status !== "pendente") return json({ erro: "Esse pedido expirou. Faça um novo.", status: p.status }, 409);
  if (p.mp_order_id && p.pix_copia_cola) return json(resposta(p));
  if (!tokenMP()) {
    return json({ erro: "O Pix automático ainda está sendo ativado. Tente de novo mais tarde.", codigo: "pix_indisponivel" }, 503);
  }
  const minutos = Math.max(30, Math.round((new Date(p.expira_em).getTime() - Date.now()) / 60000));
  const corpo = {
    type: "online",
    processing_mode: "automatic",
    external_reference: p.codigo,
    total_amount: reais(p.valor_final),
    payer: { email: user.email },
    transactions: {
      payments: [{
        amount: reais(p.valor_final),
        payment_method: { id: "pix", type: "bank_transfer" },
        expiration_time: `PT${minutos}M`,
      }],
    },
  };
  const r = await mp("/v1/orders", { method: "POST", body: JSON.stringify(corpo), headers: { "X-Idempotency-Key": p.id } });
  if (!r.ok || !r.body?.id) {
    console.error("MP criar", r.status, JSON.stringify(r.body).slice(0, 800));
    return json({ erro: "Não foi possível gerar o Pix agora. Tente de novo em instantes." }, 502);
  }
  let order = r.body;
  let pix = dadosPix(order);
  for (let i = 0; i < 3 && !pix.copia_cola; i++) {
    await new Promise((ok) => setTimeout(ok, 1500));
    const g = await mp(`/v1/orders/${encodeURIComponent(order.id)}`);
    if (g.ok) {
      order = g.body;
      pix = dadosPix(order);
    }
  }
  const atualizacao = {
    mp_order_id: String(order.id),
    pix_copia_cola: pix.copia_cola,
    pix_qr_base64: pix.qr_base64,
    pix_ticket_url: pix.ticket_url,
    updated_at: new Date().toISOString(),
  };
  await admin.from("pedidos").update(atualizacao).eq("id", p.id);
  return json(resposta({ ...p, ...atualizacao }));
}

async function status(req: Request) {
  const user = await usuario(req);
  if (!user) return json({ erro: "Entre na sua conta." }, 401);
  const { pedido_id } = await req.json().catch(() => ({}));
  const { data: p } = await admin.from("pedidos").select("*").eq("id", pedido_id).eq("user_id", user.id).maybeSingle();
  if (!p) return json({ erro: "Pedido não encontrado." }, 404);
  const st = await conferirPedido(p);
  return json({ status: st });
}

async function hmacHex(chave: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(chave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function webhook(req: Request) {
  const url = new URL(req.url);
  const corpo = await req.json().catch(() => ({}));
  const id = url.searchParams.get("data.id") ?? corpo?.data?.id ?? url.searchParams.get("id") ?? corpo?.id;
  const segredo = Deno.env.get("MP_WEBHOOK_SECRET");
  if (segredo && id) {
    const assinatura = req.headers.get("x-signature") ?? "";
    const requestId = req.headers.get("x-request-id") ?? "";
    const partes = Object.fromEntries(assinatura.split(",").map((s) => s.trim().split("=") as [string, string]));
    const manifesto = `id:${String(id).toLowerCase()};request-id:${requestId};ts:${partes.ts};`;
    if (!partes.v1 || (await hmacHex(segredo, manifesto)) !== partes.v1) {
      console.warn("webhook com assinatura inválida");
      return json({ ok: false }, 401);
    }
  }
  if (id) {
    const { data: p } = await admin.from("pedidos").select("*").eq("mp_order_id", String(id)).maybeSingle();
    if (p) await conferirPedido(p);
  }
  return json({ ok: true });
}

async function conferirTodos(req: Request) {
  const { data: ok } = await admin.rpc("cron_confere", { p_segredo: req.headers.get("x-cron-secret") ?? "" });
  if (!ok) return json({ erro: "proibido" }, 403);
  const desde = new Date(Date.now() - 3 * 3600_000).toISOString();
  const { data: pendentes } = await admin.from("pedidos").select("*").eq("status", "pendente")
    .not("mp_order_id", "is", null).gte("created_at", desde).order("created_at").limit(40);
  let pagos = 0;
  for (const p of pendentes ?? []) {
    if ((await conferirPedido(p)) === "pago") pagos++;
  }
  await admin.rpc("expirar_pedidos");
  return json({ conferidos: pendentes?.length ?? 0, pagos });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  try {
    switch (rota) {
      case "criar":
        return await criar(req);
      case "status":
        return await status(req);
      case "webhook":
        return await webhook(req);
      case "conferir":
        return await conferirTodos(req);
      default:
        return json({ ok: true, servico: "pagamentos", pix: Boolean(tokenMP()) });
    }
  } catch (e) {
    console.error("pagamentos", e);
    return json({ erro: "Erro inesperado. Tente de novo." }, 500);
  }
});
