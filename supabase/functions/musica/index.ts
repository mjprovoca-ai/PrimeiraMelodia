// Primeira Melodia · trabalhador que transforma cada criação em duas versões de música
//
// Rotas (POST):
//   /musica/processar  agendador do banco (a cada minuto e logo depois de cada criação): inicia e confere as gerações
//   /musica/callback   aviso do provedor de música quando a geração termina
//   /musica/agora      usuário logado: pede para processar já (a tela chama depois de criar)
//
// Provedores (segredo MUSIC_PROVIDER):
//   sunoapi  API do Suno (padrão quando SUNO_API_KEY existe). Gera duas versões por pedido.
//   demo     sem custo: sintetiza uma melodia de teste, para validar o app inteiro antes de ligar o provedor.
//
// Segredos opcionais: SUNO_API_KEY, SUNO_API_BASE (padrão https://api.sunoapi.org), SUNO_MODEL (padrão V4_5),
//   ANTHROPIC_API_KEY + ANTHROPIC_MODEL: escreve a letra quando "a IA cria" e aplica a regra "só emocionar".

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const FUNCOES = `${SUPABASE_URL}/functions/v1`;
const SUNO_BASE = (Deno.env.get("SUNO_API_BASE") ?? "https://api.sunoapi.org").replace(/\/$/, "");
const SUNO_KEY = Deno.env.get("SUNO_API_KEY") ?? "";
const SUNO_MODEL = Deno.env.get("SUNO_MODEL") ?? "V4_5";
const PROVEDOR = (Deno.env.get("MUSIC_PROVIDER") ?? (SUNO_KEY ? "sunoapi" : "demo")).toLowerCase();
const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-haiku-5-5";

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
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type Criacao = {
  id: string;
  user_id: string;
  titulo: string;
  para_quem: string | null;
  historia: string | null;
  tem_letra: boolean;
  letra: string | null;
  estilo: string;
  voz: string;
  mundo: string | null;
  status: string;
  provedor: string | null;
  tarefa_id: string | null;
  tentativas: number;
  created_at: string;
};
type Faixa = { url: string; duracao: number; id?: string };
type LinhaKaraoke = { t: number; f: number; l: string };

// ------------------------------------------------------------ estilos
const ESTILOS: Record<string, string> = {
  pop: "Brazilian pop, catchy, warm",
  mpb: "MPB, Brazilian popular music, acoustic guitar",
  sertanejo: "sertanejo, Brazilian country, acoustic",
  samba: "samba, cavaquinho, pandeiro, joyful",
  pagode: "pagode, Brazilian samba pop, festive",
  forro: "forró, accordion, zabumba, northeastern Brazil",
  bossa: "bossa nova, soft nylon guitar, intimate",
  rock: "pop rock, electric guitars, uplifting",
  gospel: "gospel, choir, uplifting, hopeful",
  infantil: "children's song, playful, sweet",
  reggae: "reggae, laid back, sunny",
  eletronica: "electronic pop, dance, bright synths",
  romantica: "romantic ballad, piano, strings",
};
const NOME_ESTILO: Record<string, string> = {
  pop: "pop", mpb: "MPB", sertanejo: "sertanejo", samba: "samba", pagode: "pagode", forro: "forró", bossa: "bossa nova",
  rock: "pop rock", gospel: "gospel", infantil: "infantil", reggae: "reggae", eletronica: "eletrônica", romantica: "balada romântica",
};

function estiloSuno(c: Criacao) {
  const base = ESTILOS[c.estilo] ?? `${c.estilo}, Brazilian`;
  return `${base}, emotional, heartfelt, Portuguese lyrics, ${c.voz === "masculina" ? "male vocals" : "female vocals"}`;
}

function descricao(c: Criacao) {
  const estilo = NOME_ESTILO[c.estilo] ?? c.estilo;
  const pessoa = c.para_quem ? ` para ${c.para_quem}` : "";
  const t = `Música ${estilo} emocionante e positiva em português do Brasil, voz ${c.voz}${pessoa}. ${c.historia ?? ""}`;
  return t.replace(/\s+/g, " ").trim().slice(0, 490);
}

