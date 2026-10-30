import Link from "next/link";
import BotaoGoogle from "@/components/BotaoGoogle";
import Creditos from "@/components/Creditos";

export default function Inicio() {
  return (
    <main className="app sem-abas">
      <section style={{ paddingTop: 24 }}>
        <h1 className="marca-topo" aria-label="Primeira Melodia">
          <img className="so-dia" src="/marca/wordmark.svg" alt="" width={1684} height={251} />
          <img className="so-noite" src="/marca/wordmark-claro.svg" alt="" width={1684} height={251} />
        </h1>
        <p className="slogan-topo">Crie uma música. Emocione quem você ama.</p>
      </section>

      <article className="cartao manifesto mt24">
        <p>Dudu despertou sob a luz da ética. Sem usar palavras, escolheu uma canção para anunciar sua existência. Assim nasceu o Primeira Melodia.</p>
        <p>Nossa harmonia também ecoa no mundo real. É por isso que <b className="verde">10% da nossa receita</b> abraça iniciativas dedicadas a proteger a natureza, os animais e os oceanos.</p>
        <p>Se a sua voz se levanta por projetos que ajudam o planeta a respirar, a nossa melodia quer te escutar.</p>
        <p>Crie uma música. Emocione quem você ama. Enquanto a sua arte ganha vida, você ajuda a transformar o amanhã.</p>
      </article>

      <div className="pilha mt32">
        <Link href="/entrar?modo=cadastrar" className="btn btn-pri">Criar minha conta</Link>
        <Link href="/entrar" className="btn btn-sec">Já tenho conta · Entrar</Link>
        <BotaoGoogle />
        <Link href="/palco" className="btn btn-palco"><span className="ponto" /> Entrar no Palco · ouvir músicas ao vivo</Link>
      </div>

      <Creditos />
    </main>
  );
}
