import BotaoRpc from "@/components/admin/BotaoRpc";
import FormConfig from "@/components/admin/FormConfig";
import { supabaseServidor } from "@/lib/supabase/server";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";
import { brl, dataHora } from "@/lib/dados";

async function statusFuncao(nome: string) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/${nome}`, { headers: { apikey: SUPABASE_KEY }, cache: "no-store" });
    return (await r.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function AdminConfig() {
  const sb = await supabaseServidor();
  const [{ data: cfg }, { data: pacotes }, { data: licencas }, pag, mus] = await Promise.all([
    sb.from("config").select("chave, valor"),
    sb.from("pacotes").select("id, nome, creditos, preco_centavos, ativo").order("ordem"),
    sb.from("pedidos_licenca").select("id, tipo, descricao, contato, status, created_at, criacao_id").order("created_at", { ascending: false }).limit(50),
    statusFuncao("pagamentos"),
    statusFuncao("musica"),
  ]);
  const c: Record<string, unknown> = {};
  (cfg ?? []).forEach((x: { chave: string; valor: unknown }) => (c[x.chave] = x.valor));

  return (
    <div className="pilha" style={{ gap: 18 }}>
      <div className="cartao forte">
        <b style={{ fontSize: 18 }}>Ligações</b>
        <ul className="lista mt12">
          <li>💳 Pix Mercado Pago: {pag?.pix ? <b className="verde">ativo</b> : <b style={{ color: "var(--sol)" }}>falta o Access Token (segredo MP_ACCESS_TOKEN no Supabase)</b>}</li>
          <li>🎵 Geração de música: {mus?.provedor === "demo" ? <b style={{ color: "var(--sol)" }}>modo demonstração (falta SUNO_API_KEY)</b> : <b className="verde">{String(mus?.provedor ?? "?")}</b>}</li>
          <li>✍️ Letras pela IA e regra “só emocionar”: {mus?.ia_texto ? <b className="verde">ativas</b> : <span className="muted">desligadas (opcional: ANTHROPIC_API_KEY)</span>}</li>
          <li>🔔 Avisos no celular (app ntfy), tópico: <b>{String(c.ntfy_topico ?? "—")}</b></li>
        </ul>
      </div>

      <FormConfig inicial={{
        modo_teste: c.modo_teste === true,
        palco_moderacao_previa: c.palco_moderacao_previa === true,
        aviso: typeof c.aviso === "string" ? c.aviso : "",
        fundo_percentual: Number(c.fundo_percentual ?? 10),
        pix_minutos: Number(c.pix_minutos ?? 60),
        ntfy_topico: String(c.ntfy_topico ?? ""),
      }} />

      <div className="cartao forte">
        <b style={{ fontSize: 18 }}>Pacotes</b>
        <div className="tabela-wrap mt12">
          <table className="tabela">
            <thead><tr><th>Pacote</th><th>Preço</th><th>Status</th><th /></tr></thead>
            <tbody>
              {(pacotes ?? []).map((p) => (
                <tr key={p.id}>
                  <td>{p.nome} ({p.creditos} créditos)</td>
                  <td>{brl(p.preco_centavos)}</td>
                  <td>{p.ativo ? "à venda" : "pausado"}</td>
                  <td><BotaoRpc fn="admin_pacote" args={{ p_id: p.id, p_preco_centavos: p.preco_centavos, p_ativo: !p.ativo }} rotulo={p.ativo ? "Pausar" : "Voltar a vender"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="pequeno mt8">Para mudar preços, me peça ou use o SQL do Supabase (tabela pacotes).</p>
      </div>

      <div className="cartao forte" id="licencas">
        <b style={{ fontSize: 18 }}>Pedidos de uso comercial</b>
        {!licencas?.length ? <p className="sub">Nenhum pedido ainda.</p> : (
          <ul className="lista mt12">
            {licencas.map((l) => (
              <li key={l.id} className="item-lista" style={{ alignItems: "flex-start" }}>
                <span className="m">
                  <b style={{ whiteSpace: "normal" }}>{l.tipo} · {l.status}</b>
                  <span className="sub2" style={{ whiteSpace: "pre-wrap", color: "#d4d4d8" }}>{l.descricao}</span>
                  <span className="sub2">{l.contato || "sem contato extra"} · {dataHora(l.created_at)}{l.criacao_id ? <> · <a href={`/m/${l.criacao_id}`}>ver música</a></> : null}</span>
                </span>
                {l.status !== "fechado" ? <BotaoRpc fn="admin_licenca_status" args={{ p_id: l.id, p_status: l.status === "aberto" ? "em_conversa" : "fechado" }} rotulo={l.status === "aberto" ? "Em conversa" : "Fechar"} /> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
