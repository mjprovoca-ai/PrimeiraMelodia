"use client";

import Link from "next/link";
import { usePalco } from "@/components/PalcoProvider";
import Karaoke from "@/components/Karaoke";
import { IcAnterior, IcPause, IcPlay, IcProxima, IcVoltar } from "@/components/Icones";

export default function PalcoTela({ logado }: { logado: boolean }) {
  const p = usePalco();
  if (!p) return null;
  const fila = p.estado?.fila ?? [];
  const atual = p.item;
  const idxAtual = atual ? fila.findIndex((x) => x.id === atual.id) : -1;
  const mostrar = idxAtual > 0 ? fila.slice(idxAtual) : fila;

  return (
    <section>
      <Link href={logado ? "/criar" : "/"} className="voltar"><IcVoltar /> Voltar</Link>
      <div className="centro mt16">
        <p className="olho" style={{ letterSpacing: ".3em" }}>O Palco</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 2 }}>Boate Primeira Melodia</h1>
      </div>

      <div className="chips mt16" style={{ justifyContent: "center" }}>
        <span className="etiqueta vivo"><i /> {p.estado?.criando_agora ?? 0} criando agora</span>
        <span className="etiqueta verde-e">♪ {p.estado?.no_palco ?? 0} músicas no palco</span>
      </div>

      <div className={`disco${p.tocando ? " gira" : ""}`}>
        <span className="rotulo"><img src="/marca/simbolo-tinta.svg" alt="" /></span>
      </div>

      <p className="tocando">{p.tocando ? (p.aoVivo ? "♪ Tocando ao vivo" : "♪ Tocando") : "♪ No palco agora"}</p>
      <h2 className="faixa-titulo">{atual?.titulo ?? (fila.length ? "Toque para entrar na boate" : "O palco está esperando a primeira música")}</h2>
      {atual ? <p className="faixa-por">por {atual.autor}{atual.para_quem ? ` · para ${atual.para_quem}` : ""}</p> : null}

      <div className="controles">
        <button type="button" onClick={p.anterior} aria-label="Música anterior" disabled={!fila.length}><IcAnterior /></button>
        <button type="button" className="grande" onClick={p.alternar} aria-label={p.tocando ? "Pausar" : "Tocar ao vivo"} disabled={!fila.length && !p.tocando}>
          {p.tocando ? <IcPause /> : <IcPlay style={{ marginLeft: 4 }} />}
        </button>
        <button type="button" onClick={p.proxima} aria-label="Próxima música" disabled={!fila.length}><IcProxima /></button>
      </div>
      {!p.aoVivo ? (
        <p className="centro mt12"><button type="button" className="btn btn-palco btn-p" onClick={p.voltarAoVivo}><span className="ponto" /> Voltar ao vivo</button></p>
      ) : null}
      {p.erro ? <p className="erro-msg mt12 centro">{p.erro}</p> : null}

      {p.tocando ? <Karaoke linhas={p.karaoke} tempo={p.tempo} letra={p.letra} /> : null}

      <h2 className="rotulo-secao">Na fila de hoje</h2>
      {mostrar.length === 0 ? (
        <div className="cartao centro">
          <p className="sub" style={{ marginTop: 0 }}>Ainda não tem música no palco. A primeira pode ser a sua!</p>
          <Link href={logado ? "/criar" : "/entrar?modo=cadastrar"} className="btn btn-pri mt16">Criar uma música</Link>
        </div>
      ) : (
        <ol className="lista fila">
          {mostrar.map((it, i) => (
            <li key={it.id} className={atual && it.id === atual.id ? "agora" : undefined}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="m"><b>{it.titulo}</b><span>por {it.autor}</span></span>
            </li>
          ))}
        </ol>
      )}
      {!logado && mostrar.length ? (
        <div className="pilha mt24">
          <Link href="/entrar?modo=cadastrar" className="btn btn-pri">Criar minha música</Link>
        </div>
      ) : null}
    </section>
  );
}
