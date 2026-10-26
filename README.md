# Primeira Melodia · V2

**Crie uma música. Emocione quem você ama.** App de música com IA com propósito: 10% da receita de cada música vai para um fundo que financia o projeto ESG vencedor do ano (votação pública entre 3 finalistas).

- **App:** https://primeira-melodia.vercel.app
- **Stack:** Next.js 15 (App Router) no Vercel · Supabase (Postgres com RLS, Auth, Storage, Edge Functions, pg_cron) · Pix automático pelo Mercado Pago (API de Orders) · música pela API do Suno (duas versões por pedido).

## As abas
| Aba | O que faz |
|---|---|
| **Criar** | "Você já tem a letra?" → letra própria ou história para a IA → estilo e voz → 1 crédito. |
| **Minhas** | As músicas da pessoa, com as duas versões (ouvir no app, sem download), letra, karaokê, compartilhar e pedir uso comercial. |
| **Mundo** | Floresta, Oceano, Animais ou Universo. Cada música planta um item; conquistas dão sementes e itens especiais. |
| **Palco** | A boate: uma fila única com todas as músicas públicas, tocando ao vivo e sincronizada para todo mundo, com karaokê. |
| **ESG** | Como funciona, fundo do ano, finalistas com votação (1 voto por pessoa por ano) e envio de projetos para a curadoria. |
| **Lojinha** | Itens do mundo comprados com sementes. Camisetas em breve. |
| **Perfil** | Ecossistema, créditos, convite (link que conta como convidado), avisos, termos, privacidade, direitos 50/50. |

**Administração** (`/admin`, só para `profiles.role = 'admin'`): resumo com gráficos (receita, músicas, cupons, cadastros), pedidos, cupons (100% ou 20%, com limite e validade), moderação do Palco, curadoria ESG, pessoas (créditos de cortesia, acesso de admin) e configurações.

## Como funciona por dentro
- **Banco** (`supabase/migrations`): toda a regra de negócio fica em funções SQL com `security definer` que conferem `auth.uid()`. Tabelas com RLS e permissões por coluna. Funções internas no schema `privado` (fora da API).
- **Pix** (`supabase/functions/pagamentos`): cria a order Pix no Mercado Pago, a tela confere a cada 4 s e um agendador confere a cada minuto. O crédito só é liberado depois de buscar a order no Mercado Pago (`processed/accredited`). Webhook opcional.
- **Música** (`supabase/functions/musica`): fila com trava (`worker_pegar`), provedor `sunoapi` ou `demo` (melodia de teste sintetizada, sem custo). Falhou 3 vezes → o crédito volta.
- **Cadastro** (`supabase/functions/conta`): conta por e-mail e senha já confirmada; login com Google pelo Supabase Auth.
- **Agendador** (`pg_cron`, a cada minuto): mantém 15 min de fila no Palco, aciona a música e confere Pix pendentes.
- **Avisos** para a administração pelo app **ntfy** (tópico em `config.ntfy_topico`).

## Segredos (Supabase → Edge Functions → Secrets)
| Nome | Para quê |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token de produção da conta Mercado Pago que recebe o Pix (APP_USR-…). |
| `MP_WEBHOOK_SECRET` | Opcional: assinatura do webhook (URL: `/functions/v1/pagamentos/webhook`). |
| `SUNO_API_KEY` | Chave da API do Suno. Sem ela o app fica em modo demonstração. |
| `SUNO_API_BASE`, `SUNO_MODEL` | Opcionais (padrão `https://api.sunoapi.org` e `V4_5`). |
| `ANTHROPIC_API_KEY` | Opcional: a IA escreve a letra e aplica a regra "só emocionar". |

Nada disso vai no código. As chaves públicas do Supabase ficam em `lib/config.ts` (podem ir para o navegador).

## Rodar localmente
```bash
npm install
npm run dev
```
