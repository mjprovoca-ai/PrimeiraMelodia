import { CONTATO } from "@/lib/config";

/** Créditos do rodapé, como no app no ar. */
export default function Creditos() {
  return (
    <footer className="creditos">
      <span>Criação e desenvolvimento: <b>Maria João Abujamra</b></span>
      <span>Realização: <b>Maria João Abujamra</b> e <b>Thiago Valadares</b></span>
      <span className="org">© Fundação Web 3</span>
      <a href={`mailto:${CONTATO}`}>Contato: {CONTATO}</a>
    </footer>
  );
}
