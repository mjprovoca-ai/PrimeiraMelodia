-- Primeira Melodia V2 · funções (parte 4 de 4)

-- ------------------------------------------------------------ administração
create or replace function privado.exigir_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso só para a administração.' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_resumo(p_dias int default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_ini date := current_date - (greatest(p_dias, 1) - 1);
begin
  perform privado.exigir_admin();
  return jsonb_build_object(
    'receita_total', coalesce((select sum(valor_final) from public.pedidos where status = 'pago'), 0),
    'receita_periodo', coalesce((select sum(valor_final) from public.pedidos where status = 'pago' and pago_em >= v_ini), 0),
    'pedidos_pagos', (select count(*) from public.pedidos where status = 'pago'),
    'pedidos_pendentes', (select count(*) from public.pedidos where status = 'pendente'),
    'fundo_ano', coalesce((select sum(fundo_centavos) from public.pedidos where status = 'pago' and pago_em >= date_trunc('year', now())), 0),
    'musicas', (select count(*) from public.criacoes where status = 'pronta'),
    'na_fila', (select count(*) from public.criacoes where status in ('na_fila', 'gerando')),
    'erros', (select count(*) from public.criacoes where status = 'erro' and created_at > now() - interval '7 days'),
    'usuarios', (select count(*) from public.profiles),
    'em_analise', (select count(*) from public.criacoes where publico = 'em_analise' and status = 'pronta'),
    'esg_curadoria', (select count(*) from public.esg_projetos where status = 'em_curadoria'),
    'licencas_abertas', (select count(*) from public.pedidos_licenca where status = 'aberto'),
    'serie', (select jsonb_agg(jsonb_build_object(
                'dia', d::date,
                'receita', coalesce((select sum(p.valor_final) from public.pedidos p where p.status = 'pago' and p.pago_em::date = d::date), 0),
                'pagos', (select count(*) from public.pedidos p where p.status = 'pago' and p.pago_em::date = d::date),
                'cupons', (select count(*) from public.cupom_usos u where u.created_at::date = d::date),
                'musicas', (select count(*) from public.criacoes c where c.status = 'pronta' and c.pronta_em::date = d::date),
                'cadastros', (select count(*) from public.profiles pr where pr.created_at::date = d::date)) order by d)
              from generate_series(v_ini, current_date, interval '1 day') d),
    'cupons', coalesce((select jsonb_agg(jsonb_build_object('codigo', c.codigo, 'percentual', c.percentual, 'usos', c.usos,
                          'usos_max', c.usos_max, 'ativo', c.ativo, 'valido_ate', c.valido_ate, 'descricao', c.descricao,
                          'um_por_pessoa', c.um_por_pessoa, 'created_at', c.created_at) order by c.created_at desc)
                        from public.cupons c), '[]'::jsonb));
end $$;

create or replace function public.admin_criar_cupom(p_codigo text, p_percentual int, p_usos_max int default null,
  p_valido_ate timestamptz default null, p_descricao text default null, p_um_por_pessoa boolean default true)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_cod text := upper(regexp_replace(coalesce(p_codigo, ''), '[^a-zA-Z0-9]', '', 'g'));
begin
  perform privado.exigir_admin();
  if v_cod = '' then
    v_cod := privado.codigo(case when p_percentual = 100 then 'PRESENTE' else 'MELODIA' end, 4);
  end if;
  if length(v_cod) < 3 then
    raise exception 'O código precisa ter pelo menos 3 letras.';
  end if;
  if p_percentual is null or p_percentual < 1 or p_percentual > 100 then
    raise exception 'O desconto vai de 1%% a 100%%.';
  end if;
  insert into public.cupons (codigo, percentual, usos_max, valido_ate, descricao, um_por_pessoa, criado_por)
  values (v_cod, p_percentual, p_usos_max, p_valido_ate, nullif(trim(coalesce(p_descricao, '')), ''), coalesce(p_um_por_pessoa, true), auth.uid());
  return v_cod;
exception when unique_violation then
  raise exception 'Já existe um cupom com esse código.';
end $$;

