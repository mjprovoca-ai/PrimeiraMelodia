import type { Metadata } from "next";
import Legal from "@/components/Legal";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Termos() {
  return (
    <Legal titulo="Termos de Uso">
      <h2>1. Uso do serviço</h2>
      <p>O serviço permite a criação de músicas com auxílio de inteligência artificial. Você é responsável pelo conteúdo enviado (temas, letras, referências) e declara não violar direitos de terceiros.</p>
      <h2>2. Conteúdo ético</h2>
      <p>O sistema não gera conteúdo ofensivo, discriminatório ou nocivo. Apenas músicas emocionantes e conscientizadoras: histórias de superação são bem-vindas; histórias tristes, não.</p>
      <h2>3. Regeneração ambiental</h2>
      <p>10% da receita das músicas geradas é destinado a projetos que cuidam da natureza, dos animais e dos oceanos, escolhidos em votação anual.</p>
      <h2>4. Pagamento</h2>
      <p>Os pagamentos por Pix são processados pelo Mercado Pago e confirmados automaticamente. Os créditos são liberados assim que o Pix é aprovado. Se a criação de uma música falhar, o crédito volta para a sua conta.</p>
      <h2>5. Cupons</h2>
      <p>Cupons promocionais podem liberar a criação de faixas gratuitamente ou com desconto, respeitando os limites de uso.</p>
      <h2>6. Uso comercial</h2>
      <p>O uso comercial das músicas é permitido, respeitando a divisão de direitos autorais (50/50). Para publicidade, marcas ou mídia, avise e combine antes com a plataforma.</p>
      <h2>7. Palco e compartilhamento</h2>
      <p>Músicas públicas podem tocar no Palco e ser ouvidas por qualquer pessoa no app. A curadoria pode retirar do Palco músicas que não sigam estes termos. As músicas ficam no app para ouvir e compartilhar; não há download.</p>
    </Legal>
  );
}
