-- Primeira Melodia V2 · funções
-- Regras de negócio no banco: quem pode o quê, crédito, cupom, Pix, criação, mundo, metas, palco, ESG.
-- Funções internas ficam no schema "privado" (fora da API). As públicas checam auth.uid() ou são só do service_role.

-- ------------------------------------------------------------ utilidades
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function privado.cfg(p_chave text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select c.valor from public.config c where c.chave = p_chave
$$;

create or replace function privado.brl(p_centavos int) returns text
language sql immutable set search_path = '' as $$
  select 'R$ ' || replace(to_char(coalesce(p_centavos, 0) / 100.0, 'FM999999990.00'), '.', ',')
$$;

create or replace function privado.codigo(p_prefixo text, p_n int default 6) returns text
language plpgsql volatile set search_path = '' as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  r text := '';
  i int;
begin
  for i in 1..p_n loop
    r := r || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
  end loop;
  return p_prefixo || r;
end $$;

-- aviso no celular da administração (app ntfy). Nunca quebra o fluxo.
create or replace function privado.notificar_admin(p_titulo text, p_msg text, p_link text default null, p_tags text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_topico text := privado.cfg('ntfy_topico') #>> '{}';
begin
  if v_topico is null or v_topico = '' then
    return;
  end if;
  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_strip_nulls(jsonb_build_object(
      'topic', v_topico, 'title', p_titulo, 'message', p_msg, 'click', p_link,
      'tags', case when p_tags is null then null else to_jsonb(string_to_array(p_tags, ',')) end)),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 4000
  );
exception when others then
  null;
end $$;

create or replace function privado.notificar(p_user uuid, p_titulo text, p_corpo text, p_link text default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notificacoes (user_id, titulo, corpo, link) values (p_user, p_titulo, p_corpo, p_link);
$$;

-- chama a função de música (Edge Function) sem esperar resposta
create or replace function privado.acionar(p_rota text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_url text := (select s.valor from privado.segredos s where s.chave = 'functions_url');
  v_seg text := (select s.valor from privado.segredos s where s.chave = 'cron');
begin
  if v_url is null then
    return;
  end if;
  perform net.http_post(
    url := v_url || p_rota,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_seg),
    timeout_milliseconds := 3000
  );
exception when others then
  null;
end $$;

-- a Edge Function confere o segredo do agendador
create or replace function public.cron_confere(p_segredo text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from privado.segredos s where s.chave = 'cron' and s.valor = p_segredo)
$$;

-- ------------------------------------------------------------ novo usuário
create or replace function privado.novo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_nome text;
  v_base text;
  v_admin boolean;
  v_convidador uuid;
begin
  v_nome := coalesce(nullif(trim(v_meta ->> 'nome'), ''), nullif(trim(v_meta ->> 'full_name'), ''),
                     nullif(trim(v_meta ->> 'name'), ''), split_part(coalesce(new.email, 'artista'), '@', 1));
  v_base := lower(regexp_replace(extensions.unaccent(split_part(v_nome, ' ', 1)), '[^a-zA-Z0-9]', '', 'g'));
  if coalesce(v_base, '') = '' then
    v_base := 'artista';
  end if;
  v_admin := coalesce(privado.cfg('admin_emails') ? lower(coalesce(new.email, '')), false);
  select p.id into v_convidador from public.profiles p
   where p.convite_codigo = upper(nullif(trim(v_meta ->> 'convite'), ''));

  insert into public.profiles (id, nome, username, avatar_url, role, convidado_por)
  values (new.id, left(v_nome, 60), left(v_base, 20) || substr(md5(new.id::text), 1, 4),
          coalesce(v_meta ->> 'avatar_url', v_meta ->> 'picture'),
          case when v_admin then 'admin' else 'user' end, v_convidador)
  on conflict (id) do nothing;

  if v_convidador is not null then
    perform privado.checar_metas(v_convidador);
  end if;
  return new;
end $$;

-- ------------------------------------------------------------ mundo: posição e plantio
create or replace function privado.posicao(p_user uuid, p_mundo public.mundo, p_zona text, out x real, out y real)
language plpgsql volatile security definer set search_path = '' as $$
declare
  y0 real;
  y1 real;
  cx real;
  cy real;
  d real;
  melhor real := -1;
  i int;
begin
  case p_zona
    when 'chao' then y0 := .80; y1 := .97;
    when 'ar' then y0 := .50; y1 := .74;
    when 'agua' then y0 := .32; y1 := .80;
    when 'fundo' then y0 := .905; y1 := .965;
    else y0 := .08; y1 := .62;
  end case;
  for i in 1..12 loop
    cx := .07 + random() * .86;
    cy := y0 + random() * (y1 - y0);
    select coalesce(min(sqrt(power(im.x - cx, 2) + power((im.y - cy) * 1.6, 2))), 1) into d
      from public.itens_mundo im where im.user_id = p_user and im.mundo = p_mundo;
    if d > melhor then
      melhor := d;
      x := cx;
      y := cy;
    end if;
  end loop;
end $$;

create or replace function privado.dar_item(p_user uuid, p_item text, p_origem text, p_criacao uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_item public.catalogo_itens;
  v_pos record;
  v_id uuid;
begin
  select * into v_item from public.catalogo_itens c where c.id = p_item;
  if not found then
    return null;
  end if;
  select * into v_pos from privado.posicao(p_user, v_item.mundo, v_item.zona);
  insert into public.itens_mundo (user_id, item_id, mundo, criacao_id, origem, x, y)
  values (p_user, v_item.id, v_item.mundo, p_criacao, p_origem, v_pos.x, v_pos.y)
  returning id into v_id;
  return v_id;
end $$;

-- cada música planta um item comum do mundo da pessoa
create or replace function privado.plantar(p_user uuid, p_criacao uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_mundo public.mundo;
  v_item text;
begin
  select coalesce(p.mundo, 'floresta') into v_mundo from public.profiles p where p.id = p_user;
  select c.id into v_item from public.catalogo_itens c where c.mundo = v_mundo and c.comum order by random() limit 1;
  if v_item is not null then
    perform privado.dar_item(p_user, v_item, 'musica', p_criacao);
  end if;
end $$;

-- ------------------------------------------------------------ metas (RPG com propósito)
create or replace function privado.contagens(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'musicas', (select count(*) from public.criacoes c where c.user_id = p_user and c.status = 'pronta'),
    'plays', (select count(*) from public.plays pl where pl.dono_id = p_user and pl.user_id is distinct from p_user),
    'compartilhamentos', (select count(*) from public.compartilhamentos s where s.user_id = p_user),
    'convites', (select count(*) from public.profiles p where p.convidado_por = p_user))
$$;

create or replace function privado.checar_metas(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_cont jsonb := privado.contagens(p_user);
  v_meta public.metas;
  v_mundo public.mundo;
  v_item text;
begin
  select p.mundo into v_mundo from public.profiles p where p.id = p_user;
  for v_meta in
    select m.* from public.metas m
     where (v_cont ->> m.tipo)::int >= m.limiar
       and not exists (select 1 from public.metas_atingidas a where a.user_id = p_user and a.meta_id = m.id)
     order by m.ordem
  loop
    insert into public.metas_atingidas (user_id, meta_id) values (p_user, v_meta.id) on conflict do nothing;
    if v_meta.sementes > 0 then
      update public.profiles set sementes = sementes + v_meta.sementes where id = p_user;
      insert into public.sementes_extrato (user_id, delta, motivo, ref) values (p_user, v_meta.sementes, 'meta', v_meta.id);
    end if;
    if v_meta.especial is not null and v_mundo is not null then
      select c.id into v_item from public.catalogo_itens c where c.mundo = v_mundo and c.especial = v_meta.especial limit 1;
      if v_item is not null then
        perform privado.dar_item(p_user, v_item, 'meta');
      end if;
    end if;
    perform privado.notificar(p_user, 'Conquista: ' || v_meta.titulo,
      v_meta.descricao || case when v_meta.sementes > 0 then ' +' || v_meta.sementes || ' sementes.' else '' end, '/mundo');
  end loop;
end $$;

-- ------------------------------------------------------------ perfil
create or replace function public.meu_perfil() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'nome', p.nome, 'username', p.username, 'avatar_url', p.avatar_url, 'email', u.email,
    'role', p.role, 'mundo', p.mundo, 'creditos', p.creditos, 'sementes', p.sementes,
    'convite_codigo', p.convite_codigo, 'created_at', p.created_at,
    'nao_lidas', (select count(*) from public.notificacoes n where n.user_id = p.id and not n.lida),
    'contagens', privado.contagens(p.id))
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = auth.uid()
$$;

create or replace function public.meu_progresso() returns jsonb
language sql stable security definer set search_path = '' as $$
  with c as (select privado.contagens(auth.uid()) as v)
  select jsonb_build_object(
    'contagens', (select v from c),
    'metas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'tipo', m.tipo, 'limiar', m.limiar, 'sementes', m.sementes, 'especial', m.especial,
        'titulo', m.titulo, 'descricao', m.descricao,
        'atual', least(((select v from c) ->> m.tipo)::int, m.limiar),
        'atingida', exists (select 1 from public.metas_atingidas a where a.user_id = auth.uid() and a.meta_id = m.id))
        order by m.tipo, m.ordem)
      from public.metas m), '[]'::jsonb))
  where auth.uid() is not null
