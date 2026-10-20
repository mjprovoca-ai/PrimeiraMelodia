"use client";

// O Palco: uma fila única com todas as músicas, tocando ao vivo para todo mundo no mesmo ponto.
// Quem pula de música sai do "ao vivo" e pode voltar com um toque.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabaseNavegador } from "@/lib/supabase/client";

export type ItemPalco = {
  id: number;
  criacao_id: string;
  faixa_id: string;
  titulo: string;
  autor: string;
  username: string;
  inicio: string;
  fim: string;
  duracao: number;
  storage_path: string;
  versao: number;
  estilo: string;
  mundo: string;
  para_quem: string | null;
};
export type LinhaKaraoke = { t: number; f: number; l: string };
type Estado = {
  agora: string;
  fila: ItemPalco[];
  atual: { criacao_id: string; letra: string | null; karaoke: LinhaKaraoke[] | null } | null;
  criando_agora: number;
  no_palco: number;
};

type Ctx = {
  estado: Estado | null;
  tocando: boolean;
  carregando: boolean;
  aoVivo: boolean;
  item: ItemPalco | null;
  tempo: number;
  karaoke: LinhaKaraoke[] | null;
  letra: string | null;
  erro: string | null;
  alternar: () => void;
  proxima: () => void;
  anterior: () => void;
  voltarAoVivo: () => void;
  pausar: () => void;
};

const PalcoCtx = createContext<Ctx | null>(null);
const SILENCIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
export const usePalco = () => useContext(PalcoCtx);

