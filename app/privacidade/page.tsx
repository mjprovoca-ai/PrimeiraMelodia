import type { Metadata } from "next";
import Legal from "@/components/Legal";
import { CONTATO } from "@/lib/config";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Privacidade() {
  return (
    <Legal titulo="Política de Privacidade">
      <h2>Dados coletados</h2>
      <p>Coletamos nome, e-mail e foto do perfil (quando você entra com Google), além dos parâmetros das músicas criadas (tema, estilo, letra).</p>
      <h2>Uso dos dados</h2>
      <p>Os dados são utilizados exclusivamente para autenticação, geração das músicas e comunicação sobre pedidos.</p>
      <h2>Compartilhamento</h2>
      <p>Não vendemos nem compartilhamos seus dados pessoais. A geração de áudio é feita por serviços de inteligência artificial apenas com o conteúdo criativo, sem dados pessoais. Os pagamentos são processados pelo Mercado Pago, que recebe o seu e-mail para emitir o Pix.</p>
      <h2>Seus direitos</h2>
      <p>Você pode solicitar a exclusão da sua conta e das suas músicas a qualquer momento, pelo e-mail <a href={`mailto:${CONTATO}`}>{CONTATO}</a>.</p>
    </Legal>
  );
}