$$;

create or replace function public.atualizar_perfil(p_nome text, p_username text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_user text := lower(regexp_replace(coalesce(p_username, ''), '[^a-zA-Z0-9_]', '', 'g'));
begin
  if auth.uid() is null then
    raise exception 'Entre na sua conta.';
  end if;
  if length(trim(coalesce(p_nome, ''))) < 2 then
    raise exception 'Escreva seu nome.';
  end if;
  if length(v_user) < 3 or length(v_user) > 24 then
    raise exception 'O usuário precisa ter de 3 a 24 letras ou números.';
  end if;
  if exists (select 1 from public.profiles p where p.username = v_user and p.id <> auth.uid()) then
    raise exception 'Esse usuário já existe. Tente outro.';
  end if;
  update public.profiles set nome = left(trim(p_nome), 60), username = v_user where id = auth.uid();
end $$;

create or replace function public.escolher_mundo(p_mundo public.mundo) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_item text;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  update public.profiles set mundo = p_mundo where id = v_uid;
  if not exists (select 1 from public.itens_mundo im where im.user_id = v_uid and im.mundo = p_mundo) then
    select c.id into v_item from public.catalogo_itens c where c.mundo = p_mundo and c.boas_vindas limit 1;
    if v_item is not null then
      perform privado.dar_item(v_uid, v_item, 'boas-vindas');
    end if;
  end if;
  perform privado.checar_metas(v_uid);
  return jsonb_build_object('mundo', p_mundo);
end $$;

create or replace function public.aplicar_convite(p_codigo text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_convidador uuid;
begin
  if v_uid is null then
    return false;
  end if;
  select p.id into v_convidador from public.profiles p where p.convite_codigo = upper(trim(coalesce(p_codigo, '')));
  if v_convidador is null or v_convidador = v_uid then
    return false;
  end if;
  update public.profiles set convidado_por = v_convidador
   where id = v_uid and convidado_por is null and created_at > now() - interval '2 days';
  if found then
    perform privado.checar_metas(v_convidador);
    perform privado.notificar(v_convidador, 'Alguém entrou pelo seu convite 💚', 'Seu mundo está crescendo.', '/mundo');
    return true;
  end if;
  return false;
end $$;

create or replace function public.marcar_notificacoes_lidas() returns void
language sql security definer set search_path = '' as $$
  update public.notificacoes set lida = true where user_id = auth.uid() and not lida;
$$;

