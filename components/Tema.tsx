"use client";

import { IcLua, IcSol } from "@/components/Icones";

/** Botão sol/lua: troca o céu do app (fica gravado no aparelho). */
export default function Tema() {
  function trocar() {
    const html = document.documentElement;
    const novo = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = novo;
    // a barra do navegador acompanha o céu (pêssego de dia, azul-noite de noite)
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", novo === "dark" ? "#0D0B24" : "#F7C2AB");
    document.cookie = `pm-ceu=${novo}; path=/; max-age=31536000; samesite=lax`;
    try {
      localStorage.setItem("pm-ceu", novo);
    } catch {
      /* sem armazenamento: tudo bem */
    }
  }
  return (
    <button type="button" className="tema" onClick={trocar} aria-label="Trocar entre dia e noite">
      <span className="ts"><IcSol /></span>
      <span className="tl"><IcLua /></span>
    </button>
  );
}
