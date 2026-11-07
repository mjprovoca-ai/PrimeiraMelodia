"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcAba } from "@/components/Icones";

const ABAS = [
  { href: "/criar", nome: "criar", rotulo: "Criar" },
  { href: "/minhas", nome: "minhas", rotulo: "Minhas" },
  { href: "/mundo", nome: "mundo", rotulo: "Mundo" },
  { href: "/palco", nome: "palco", rotulo: "Palco" },
  { href: "/esg", nome: "esg", rotulo: "ESG" },
  { href: "/lojinha", nome: "lojinha", rotulo: "Lojinha" },
  { href: "/perfil", nome: "perfil", rotulo: "Perfil" },
];

export default function TabBar({ naoLidas = 0 }: { naoLidas?: number }) {
  const caminho = usePathname() || "";
  return (
    <nav className="abas" aria-label="Abas do app">
      {ABAS.map((a) => {
        const ativa = caminho === a.href || caminho.startsWith(a.href + "/") ||
          (a.href === "/criar" && (caminho.startsWith("/comprar") || caminho.startsWith("/pedido")));
        return (
          <Link key={a.href} href={a.href} aria-current={ativa ? "page" : undefined} prefetch={false}>
            <IcAba nome={a.nome} />
            {a.rotulo}
            {a.nome === "perfil" && naoLidas > 0 ? <i className="bolinha" aria-label={`${naoLidas} avisos novos`} /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
