import Link from "next/link";
import BotaoGoogle from "@/components/BotaoGoogle";
import Creditos from "@/components/Creditos";

export default function Inicio() {
  return (
    <main className="app sem-abas">
      <section style={{ paddingTop: 24 }}>
        <span className="logo-tile"><img src="/marca/simbolo.svg" alt="" width={92} height={63} /></span>
        <h1 className="titulo-xl">Primeira<br />Melodia</h1>
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
        <Link href="/palco" className="btn btn-palco"><span className="ponto" /> 🎵 Entrar no Palco · ouvir músicas ao vivo</Link>
        <Link href="/entrar?admin=1" className="link centro" style={{ alignSelf: "center" }}>Sou administrador</Link>
      </div>

      <Creditos />
    </main>
  );
}
