-- Primeira Melodia V2 · esquema base
-- Tabelas do app: perfis, pacotes, cupons, pedidos (Pix Mercado Pago), criações e faixas,
-- mundo (itens, metas, sementes), palco (fila ao vivo), ESG (projetos e votos), notificações.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create extension if not exists unaccent with schema extensions;

-- schema interno: não é exposto pela API
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create type public.mundo as enum ('floresta', 'oceano', 'animais', 'universo');
create type public.status_pedido as enum ('pendente', 'pago', 'expirado', 'cancelado');
create type public.metodo_pag as enum ('pix', 'cupom', 'bitcoin', 'manual');
create type public.status_criacao as enum ('na_fila', 'gerando', 'pronta', 'erro', 'recusada');
create type public.status_publico as enum ('privada', 'em_analise', 'publica', 'removida');
create type public.status_esg as enum ('em_curadoria', 'finalista', 'vencedor', 'arquivado', 'recusado');

create table privado.segredos (
  chave text primary key,
  valor text not null
);

create table privado.cadastros (
  id bigserial primary key,
  ip text,
  created_at timestamptz not null default now()
);

create table public.config (
  chave text primary key,
  valor jsonb not null,
  publico boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  username text unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  mundo public.mundo,
  creditos int not null default 0 check (creditos >= 0),
  sementes int not null default 0 check (sementes >= 0),
  convite_codigo text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  convidado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.profiles (convidado_por);

create table public.pacotes (
  id serial primary key,
  nome text not null,
  creditos int not null check (creditos > 0),
  preco_centavos int not null check (preco_centavos >= 0),
  destaque boolean not null default false,
  ativo boolean not null default true,
  ordem int not null default 0
);

create table public.cupons (
  codigo text primary key check (codigo = upper(codigo) and length(codigo) between 3 and 30),
  percentual int not null check (percentual between 1 and 100),
  usos_max int check (usos_max is null or usos_max > 0),
  usos int not null default 0,
  um_por_pessoa boolean not null default true,
  valido_ate timestamptz,
  ativo boolean not null default true,
  descricao text,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pacote_id int references public.pacotes (id),
  creditos int not null,
  valor_bruto int not null,
  desconto int not null default 0,
  valor_final int not null,
  cupom text references public.cupons (codigo) on update cascade on delete set null,
  metodo public.metodo_pag not null default 'pix',
  status public.status_pedido not null default 'pendente',
  mp_order_id text unique,
  mp_ref text,
  pix_copia_cola text,
  pix_qr_base64 text,
  pix_ticket_url text,
  expira_em timestamptz,
  pago_em timestamptz,
  fundo_centavos int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.pedidos (user_id, created_at desc);
create index on public.pedidos (status, created_at);
create index on public.pedidos (cupom);
create index on public.pedidos (pacote_id);

create table public.cupom_usos (
  id bigserial primary key,
  cupom text not null references public.cupons (codigo) on update cascade on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  pedido_id uuid references public.pedidos (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.cupom_usos (cupom, user_id);
create index on public.cupom_usos (user_id);
create index on public.cupom_usos (pedido_id);

create table public.criacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null,
  para_quem text,
  historia text,
  tem_letra boolean not null default false,
  letra text,
  estilo text not null default 'pop',
  voz text not null default 'feminina' check (voz in ('feminina', 'masculina')),
  mundo public.mundo,
  status public.status_criacao not null default 'na_fila',
  publico public.status_publico not null default 'publica',
  motivo_recusa text,
  provedor text,
  tarefa_id text,
  tentativas int not null default 0,
  travado_ate timestamptz,
  checado_em timestamptz,
  erro text,
  karaoke jsonb,
  created_at timestamptz not null default now(),
  pronta_em timestamptz
);
create index on public.criacoes (user_id, created_at desc);
create index on public.criacoes (status, created_at);
create index on public.criacoes (publico, pronta_em desc);
create index on public.criacoes (tarefa_id);

create table public.creditos_extrato (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  motivo text not null,
  pedido_id uuid references public.pedidos (id) on delete set null,
  criacao_id uuid references public.criacoes (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.creditos_extrato (user_id, created_at desc);
create index on public.creditos_extrato (pedido_id);
create index on public.creditos_extrato (criacao_id);

create table public.faixas (
  id uuid primary key default gen_random_uuid(),
  criacao_id uuid not null references public.criacoes (id) on delete cascade,
  versao int not null check (versao in (1, 2)),
  storage_path text not null unique,
  duracao_s numeric(8, 2) not null default 0,
  formato text not null default 'mp3',
  created_at timestamptz not null default now(),
  unique (criacao_id, versao)
);

create table public.plays (
  id bigserial primary key,
  faixa_id uuid not null references public.faixas (id) on delete cascade,
  criacao_id uuid not null references public.criacoes (id) on delete cascade,
  dono_id uuid not null references public.profiles (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  origem text not null default 'app',
  created_at timestamptz not null default now()
);
create index on public.plays (dono_id);
create index on public.plays (faixa_id, created_at desc);
create index on public.plays (user_id, faixa_id, created_at desc);
create index on public.plays (criacao_id);

create table public.compartilhamentos (
  id bigserial primary key,
  criacao_id uuid not null references public.criacoes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  canal text not null default 'link',
  created_at timestamptz not null default now()
);
create index on public.compartilhamentos (user_id, created_at desc);
create index on public.compartilhamentos (criacao_id);

create table public.catalogo_itens (
  id text primary key,
  mundo public.mundo not null,
  nome text not null,
  arte text not null,
  zona text not null check (zona in ('chao', 'ar', 'agua', 'fundo', 'ceu')),
  largura numeric(5, 3) not null default 0.1,
  comum boolean not null default false,
  especial int check (especial in (1, 2)),
  boas_vindas boolean not null default false,
  preco_sementes int check (preco_sementes is null or preco_sementes > 0),
  descricao text,
  ordem int not null default 0
);

create table public.itens_mundo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.catalogo_itens (id),
  mundo public.mundo not null,
  criacao_id uuid references public.criacoes (id) on delete set null,
  origem text not null check (origem in ('musica', 'meta', 'loja', 'boas-vindas', 'admin')),
  x real not null,
  y real not null,
  created_at timestamptz not null default now()
);
create index on public.itens_mundo (user_id, mundo);
create index on public.itens_mundo (item_id);
create index on public.itens_mundo (criacao_id);

create table public.metas (
  id text primary key,
  tipo text not null check (tipo in ('musicas', 'plays', 'compartilhamentos', 'convites')),
  limiar int not null,
  sementes int not null default 0,
  especial int check (especial in (1, 2)),
  titulo text not null,
  descricao text not null,
  ordem int not null default 0
);

create table public.metas_atingidas (
  user_id uuid not null references public.profiles (id) on delete cascade,
  meta_id text not null references public.metas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meta_id)
);
create index on public.metas_atingidas (meta_id);

create table public.sementes_extrato (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta int not null,
  motivo text not null,
  ref text,
  created_at timestamptz not null default now()
);
create index on public.sementes_extrato (user_id, created_at desc);

create table public.palco_fila (
  id bigserial primary key,
  criacao_id uuid not null references public.criacoes (id) on delete cascade,
  faixa_id uuid not null references public.faixas (id) on delete cascade,
  inicio timestamptz not null,
  fim timestamptz not null,
  reprise boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.palco_fila (inicio);
create index on public.palco_fila (fim);
create index on public.palco_fila (criacao_id);
create index on public.palco_fila (faixa_id);

create table public.esg_projetos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  titulo text not null check (length(titulo) between 3 and 120),
  descricao text not null check (length(descricao) between 20 and 3000),
  causa text not null check (causa in ('planeta', 'oceano', 'floresta')),
  link text,
  status public.status_esg not null default 'em_curadoria',
  ano int not null default extract(year from now())::int,
  votos int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.esg_projetos (status, ano);
create index on public.esg_projetos (user_id);

create table public.esg_votos (
  projeto_id uuid not null references public.esg_projetos (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  ano int not null,
  created_at timestamptz not null default now(),
  primary key (user_id, ano)
);
create index on public.esg_votos (projeto_id);

create table public.notificacoes (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null,
  corpo text,
  link text,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notificacoes (user_id, created_at desc);

create table public.pedidos_licenca (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  criacao_id uuid references public.criacoes (id) on delete set null,
  tipo text not null,
  descricao text not null,
  contato text,
  status text not null default 'aberto' check (status in ('aberto', 'em_conversa', 'fechado')),
  created_at timestamptz not null default now()
);
create index on public.pedidos_licenca (user_id);
create index on public.pedidos_licenca (criacao_id);
