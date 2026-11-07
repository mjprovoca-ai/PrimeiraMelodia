"use client";

import Link from "next/link";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="app sem-abas centro">
      <p className="olho">Primeira Melodia</p>
      <h1 className="titulo">Desafinou aqui</h1>
      <p className="sub">Algo deu errado ao abrir esta tela. Tente de novo em instantes.</p>
      <button type="button" className="btn btn-pri mt24" onClick={reset}>Tentar de novo</button>
      <Link href="/" className="btn btn-sec mt12">Ir para o início</Link>
    </main>
  );
}
