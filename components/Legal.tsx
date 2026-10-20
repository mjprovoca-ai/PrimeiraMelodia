import Link from "next/link";
import Creditos from "@/components/Creditos";
import { IcVoltar } from "@/components/Icones";

export default function Legal({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="legal">
      <div className="in">
        <header>
          <Link href="/perfil" aria-label="Voltar"><IcVoltar style={{ width: 26, height: 26 }} /></Link>
          <h1>{titulo}</h1>
          <span />
        </header>
        {children}
        <Creditos />
      </div>
    </main>
  );
}
