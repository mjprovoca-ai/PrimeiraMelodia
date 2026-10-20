import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <main className="app sem-abas centro">
      <p className="olho">Primeira Melodia</p>
      <h1 className="titulo">Essa página não existe</h1>
      <p className="sub">Talvez o link tenha mudado. Bora voltar para a música?</p>
      <Link href="/" className="btn btn-pri mt24">Ir para o início</Link>
    </main>
  );
}