export default function PalcoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [aoVivo, setAoVivo] = useState(true);
  const [indice, setIndice] = useState(0);
  const [tempo, setTempo] = useState(0);
  const [letras, setLetras] = useState<Record<string, { letra: string | null; karaoke: LinhaKaraoke[] | null }>>({});
  const [erro, setErro] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const desvio = useRef(0);
  const urls = useRef<Record<string, { url: string; ate: number }>>({});
  const tocandoRef = useRef(false);
  const aoVivoRef = useRef(true);
  const atualId = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aoTerminarRef = useRef<() => void>(() => {});

  const agora = () => Date.now() + desvio.current;

  const carregar = useCallback(async () => {
    const sb = supabaseNavegador();
    const t0 = Date.now();
    const { data, error } = await sb.rpc("palco_estado");
    if (error || !data) return null;
    const e = data as Estado;
    desvio.current = new Date(e.agora).getTime() - (t0 + (Date.now() - t0) / 2);
    setEstado(e);
    if (e.atual) setLetras((l) => ({ ...l, [e.atual!.criacao_id]: { letra: e.atual!.letra, karaoke: e.atual!.karaoke } }));
    return e;
  }, []);

  useEffect(() => {
    carregar();
    const t = setInterval(() => {
      if (!tocandoRef.current) carregar();
    }, 30000);
    return () => clearInterval(t);
  }, [carregar]);

  const urlAssinada = useCallback(async (caminho: string) => {
    const c = urls.current[caminho];
    if (c && c.ate > Date.now() + 60000) return c.url;
    const { data, error } = await supabaseNavegador().storage.from("faixas").createSignedUrl(caminho, 3600);
    if (error || !data) throw new Error("Não foi possível abrir essa música.");
    urls.current[caminho] = { url: data.signedUrl, ate: Date.now() + 3600_000 };
    return data.signedUrl;
  }, []);

  const buscarLetra = useCallback(async (criacao: string) => {
    if (letras[criacao]) return;
    const { data } = await supabaseNavegador().from("criacoes").select("letra, karaoke").eq("id", criacao).maybeSingle();
    if (data) setLetras((l) => ({ ...l, [criacao]: data as { letra: string | null; karaoke: LinhaKaraoke[] | null } }));
  }, [letras]);

  // iPhone só deixa tocar som se o play() começar no toque; um silêncio curto "destrava" o player
  const desbloqueado = useRef(false);
  const desbloquear = () => {
    const a = garantirAudio();
    if (desbloqueado.current) return;
    desbloqueado.current = true;
    try {
      a.src = SILENCIO;
      a.play().catch(() => {});
    } catch {
      /* segue */
    }
  };

  const garantirAudio = () => {
    if (!audio.current) {
      const a = new Audio();
      a.preload = "auto";
      a.setAttribute("controlsList", "nodownload");
      const silencio = () => a.src.startsWith("data:");
      a.addEventListener("timeupdate", () => {
        if (!silencio()) setTempo(a.currentTime);
      });
      a.addEventListener("ended", () => {
        if (!silencio()) aoTerminarRef.current();
      });
      a.addEventListener("pause", () => {
        if (!a.ended && !silencio()) {
          tocandoRef.current = false;
          setTocando(false);
        }
      });
      a.addEventListener("play", () => {
        if (silencio()) return;
        tocandoRef.current = true;
        setTocando(true);
      });
      audio.current = a;
    }
    return audio.current;
  };

  const tocarItem = useCallback(async (it: ItemPalco, deslocamento: number) => {
    const a = garantirAudio();
    setCarregando(true);
    setErro(null);
    try {
      const url = await urlAssinada(it.storage_path);
      atualId.current = it.id;
      if (a.src !== url) a.src = url;
      const ir = () => {
        try {
          a.currentTime = Math.max(0, Math.min(deslocamento, (it.duracao || 9999) - 0.5));
        } catch {
          /* metadados ainda não carregados */
        }
      };
      if (a.readyState >= 1) ir();
      else a.addEventListener("loadedmetadata", ir, { once: true });
      await a.play();
      buscarLetra(it.criacao_id);
      supabaseNavegador().rpc("registrar_play", { p_faixa: it.faixa_id, p_origem: "palco" }).then(() => {}, () => {});
    } catch (e) {
      const msg = (e as Error)?.message || "";
      if (!/interact|gesture|NotAllowed/i.test(msg)) setErro("Não foi possível tocar agora.");
      tocandoRef.current = false;
      setTocando(false);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlAssinada, buscarLetra]);

  const tocarAoVivo = useCallback(async () => {
    const e = (await carregar()) ?? estado;
    if (!e || !e.fila.length) {
      setErro("O Palco está esperando a primeira música.");
      return;
    }
    const t = agora();
    const atual = e.fila.find((i) => new Date(i.inicio).getTime() <= t && new Date(i.fim).getTime() > t);
    if (atual) {
      await tocarItem(atual, (t - new Date(atual.inicio).getTime()) / 1000);
      return;
    }
    const prox = e.fila.find((i) => new Date(i.inicio).getTime() > t);
    if (prox) {
      const espera = Math.max(0, new Date(prox.inicio).getTime() - t);
      tocandoRef.current = true;
      setTocando(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => tocarItem(prox, 0), espera);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar, estado, tocarItem]);

  const aoTerminar = useCallback(() => {
    if (aoVivoRef.current) {
      tocarAoVivo();
      return;
    }
    const fila = estado?.fila ?? [];
    const i = fila.findIndex((x) => x.id === atualId.current);
    if (i >= 0 && fila[i + 1]) {
      setIndice(i + 1);
      tocarItem(fila[i + 1], 0);
    } else {
      aoVivoRef.current = true;
      setAoVivo(true);
      tocarAoVivo();
    }
  }, [estado, tocarAoVivo, tocarItem]);

  // o listener "ended" é criado uma vez; ele sempre chama a versão atual desta função
  aoTerminarRef.current = aoTerminar;

  const pausar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    audio.current?.pause();
    tocandoRef.current = false;
    setTocando(false);
  }, []);

  const alternar = useCallback(() => {
    if (tocandoRef.current) {
      pausar();
      return;
    }
    desbloquear();
    if (aoVivoRef.current) tocarAoVivo();
    else {
      const it = estado?.fila[indice];
      if (it) tocarItem(it, audio.current?.currentTime ?? 0);
    }
  }, [pausar, tocarAoVivo, estado, indice, tocarItem]);

  const posicaoAtual = () => {
    const fila = estado?.fila ?? [];
    const i = fila.findIndex((x) => x.id === atualId.current);
    return i >= 0 ? i : 0;
  };

  const proxima = useCallback(() => {
    const fila = estado?.fila ?? [];
    const n = Math.min(posicaoAtual() + 1, fila.length - 1);
    if (n < 0 || !fila[n]) return;
    desbloquear();
    aoVivoRef.current = false;
    setAoVivo(false);
    setIndice(n);
    tocarItem(fila[n], 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, tocarItem]);

  const anterior = useCallback(() => {
    const fila = estado?.fila ?? [];
    const n = Math.max(posicaoAtual() - 1, 0);
    if (!fila[n]) return;
    desbloquear();
    aoVivoRef.current = false;
    setAoVivo(false);
    setIndice(n);
    tocarItem(fila[n], 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, tocarItem]);

  const voltarAoVivo = useCallback(() => {
    desbloquear();
    aoVivoRef.current = true;
    setAoVivo(true);
    tocarAoVivo();
  }, [tocarAoVivo]);

  // outros players (Minhas músicas) pedem para o palco pausar
  useEffect(() => {
    const f = () => pausar();
    window.addEventListener("pm:pausar-palco", f);
    return () => window.removeEventListener("pm:pausar-palco", f);
  }, [pausar]);

  const item = useMemo(() => {
    const fila = estado?.fila ?? [];
    return fila.find((x) => x.id === atualId.current) ?? (tocando ? null : fila.find((i) => new Date(i.fim).getTime() > agora()) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, tocando, tempo]);

  const info = item ? letras[item.criacao_id] : undefined;

  const valor: Ctx = {
    estado, tocando, carregando, aoVivo, item, tempo,
    karaoke: info?.karaoke ?? null, letra: info?.letra ?? null, erro,
    alternar, proxima, anterior, voltarAoVivo, pausar,
  };
  return <PalcoCtx.Provider value={valor}>{children}</PalcoCtx.Provider>;
}
