import type { Metadata } from "next";
import Legal from "@/components/Legal";

export const metadata: Metadata = { title: "Direitos autorais" };

export default function Direitos() {
  return (
    <Legal titulo="Direitos Autorais">
      <div className="cartao forte centro" style={{ padding: "28px 20px" }}>
        <p className="grande-num">50/50</p>
        <p className="sub">Divisão justa entre criador e plataforma</p>
      </div>
      <h2>Divisão</h2>
      <ul>
        <li>50% para o criador da obra (você, quem forneceu o tema ou a emoção).</li>
        <li>50% para a plataforma Primeira Melodia.</li>
      </ul>
      <h2>Uso comercial</h2>
      <p>É permitido o uso comercial das músicas geradas, respeitando a divisão acima. Para publicidade, marcas ou mídia, fale com a plataforma antes de usar (há um botão para isso em cada música).</p>
      <h2>Exclusividade</h2>
      <p>A plataforma não garante exclusividade das músicas. Melodias com temas semelhantes podem ser criadas para outros usuários.</p>
      <h2>Regeneração e DAO</h2>
      <p>10% da receita é destinado a causas ambientais. A arquitetura está preparada para, no futuro, integrar contratos inteligentes e uma DAO onde comunidades musicais poderão votar no destino dos fundos.</p>
    </Legal>
  );
}
