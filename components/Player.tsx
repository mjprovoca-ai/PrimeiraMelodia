"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";
import { duracao as fmt } from "@/lib/dados";
import { IcPause, IcPlay } from "@/components/Icones";

/** Player de uma versão: ouve dentro do app (sem botão de baixar). */
export default function Player({ faixaId, caminho, rotulo, duracao, origem = "app", onTempo }: {
  faixaId: string; caminho: string; rotulo: string; duracao?: number; origem?: string; onTempo?: (t: number) => void;
}) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [t, setT] = useState(0);
  const [total, setTotal] = useState(duracao || 0);
  const [erro, setErro] = useState<string | null>(null);
  const contou = useRef(false);
  const onTempoRef = useRef(onTempo);
  onTempoRef.current = onTempo;

  // o link assinado (válido por 1 hora) já fica pronto antes do toque: assim o play começa no toque, inclusive no iPhone
  useEffect(() => {
    let vivo = true;
    supabaseNavegador().storage.from("faixas").createSignedUrl(caminho, 3600).then(({ data, error }) => {
      if (!vivo) return;
      if (error || !data) setErro("Não foi possível abrir a música.");
      else setUrl(data.signedUrl);
    });
    return () => {
      vivo = false;
    };
  }, [caminho]);

  useEffect(() => {
    const f = (e: Event) => {
      if ((e as CustomEvent).detail !== faixaId) audio.current?.pause();
    };
    window.addEventListener("pm:tocando", f);
    return () => {
      window.removeEventListener("pm:tocando", f);
      audio.current?.pause();
    };
  }, [faixaId]);

  function alternar() {
    setErro(null);
    if (tocando) {
      audio.current?.pause();
      return;
    }
    if (!audio.current) {
      if (!url) {
        setErro("Carregando… toque de novo.");
        return;
      }
      const a = new Audio(url);
      a.preload = "auto";
      a.addEventListener("timeupdate", () => {
        setT(a.currentTime);
        onTempoRef.current?.(a.currentTime);
      });
      a.addEventListener("loadedmetadata", () => setTotal(a.duration || duracao || 0));
      a.addEventListener("play", () => setTocando(true));
      a.addEventListener("pause", () => setTocando(false));
      a.addEventListener("ended", () => {
        setTocando(false);
        setT(0);
      });
      audio.current = a;
    }
    window.dispatchEvent(new CustomEvent("pm:pausar-palco"));
    window.dispatchEvent(new CustomEvent("pm:tocando", { detail: faixaId }));
    audio.current.play().catch(() => setErro("Toque de novo para ouvir."));
    if (!contou.current) {
      contou.current = true;
      supabaseNavegador().rpc("registrar_play", { p_faixa: faixaId, p_origem: origem }).then(() => {}, () => {});
    }
  }

  function pular(e: React.MouseEvent<HTMLDivElement>) {
    const a = audio.current;
    if (!a || !total) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(total, ((e.clientX - r.left) / r.width) * total));
  }

  const pct = total ? Math.min(100, (t / total) * 100) : 0;
  return (
    <div className="player" onContextMenu={(e) => e.preventDefault()}>
      <button type="button" className="tocar" onClick={alternar} aria-label={tocando ? `Pausar ${rotulo}` : `Tocar ${rotulo}`}>
        {tocando ? <IcPause /> : <IcPlay style={{ marginLeft: 3 }} />}
      </button>
      <div className="info">
        <b>{rotulo}</b>
        <div className="barra" onClick={pular} role="slider" aria-label="Posição" aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(t)}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="tempo"><span>{fmt(t)}</span><span>{erro ? <span style={{ color: "#fca5a5" }}>{erro}</span> : fmt(total)}</span></div>
      </div>
    </div>
  );
}
