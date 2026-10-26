"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", t: "Resumo" },
  { href: "/admin/pedidos", t: "Pedidos" },
  { href: "/admin/cupons", t: "Cupons" },
  { href: "/admin/musicas", t: "Músicas e Palco" },
  { href: "/admin/esg", t: "ESG" },
  { href: "/admin/usuarios", t: "Pessoas" },
  { href: "/admin/config", t: "Configurações" },
];

export default function AdminNav() {
  const c = usePathname();
  return (
    <nav className="admin-nav" aria-label="Seções da administração">
      {ITENS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={c === i.href ? "page" : undefined}>{i.t}</Link>
      ))}
    </nav>
  );
}
