import BotaoRpc from "@/components/admin/BotaoRpc";
import { supabaseServidor } from "@/lib/supabase/server";
import { brl, dataCurta } from "@/lib/dados";

type Pessoa = { id: string; nome: string; username: string; email: string; role: string; mundo: string | null; creditos: number; sementes: number; created_at: string; musicas: number; gasto: number };

export default async function AdminUsuarios({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await supabaseServidor();
  const { data } = await sb.rpc("admin_usuarios", { p_busca: sp.q ?? null, p_limite: 100 });
  const pessoas = (data ?? []) as Pessoa[];
  return (
    <>
      <form className="linha-flex" action="/admin/usuarios">
        <input className="campo" name="q" placeholder="Buscar por nome, e-mail ou usuário" defaultValue={sp.q ?? ""} />
        <button className="btn btn-sec btn-p">Buscar</button>
      </form>
      <div className="tabela-wrap mt16">
        <table className="tabela">
          <thead><tr><th>Pessoa</th><th>Mundo</th><th>Créditos</th><th>Músicas</th><th>Gasto</th><th>Desde</th><th /></tr></thead>
          <tbody>
            {pessoas.map((p) => (
              <tr key={p.id}>
                <td><b>{p.nome}</b>{p.role === "admin" ? <span className="etiqueta obras" style={{ marginLeft: 6 }}>admin</span> : null}<br /><span className="pequeno">{p.email} · @{p.username}</span></td>
                <td>{p.mundo ?? "—"}</td>
                <td>{p.creditos}<br /><span className="pequeno">{p.sementes} sementes</span></td>
                <td>{p.musicas}</td>
                <td>{brl(p.gasto)}</td>
                <td className="pequeno">{dataCurta(p.created_at)}</td>
                <td>
                  <span className="linha-flex" style={{ gap: 6, flexWrap: "wrap" }}>
                    <BotaoRpc fn="admin_creditos" args={{ p_user: p.id, p_qtd: 1, p_motivo: "cortesia" }} rotulo="+1 crédito" />
                    <BotaoRpc fn="admin_role" args={{ p_user: p.id, p_role: p.role === "admin" ? "user" : "admin" }} rotulo={p.role === "admin" ? "Tirar admin" : "Tornar admin"}
                      confirmar={p.role === "admin" ? `Tirar o acesso de administração de ${p.nome}?` : `Dar acesso total de administração para ${p.nome}?`} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