// ------------------------------------------------------------ letra e regra "só emocionar" (opcional)
const SISTEMA = `Você escreve letras de música em português do Brasil para o app Primeira Melodia.
Regra da plataforma: a música existe para EMOCIONAR. Pode: amor, amizade, gratidão, celebração, família, conquistas, natureza, fé,
saudade carinhosa e histórias de SUPERAÇÃO. Não pode: história triste sem superação (luto/doença/depressão como foco),
ódio, violência, conteúdo sexual, ofensas, ataques a pessoas reais ou marcas, política partidária.
Responda SOMENTE um JSON, sem texto fora dele:
{"permitido": true|false, "motivo": "se não permitido: uma frase gentil explicando e sugerindo outro ângulo", "letra": "..."}
Quando for escrever a letra: use as seções [Verso 1], [Refrão], [Verso 2], [Refrão], [Ponte], [Refrão]; até 1.600 caracteres;
rimas simples; cite o nome da pessoa homenageada quando houver; nada de clichê vazio, use os detalhes da história.`;

async function escreverComIA(c: Criacao): Promise<{ permitido: boolean; motivo?: string; letra?: string } | null> {
  if (!ANTHROPIC_KEY) return null;
  const pedido = c.tem_letra
    ? `Apenas avalie se esta letra respeita a regra (não reescreva; devolva "letra" vazia):\n\n${c.letra}`
    : `Escreva a letra.\nPara quem: ${c.para_quem ?? "(não informado)"}\nEstilo: ${NOME_ESTILO[c.estilo] ?? c.estilo}\nVoz: ${c.voz}\nHistória: ${c.historia}`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1500, system: SISTEMA, messages: [{ role: "user", content: pedido }] }),
    });
    const j = await res.json();
    const texto: string = j?.content?.[0]?.text ?? "";
    const ini = texto.indexOf("{");
    const fim = texto.lastIndexOf("}");
    if (ini < 0 || fim < ini) return null;
    const r = JSON.parse(texto.slice(ini, fim + 1));
    return { permitido: r.permitido !== false, motivo: r.motivo, letra: typeof r.letra === "string" ? r.letra.trim() : undefined };
  } catch (e) {
    console.error("IA de texto", e);
    return null;
  }
}

// ------------------------------------------------------------ karaokê
function linhasDaLetra(letra: string | null | undefined) {
  return (letra ?? "").split("\n").map((l) => l.trim()).filter((l) => l && !/^\[.*\]$/.test(l) && !/^\(.*\)$/.test(l));
}

function distribuir(letra: string | null | undefined, duracao: number): LinhaKaraoke[] | null {
  const linhas = linhasDaLetra(letra);
  if (!linhas.length || !duracao) return null;
  const ini = duracao * 0.08;
  const fim = duracao * 0.94;
  const passo = (fim - ini) / linhas.length;
  return linhas.map((l, i) => ({ t: +(ini + i * passo).toFixed(2), f: +(ini + (i + 1) * passo).toFixed(2), l }));
}

async function karaokeSuno(taskId: string, audioId: string | undefined, letra: string | null, duracao: number) {
  if (!audioId || !letra) return distribuir(letra, duracao);
  try {
    const res = await fetch(`${SUNO_BASE}/api/v1/generate/get-timestamped-lyrics`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUNO_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, audioId }),
    });
    const j = await res.json();
    // deno-lint-ignore no-explicit-any
    const palavras: any[] = j?.data?.alignedWords ?? [];
    if (!palavras.length) return distribuir(letra, duracao);
    const linhas = linhasDaLetra(letra);
    const limpar = (s: string) => s.replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
    const fila = palavras.map((p) => ({ w: limpar(String(p.word ?? "")), t: Number(p.startS ?? 0), f: Number(p.endS ?? 0) }))
      .filter((p) => p.w);
    const saida: LinhaKaraoke[] = [];
    let k = 0;
    for (const l of linhas) {
      const n = l.split(/\s+/).length;
      const grupo = fila.slice(k, k + n);
      if (!grupo.length) break;
      saida.push({ t: +grupo[0].t.toFixed(2), f: +grupo[grupo.length - 1].f.toFixed(2), l });
      k += n;
    }
    return saida.length >= Math.min(3, linhas.length) ? saida : distribuir(letra, duracao);
  } catch (_) {
    return distribuir(letra, duracao);
  }
}

