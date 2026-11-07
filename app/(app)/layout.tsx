import TabBar from "@/components/TabBar";
import Creditos from "@/components/Creditos";
import { configPublica, meuPerfil } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [perfil, cfg] = await Promise.all([meuPerfil(), configPublica()]);
  const aviso = typeof cfg.aviso === "string" ? cfg.aviso : "";
  return (
    <>
      <main className="app">
        {cfg.modo_teste === true ? (
          <p className="aviso-teste">Ambiente de testes da V2: as músicas ainda são melodias de demonstração e o Pix está sendo ativado.</p>
        ) : null}
        {aviso ? <p className="aviso-teste">{aviso}</p> : null}
        {children}
        <Creditos />
      </main>
      <TabBar naoLidas={perfil?.nao_lidas ?? 0} />
    </>
  );
}
