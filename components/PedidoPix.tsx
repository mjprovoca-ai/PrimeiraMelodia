"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { chamarFuncao } from "@/lib/supabase/client";
import { brl } from "@/lib/dados";
import { IcCopiar, IcOk } from "@/components/Icones";

type Pedido = {
  id: string;
  codigo: string;
  status: string;
  valor_final: number;
  creditos: number;
  pix_copia_cola: string | null;
  pix_qr_base64: string | null;
  pix_ticket_url: string | null;
  expira_em: string;
};

export default function PedidoPix({ pedido, volta }: { pedido: Pedido; volta: string }) {
  const [p, setP] = useState(pedido);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [restante, setRestante] = useState("");
  const gerou = useRef(false);

  // gera o QR Code (uma vez)
  useEffect(() => {
    if (p.status !== "pendente" || p.pix_copia_cola || gerou.current) return;
    gerou.current = true;
    chamarFuncao<{ copia_cola: string; qr_base64: string; ticket_url: string; status: string }>("pagamentos/criar", { pedido_id: p.id })
      .then((r) => setP((x) => ({ ...x, status: r.status ?? x.status, pix_copia_cola: r.copia_cola, pix_qr_base64: r.qr_base64, pix_ticket_url: r.ticket_url })))
      .catch((e) => setErro(e.message));
  }, [p.id, p.status, p.pix_copia_cola]);

  // confere o pagamento a cada 4 segundos
  useEffect(() => {
    if (p.status !== "pendente" || !p.pix_copia_cola) return;
    const t = setInterval(async () => {
      try {
        const r = await chamarFuncao<{ status: string }>("pagamentos/status", { pedido_id: p.id });
        if (r.status !== "pendente") setP((x) => ({ ...x, status: r.status }));
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    }, 4000);
    return () => clearInterval(t);
  }, [p.id, p.status, p.pix_copia_cola]);

  // contagem regressiva
  useEffect(() => {
    const t = setInterval(() => {
      const ms = new Date(p.expira_em).getTime() - Date.now();
      if (ms <= 0) return setRestante("expirado");
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRestante(`${m}:${String(s).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(t);
  }, [p.expira_em]);

  async function copiar() {
    if (!p.pix_copia_cola) return;
    try {
      await navigator.clipboard.writeText(p.pix_copia_cola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Não deu para copiar. Toque e segure no código para copiar.");
    }
  }

  if (p.status === "pago") {
    return (
      <div className="cartao mt24 centro">
        <div style={{ fontSize: 54 }}>🎉</div>
        <h2 className="mt8">Pagamento confirmado!</h2>
        <p className="sub">{p.creditos} {p.creditos === 1 ? "crédito liberado" : "créditos liberados"}. Obrigado por fazer parte, e 10% disso já foi para o fundo ESG.</p>
        <Link href={volta} className="btn btn-pri mt20">Criar minha música</Link>
      </div>
    );
  }
  if (p.status === "expirado" || p.status === "cancelado") {
    return (
      <div className="cartao mt24 centro">
        <h2>Esse Pix expirou</h2>
        <p className="sub">Nenhum valor foi cobrado. Se você chegou a pagar, o crédito entra sozinho em alguns minutos.</p>
        <Link href="/comprar" className="btn btn-pri mt20">Gerar um novo Pix</Link>
      </div>
    );
  }

  return (
    <div className="mt24">
      <div className="cartao centro">
        <p className="pequeno">Valor</p>
        <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-.02em" }}>{brl(p.valor_final)}</p>
        <p className="pequeno">{p.creditos} {p.creditos === 1 ? "crédito" : "créditos"} · expira em {restante}</p>
        {erro ? <p className="erro-msg mt16">{erro}</p> : null}
        {!p.pix_copia_cola && !erro ? <p className="sub mt20">Gerando o QR Code…</p> : null}
        {p.pix_qr_base64 ? (
          <div className="qr mt20"><img src={`data:image/png;base64,${p.pix_qr_base64}`} alt="QR Code do Pix" /></div>
        ) : null}
        {p.pix_copia_cola ? (
          <>
            <p className="pequeno mt20">Ou copie o código Pix (copia e cola):</p>
            <div className="copia mt8">{p.pix_copia_cola}</div>
            <button type="button" className="btn btn-pri mt12" onClick={copiar}>
              {copiado ? <><IcOk /> Copiado!</> : <><IcCopiar /> Copiar código Pix</>}
            </button>
          </>
        ) : null}
      </div>
      <div className="cartao mt16">
        <p className="linha-flex"><span className="etiqueta vivo"><i /> aguardando</span> <span className="pequeno">Assim que o Pix cair, esta tela muda sozinha.</span></p>
        <ol className="pequeno" style={{ margin: "12px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
          <li>Abra o app do seu banco e escolha Pix.</li>
          <li>Leia o QR Code ou cole o código.</li>
          <li>Confirme o pagamento. Pronto: os créditos entram na hora.</li>
        </ol>
      </div>
    </div>
  );
}