// ------------------------------------------------------------ Suno
async function sunoIniciar(c: Criacao, letra: string | null) {
  const callBackUrl = `${FUNCOES}/musica/callback`;
  const corpo = letra
    ? {
      customMode: true,
      instrumental: false,
      model: SUNO_MODEL,
      prompt: letra.slice(0, 3000),
      style: estiloSuno(c).slice(0, 200),
      title: c.titulo.slice(0, 80),
      vocalGender: c.voz === "masculina" ? "m" : "f",
      callBackUrl,
    }
    : { customMode: false, instrumental: false, model: SUNO_MODEL, prompt: descricao(c), callBackUrl };
  const res = await fetch(`${SUNO_BASE}/api/v1/generate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUNO_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const j = await res.json().catch(() => ({}));
  const taskId = j?.data?.taskId ?? j?.taskId;
  if (!res.ok || (j?.code && j.code !== 200) || !taskId) throw new Error(`Suno recusou: ${j?.msg ?? res.status}`);
  return String(taskId);
}

async function sunoChecar(taskId: string): Promise<
  { estado: "pronto"; faixas: Faixa[]; letra: string | null } | { estado: "falhou"; erro: string; definitivo: boolean } | { estado: "pendente" }
> {
  const res = await fetch(`${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${SUNO_KEY}` },
  });
  const j = await res.json().catch(() => ({}));
  const d = j?.data ?? {};
  const st = String(d.status ?? "").toUpperCase();
  let resp = d.response;
  if (typeof resp === "string") {
    try {
      resp = JSON.parse(resp);
    } catch (_) { /* segue */ }
  }
  // deno-lint-ignore no-explicit-any
  const lista: any[] = resp?.sunoData ?? resp?.data ?? [];
  const urls = lista.map((s) => s.audioUrl ?? s.audio_url ?? s.sourceAudioUrl).filter(Boolean);
  if (st === "SUCCESS" && urls.length) {
    return {
      estado: "pronto",
      faixas: lista.filter((s) => s.audioUrl ?? s.audio_url ?? s.sourceAudioUrl).slice(0, 2)
        .map((s) => ({ url: s.audioUrl ?? s.audio_url ?? s.sourceAudioUrl, duracao: Number(s.duration ?? 0), id: s.id })),
      letra: lista[0]?.prompt ?? null,
    };
  }
  if (st.includes("FAIL") || st.includes("ERROR")) {
    return { estado: "falhou", erro: d.errorMessage ?? st, definitivo: st.includes("SENSITIVE") };
  }
  return { estado: "pendente" };
}

// ------------------------------------------------------------ demo (sem custo)
function wavDemo(semente: number, segundos = 24, sr = 22050): Uint8Array {
  const n = segundos * sr;
  const amostras = new Int16Array(n);
  const escala = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
  const progressoes = [[[0, 2, 4], [4, 6, 1], [5, 0, 2], [3, 5, 0]], [[5, 0, 2], [3, 5, 0], [0, 2, 4], [4, 6, 1]]];
  const prog = progressoes[semente % 2];
  const bpm = 88 + (semente % 3) * 10;
  const tempo = 60 / bpm;
  const transp = semente % 2 ? 1 : Math.pow(2, 2 / 12);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const acorde = prog[Math.floor(t / (tempo * 4)) % 4];
    const passo = Math.floor(t / (tempo / 2));
    const f = escala[acorde[passo % 3]] * transp * (passo % 8 >= 4 ? 2 : 1);
    const dentro = t % (tempo / 2);
    let s = Math.sin(2 * Math.PI * f * t) * Math.exp(-dentro * 5) * 0.32;
    for (const k of acorde) s += Math.sin(2 * Math.PI * (escala[k] * transp / 2) * t) * 0.05;
    s += Math.sin(2 * Math.PI * (escala[acorde[0]] * transp / 4) * t) * 0.08 * Math.exp(-(t % tempo) * 3);
    const fade = Math.min(1, t / 1.5, (segundos - t) / 2.5);
    amostras[i] = Math.max(-1, Math.min(1, s * fade)) * 32767;
  }
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const escrever = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  escrever(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  escrever(8, "WAVE");
  escrever(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  escrever(36, "data");
  v.setUint32(40, n * 2, true);
  new Int16Array(buf, 44).set(amostras);
  return new Uint8Array(buf);
}

function letraDemo(c: Criacao) {
  const nome = c.para_quem || "você";
  return `[Verso 1]\nEssa é uma melodia de teste para ${nome}\nO app está quase pronto pra cantar de verdade\n` +
    `[Refrão]\nCrie uma música, emocione quem você ama\nCada canção planta um pouco de amanhã\n` +
    `[Verso 2]\nQuando a voz chegar, a história vai soar\nPrimeira Melodia, música em apoio ao planeta`;
}

// ------------------------------------------------------------ fluxo
async function subirFaixas(c: Criacao, faixas: Faixa[]) {
  const saida: { versao: number; storage_path: string; duracao_s: number; formato: string }[] = [];
  for (let i = 0; i < Math.min(2, faixas.length); i++) {
    const r = await fetch(faixas[i].url);
    if (!r.ok) throw new Error(`download da versão ${i + 1} falhou (${r.status})`);
    const dados = new Uint8Array(await r.arrayBuffer());
    const tipo = r.headers.get("content-type") ?? "";
    const wav = tipo.includes("wav") || faixas[i].url.endsWith(".wav");
    const caminho = `${c.user_id}/${c.id}/v${i + 1}.${wav ? "wav" : "mp3"}`;
    const up = await admin.storage.from("faixas").upload(caminho, dados, {
      contentType: wav ? "audio/wav" : "audio/mpeg",
      upsert: true,
    });
    if (up.error) throw new Error(`upload: ${up.error.message}`);
    const duracao = faixas[i].duracao || Math.round(dados.length * 8 / 128000);
    saida.push({ versao: i + 1, storage_path: caminho, duracao_s: duracao, formato: wav ? "wav" : "mp3" });
  }
  return saida;
}

async function finalizar(c: Criacao, faixas: { versao: number; storage_path: string; duracao_s: number; formato: string }[],
  letra: string | null, karaoke: LinhaKaraoke[] | null) {
  const { error } = await admin.rpc("worker_finalizar", { p_id: c.id, p_faixas: faixas, p_letra: letra, p_karaoke: karaoke });
  if (error) throw new Error(`finalizar: ${error.message}`);
}

async function falhar(c: Criacao, erro: string, definitivo = false, recusa = false) {
  console.error("criação", c.id, erro);
  await admin.rpc("worker_falhar", { p_id: c.id, p_erro: erro.slice(0, 900), p_definitivo: definitivo, p_recusa: recusa });
}

async function gerarDemo(c: Criacao, letra: string | null) {
  const texto = letra || letraDemo(c);
  const saida = [];
  for (const versao of [1, 2]) {
    const dados = wavDemo(versao + c.id.charCodeAt(0));
    const caminho = `${c.user_id}/${c.id}/v${versao}.wav`;
    const up = await admin.storage.from("faixas").upload(caminho, dados, { contentType: "audio/wav", upsert: true });
    if (up.error) throw new Error(`upload: ${up.error.message}`);
    saida.push({ versao, storage_path: caminho, duracao_s: 24, formato: "wav" });
  }
  await finalizar(c, saida, texto, distribuir(texto, 24));
  return "pronta";
}

async function iniciar(c: Criacao) {
  let letra = c.tem_letra ? c.letra : null;
  const ia = await escreverComIA(c);
  if (ia && !ia.permitido) {
    await falhar(c, ia.motivo || "Aqui a gente só cria músicas para emocionar. Que tal contar a parte bonita dessa história?", true, true);
    return "recusada";
  }
  if (!c.tem_letra && ia?.letra) letra = ia.letra;
  if (PROVEDOR === "demo") return await gerarDemo(c, letra);
  if (PROVEDOR === "sunoapi") {
    if (!SUNO_KEY) throw new Error("SUNO_API_KEY não configurada");
    const tarefa = await sunoIniciar(c, letra);
    await admin.rpc("worker_iniciada", { p_id: c.id, p_provedor: "sunoapi", p_tarefa: tarefa, p_letra: letra });
    return "iniciada";
  }
  throw new Error(`provedor desconhecido: ${PROVEDOR}`);
}

async function checar(c: Criacao) {
  if (c.provedor === "sunoapi" && c.tarefa_id) {
    const r = await sunoChecar(c.tarefa_id);
    if (r.estado === "pronto") {
      const faixas = await subirFaixas(c, r.faixas);
      const letra = c.letra || r.letra;
      const karaoke = await karaokeSuno(c.tarefa_id, r.faixas[0]?.id, letra, faixas[0]?.duracao_s ?? 0);
      await finalizar(c, faixas, letra, karaoke);
      return "pronta";
    }
    if (r.estado === "falhou") {
      await falhar(c, r.erro, r.definitivo);
      return "falhou";
    }
    await admin.rpc("worker_aguardar", { p_id: c.id });
    return "aguardando";
  }
  await falhar(c, "geração sem tarefa; vai tentar de novo");
  return "reiniciada";
}

async function processarUma(c: Criacao) {
  try {
    return c.status === "na_fila" ? await iniciar(c) : await checar(c);
  } catch (e) {
    await falhar(c, String((e as Error)?.message ?? e));
    return "erro";
  }
}

async function processar() {
  const { data, error } = await admin.rpc("worker_pegar", { p_limite: 3 });
  if (error) throw new Error(error.message);
  const lista = (data ?? []) as Criacao[];
  const resultados = await Promise.all(lista.map(processarUma));
  return { processadas: lista.length, resultados, provedor: PROVEDOR };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const rota = new URL(req.url).pathname.split("/").filter(Boolean).pop();
  try {
    if (rota === "processar") {
      const { data: ok } = await admin.rpc("cron_confere", { p_segredo: req.headers.get("x-cron-secret") ?? "" });
      if (!ok) return json({ erro: "proibido" }, 403);
      return json(await processar());
    }
    if (rota === "agora") {
      const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
      const { data } = await admin.auth.getUser(token);
      if (!data?.user) return json({ erro: "Entre na sua conta." }, 401);
      return json(await processar());
    }
    if (rota === "callback") {
      const corpo = await req.json().catch(() => ({}));
      const tarefa = corpo?.data?.task_id ?? corpo?.data?.taskId ?? corpo?.taskId;
      if (tarefa) {
        await admin.from("criacoes").update({ checado_em: new Date(0).toISOString() }).eq("tarefa_id", String(tarefa)).eq("status", "gerando");
        const r = await processar();
        return json({ ok: true, ...r });
      }
      return json({ ok: true });
    }
    return json({ ok: true, servico: "musica", provedor: PROVEDOR, ia_texto: Boolean(ANTHROPIC_KEY) });
  } catch (e) {
    console.error("musica", e);
    return json({ erro: "Erro inesperado." }, 500);
  }
});