create or replace function public.admin_cupom_ativo(p_codigo text, p_ativo boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  update public.cupons set ativo = p_ativo where codigo = upper(p_codigo);
end $$;

create or replace function public.admin_moderar(p_criacao uuid, p_acao text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v public.criacoes;
begin
  perform privado.exigir_admin();
  select * into v from public.criacoes c where c.id = p_criacao for update;
  if not found then
    raise exception 'Música não encontrada.';
  end if;
  if p_acao = 'publicar' then
    update public.criacoes set publico = 'publica' where id = v.id;
    if v.status = 'pronta' and not exists (select 1 from public.palco_fila pf where pf.criacao_id = v.id and pf.fim > now() and not pf.cancelada) then
      perform privado.palco_enfileirar(v.id, false);
    end if;
    perform privado.notificar(v.user_id, 'Sua música está no Palco 🎤', v.titulo, '/palco');
  elsif p_acao = 'remover' then
    update public.criacoes set publico = 'removida' where id = v.id;
    perform privado.palco_tirar(v.id);
    perform privado.notificar(v.user_id, 'Sua música saiu do Palco',
      'A curadoria retirou "' || v.titulo || '" do Palco. Ela continua em Minhas músicas.', '/minhas/' || v.id);
  else
    raise exception 'Ação desconhecida.';
  end if;
  return p_acao;
end $$;

create or replace function public.admin_esg_status(p_projeto uuid, p_status public.status_esg) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v public.esg_projetos;
begin
  perform privado.exigir_admin();
  update public.esg_projetos set status = p_status where id = p_projeto returning * into v;
  if found and v.user_id is not null and p_status in ('finalista', 'vencedor') then
    perform privado.notificar(v.user_id,
      case when p_status = 'finalista' then 'Seu projeto é finalista! 🌱' else 'Seu projeto venceu! 💚' end, v.titulo, '/esg');
  end if;
end $$;

create or replace function public.admin_creditos(p_user uuid, p_qtd int, p_motivo text default 'cortesia') returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_novo int;
begin
  perform privado.exigir_admin();
  if p_qtd = 0 or abs(p_qtd) > 100 then
    raise exception 'Quantidade inválida.';
  end if;
  update public.profiles set creditos = greatest(creditos + p_qtd, 0) where id = p_user returning creditos into v_novo;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;
  insert into public.creditos_extrato (user_id, delta, motivo) values (p_user, p_qtd, 'admin: ' || left(coalesce(p_motivo, ''), 60));
  if p_qtd > 0 then
    perform privado.notificar(p_user, 'Você ganhou créditos 🎁', p_qtd || ' crédito(s) para criar músicas.', '/criar');
  end if;
  return v_novo;
end $$;

create or replace function public.admin_marcar_pago(p_pedido uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  return privado.liberar(p_pedido, 'manual:' || auth.uid());
end $$;

create or replace function public.admin_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  if p_role not in ('user', 'admin') then
    raise exception 'Papel inválido.';
  end if;
  if p_user = auth.uid() and p_role <> 'admin' then
    raise exception 'Você não pode tirar o seu próprio acesso.';
  end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

create or replace function public.admin_config(p_chave text, p_valor jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  if p_chave not in ('fundo_percentual', 'pix_minutos', 'palco_moderacao_previa', 'ntfy_topico', 'modo_teste', 'aviso') then
    raise exception 'Configuração não editável.';
  end if;
  insert into public.config (chave, valor, publico, updated_at)
  values (p_chave, p_valor, p_chave in ('fundo_percentual', 'modo_teste', 'aviso', 'palco_moderacao_previa'), now())
  on conflict (chave) do update set valor = excluded.valor, updated_at = now();
end $$;

create or replace function public.admin_pacote(p_id int, p_preco_centavos int, p_ativo boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  if p_preco_centavos < 100 then
    raise exception 'O preço mínimo é R$ 1,00.';
  end if;
  update public.pacotes set preco_centavos = p_preco_centavos, ativo = p_ativo where id = p_id;
end $$;

create or replace function public.admin_usuarios(p_busca text default null, p_limite int default 50) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  return coalesce((
    select jsonb_agg(x order by x ->> 'created_at' desc) from (
      select jsonb_build_object('id', p.id, 'nome', p.nome, 'username', p.username, 'email', u.email, 'role', p.role,
               'mundo', p.mundo, 'creditos', p.creditos, 'sementes', p.sementes, 'created_at', p.created_at,
               'musicas', (select count(*) from public.criacoes c where c.user_id = p.id and c.status = 'pronta'),
               'gasto', coalesce((select sum(pe.valor_final) from public.pedidos pe where pe.user_id = p.id and pe.status = 'pago'), 0)) as x
        from public.profiles p join auth.users u on u.id = p.id
       where p_busca is null or p_busca = ''
          or p.nome ilike '%' || p_busca || '%' or u.email ilike '%' || p_busca || '%' or p.username ilike '%' || p_busca || '%'
       order by p.created_at desc
       limit least(greatest(p_limite, 1), 200)) t), '[]'::jsonb);
end $$;

create or replace function public.admin_licenca_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform privado.exigir_admin();
  update public.pedidos_licenca set status = p_status where id = p_id;
end $$;
