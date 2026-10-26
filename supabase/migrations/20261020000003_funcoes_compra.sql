-- Primeira Melodia V2 · funções (parte 2 de 4)

-- ------------------------------------------------------------ cupom e pedido
create or replace function public.validar_cupom(p_codigo text, p_pacote int) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_cup public.cupons;
  v_pac public.pacotes;
  v_desc int;
begin
  select * into v_pac from public.pacotes p where p.id = p_pacote and p.ativo;
  if not found then
    return jsonb_build_object('ok', false, 'mensagem', 'Pacote indisponível.');
  end if;
  select * into v_cup from public.cupons c where c.codigo = upper(trim(coalesce(p_codigo, '')));
  if not found or not v_cup.ativo or (v_cup.valido_ate is not null and v_cup.valido_ate < now())
     or (v_cup.usos_max is not null and v_cup.usos >= v_cup.usos_max) then
    return jsonb_build_object('ok', false, 'mensagem', 'Cupom inválido ou esgotado.');
  end if;
  if v_cup.um_por_pessoa and exists (select 1 from public.cupom_usos u where u.cupom = v_cup.codigo and u.user_id = auth.uid()) then
    return jsonb_build_object('ok', false, 'mensagem', 'Você já usou esse cupom.');
  end if;
  v_desc := round(v_pac.preco_centavos * v_cup.percentual / 100.0);
  return jsonb_build_object('ok', true, 'percentual', v_cup.percentual, 'desconto', v_desc,
    'valor_final', greatest(v_pac.preco_centavos - v_desc, 0),
    'mensagem', case when v_cup.percentual = 100 then 'Cupom de 100%: é por nossa conta!' else v_cup.percentual || '% de desconto aplicado.' end);
end $$;

create or replace function privado.liberar(p_pedido uuid, p_ref text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v public.pedidos;
  v_pct numeric := coalesce((privado.cfg('fundo_percentual') #>> '{}')::numeric, 10);
begin
  select * into v from public.pedidos p where p.id = p_pedido for update;
  if not found or v.status = 'pago' then
    return false;
  end if;
  -- se o Pix cair depois do prazo, a pessoa pagou: o crédito é entregue mesmo assim
  update public.pedidos
     set status = 'pago', pago_em = now(), mp_ref = coalesce(p_ref, mp_ref),
         fundo_centavos = round(v.valor_final * v_pct / 100.0), updated_at = now()
   where id = v.id;
  update public.profiles set creditos = creditos + v.creditos where id = v.user_id;
  insert into public.creditos_extrato (user_id, delta, motivo, pedido_id) values (v.user_id, v.creditos, 'compra', v.id);
  if v.cupom is not null then
    insert into public.cupom_usos (cupom, user_id, pedido_id) values (v.cupom, v.user_id, v.id);
    update public.cupons set usos = usos + 1 where codigo = v.cupom;
  end if;
  perform privado.notificar(v.user_id,
    case when v.valor_final = 0 then 'Cupom aplicado 🎁' else 'Pagamento confirmado 💚' end,
    v.creditos || case when v.creditos = 1 then ' crédito liberado. ' else ' créditos liberados. ' end || 'Bora criar!', '/criar');
  perform privado.notificar_admin(
    case when v.valor_final = 0 then 'Cupom usado' else 'Pix recebido ' || privado.brl(v.valor_final) end,
    v.codigo || ' · ' || v.creditos || ' crédito(s)' || coalesce(' · cupom ' || v.cupom, ''),
    null, case when v.valor_final = 0 then 'ticket' else 'moneybag' end);
  return true;
end $$;

create or replace function public.criar_pedido(p_pacote int, p_cupom text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_pac public.pacotes;
  v_cup public.cupons;
  v_desc int := 0;
  v_final int;
  v_cod text;
  v_ped public.pedidos;
  v_min int := coalesce((privado.cfg('pix_minutos') #>> '{}')::int, 60);
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  select * into v_pac from public.pacotes p where p.id = p_pacote and p.ativo;
  if not found then
    raise exception 'Pacote indisponível.';
  end if;
  if (select count(*) from public.pedidos p where p.user_id = v_uid and p.status = 'pendente' and p.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Você tem muitos pedidos em aberto. Aguarde alguns minutos.';
  end if;
  if nullif(trim(coalesce(p_cupom, '')), '') is not null then
    select * into v_cup from public.cupons c where c.codigo = upper(trim(p_cupom)) for update;
    if not found or not v_cup.ativo or (v_cup.valido_ate is not null and v_cup.valido_ate < now())
       or (v_cup.usos_max is not null and v_cup.usos >= v_cup.usos_max) then
      raise exception 'Cupom inválido ou esgotado.';
    end if;
    if v_cup.um_por_pessoa and exists (select 1 from public.cupom_usos u where u.cupom = v_cup.codigo and u.user_id = v_uid) then
      raise exception 'Você já usou esse cupom.';
    end if;
    v_desc := round(v_pac.preco_centavos * v_cup.percentual / 100.0);
  end if;
  v_final := greatest(v_pac.preco_centavos - v_desc, 0);
  loop
    v_cod := privado.codigo('PM-', 6);
    exit when not exists (select 1 from public.pedidos p where p.codigo = v_cod);
  end loop;
  insert into public.pedidos (codigo, user_id, pacote_id, creditos, valor_bruto, desconto, valor_final, cupom, metodo, expira_em)
  values (v_cod, v_uid, v_pac.id, v_pac.creditos, v_pac.preco_centavos, v_desc, v_final, v_cup.codigo,
          case when v_final = 0 then 'cupom'::public.metodo_pag else 'pix'::public.metodo_pag end,
          now() + make_interval(mins => v_min))
  returning * into v_ped;
  if v_final = 0 then
    perform privado.liberar(v_ped.id, 'cupom');
    select * into v_ped from public.pedidos p where p.id = v_ped.id;
  end if;
  return jsonb_build_object('id', v_ped.id, 'codigo', v_ped.codigo, 'status', v_ped.status,
    'valor_final', v_ped.valor_final, 'creditos', v_ped.creditos, 'desconto', v_ped.desconto);
end $$;

-- usado pela Edge Function de pagamentos (service_role)
create or replace function public.pagamento_confirmado(p_pedido uuid, p_ref text) returns boolean
language sql security definer set search_path = '' as $$
  select privado.liberar(p_pedido, p_ref)
$$;

create or replace function public.expirar_pedidos() returns int
language sql security definer set search_path = '' as $$
  with x as (
    update public.pedidos set status = 'expirado', updated_at = now()
     where status = 'pendente' and expira_em < now() - interval '30 minutes'
     returning 1)
  select count(*)::int from x
$$;

-- ------------------------------------------------------------ criação de música
create or replace function public.criar_musica(
  p_titulo text, p_para_quem text, p_historia text, p_tem_letra boolean, p_letra text,
  p_estilo text, p_voz text, p_palco boolean default true)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_prof public.profiles;
  v_id uuid;
  v_previa boolean := coalesce((privado.cfg('palco_moderacao_previa') #>> '{}')::boolean, false);
  v_titulo text := left(trim(coalesce(p_titulo, '')), 80);
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  select * into v_prof from public.profiles p where p.id = v_uid for update;
  if v_prof.creditos < 1 then
    raise exception 'Você não tem créditos. Compre um pacote para criar.' using errcode = 'P0002';
  end if;
  if coalesce(p_tem_letra, false) then
    if length(trim(coalesce(p_letra, ''))) < 20 then
      raise exception 'A letra está muito curta.';
    end if;
    if length(p_letra) > 3000 then
      raise exception 'A letra pode ter até 3.000 caracteres.';
    end if;
  else
    if length(trim(coalesce(p_historia, ''))) < 15 then
      raise exception 'Conte um pouco mais da história.';
    end if;
    if length(p_historia) > 1500 then
      raise exception 'A história pode ter até 1.500 caracteres.';
    end if;
  end if;
  if v_titulo = '' then
    v_titulo := coalesce('Para ' || nullif(trim(p_para_quem), ''), 'Minha melodia');
  end if;
  update public.profiles set creditos = creditos - 1 where id = v_uid;
  insert into public.criacoes (user_id, titulo, para_quem, historia, tem_letra, letra, estilo, voz, mundo, publico)
  values (v_uid, v_titulo, nullif(left(trim(coalesce(p_para_quem, '')), 60), ''), left(p_historia, 1500),
          coalesce(p_tem_letra, false), case when coalesce(p_tem_letra, false) then left(p_letra, 3000) end,
          coalesce(nullif(left(trim(coalesce(p_estilo, '')), 40), ''), 'pop'),
          case when p_voz = 'masculina' then 'masculina' else 'feminina' end, coalesce(v_prof.mundo, 'floresta'),
          case when not coalesce(p_palco, true) then 'privada'::public.status_publico
               when v_previa then 'em_analise'::public.status_publico
               else 'publica'::public.status_publico end)
  returning id into v_id;
  insert into public.creditos_extrato (user_id, delta, motivo, criacao_id) values (v_uid, -1, 'criacao', v_id);
  perform privado.acionar('/musica/processar');
  return v_id;
end $$;

-- detalhes da própria criação (inclui a história, que não fica pública)
create or replace function public.minha_criacao(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'titulo', c.titulo, 'para_quem', c.para_quem, 'historia', c.historia, 'tem_letra', c.tem_letra,
    'letra', c.letra, 'estilo', c.estilo, 'voz', c.voz, 'mundo', c.mundo, 'status', c.status, 'publico', c.publico,
    'motivo_recusa', c.motivo_recusa, 'karaoke', c.karaoke, 'created_at', c.created_at, 'pronta_em', c.pronta_em,
    'faixas', coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'versao', f.versao, 'storage_path', f.storage_path,
                         'duracao', f.duracao_s, 'formato', f.formato) order by f.versao)
                        from public.faixas f where f.criacao_id = c.id), '[]'::jsonb),
    'plays', (select count(*) from public.plays pl where pl.criacao_id = c.id),
    'item', (select jsonb_build_object('item_id', im.item_id, 'nome', ci.nome, 'arte', ci.arte)
               from public.itens_mundo im join public.catalogo_itens ci on ci.id = im.item_id
              where im.criacao_id = c.id limit 1))
  from public.criacoes c
  where c.id = p_id and (c.user_id = auth.uid() or public.is_admin())
$$;

create or replace function public.musica_publica(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'titulo', c.titulo, 'para_quem', c.para_quem, 'letra', c.letra, 'estilo', c.estilo, 'mundo', c.mundo,
    'karaoke', c.karaoke, 'created_at', c.created_at, 'publico', c.publico, 'status', c.status,
    'dono', c.user_id = auth.uid(),
    'autor', jsonb_build_object('nome', p.nome, 'username', p.username, 'convite', p.convite_codigo),
    'faixas', case when c.status = 'pronta' then coalesce((
       select jsonb_agg(jsonb_build_object('id', f.id, 'versao', f.versao, 'storage_path', f.storage_path, 'duracao', f.duracao_s) order by f.versao)
         from public.faixas f where f.criacao_id = c.id), '[]'::jsonb) else '[]'::jsonb end)
  from public.criacoes c
  join public.profiles p on p.id = c.user_id
  where c.id = p_id and (c.publico = 'publica' or c.user_id = auth.uid())
$$;

create or replace function public.mundo_publico(p_username text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'nome', p.nome, 'username', p.username, 'mundo', p.mundo,
    'itens', coalesce((select jsonb_agg(jsonb_build_object('id', im.id, 'item_id', im.item_id, 'arte', ci.arte, 'nome', ci.nome,
                          'zona', ci.zona, 'largura', ci.largura, 'x', im.x, 'y', im.y) order by im.y)
                       from public.itens_mundo im join public.catalogo_itens ci on ci.id = im.item_id
                       where im.user_id = p.id and im.mundo = p.mundo), '[]'::jsonb),
    'musicas', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'titulo', c.titulo, 'estilo', c.estilo, 'pronta_em', c.pronta_em) order by c.pronta_em desc)
                         from public.criacoes c where c.user_id = p.id and c.publico = 'publica' and c.status = 'pronta'), '[]'::jsonb))
  from public.profiles p
  where p.username = lower(p_username)
$$;

create or replace function public.meu_mundo() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'mundo', p.mundo, 'sementes', p.sementes,
    'itens', coalesce((select jsonb_agg(jsonb_build_object('id', im.id, 'item_id', im.item_id, 'arte', ci.arte, 'nome', ci.nome,
                          'zona', ci.zona, 'largura', ci.largura, 'x', im.x, 'y', im.y, 'origem', im.origem,
                          'criacao_id', im.criacao_id, 'criacao_titulo', c.titulo, 'created_at', im.created_at) order by im.y)
                       from public.itens_mundo im
                       join public.catalogo_itens ci on ci.id = im.item_id
                       left join public.criacoes c on c.id = im.criacao_id
                       where im.user_id = p.id and im.mundo = p.mundo), '[]'::jsonb))
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.definir_palco(p_criacao uuid, p_publica boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v public.criacoes;
  v_previa boolean := coalesce((privado.cfg('palco_moderacao_previa') #>> '{}')::boolean, false);
  v_novo public.status_publico;
begin
  select * into v from public.criacoes c where c.id = p_criacao and c.user_id = auth.uid() for update;
  if not found then
    raise exception 'Música não encontrada.';
  end if;
  if v.publico = 'removida' then
    raise exception 'Essa música foi retirada do palco pela curadoria.';
  end if;
  v_novo := case when not p_publica then 'privada' when v_previa then 'em_analise' else 'publica' end;
  update public.criacoes set publico = v_novo where id = v.id;
  if v_novo = 'publica' and v.status = 'pronta'
     and not exists (select 1 from public.palco_fila pf where pf.criacao_id = v.id and pf.fim > now()) then
    perform privado.palco_enfileirar(v.id, false);
  elsif v_novo <> 'publica' then
    delete from public.palco_fila pf where pf.criacao_id = v.id and pf.inicio > now();
  end if;
  return v_novo::text;
end $$;

create or replace function public.registrar_play(p_faixa uuid, p_origem text default 'app') returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v record;
begin
  select f.id, f.criacao_id, c.user_id as dono into v
    from public.faixas f join public.criacoes c on c.id = f.criacao_id
   where f.id = p_faixa and (c.publico = 'publica' or c.user_id = v_uid);
  if not found then
    return;
  end if;
  if v_uid is not null and exists (select 1 from public.plays pl where pl.user_id = v_uid and pl.faixa_id = p_faixa
                                     and pl.created_at > now() - interval '20 minutes') then
    return;
  end if;
  if v_uid is null and (select count(*) from public.plays pl where pl.faixa_id = p_faixa and pl.user_id is null
                          and pl.created_at > now() - interval '1 minute') >= 20 then
    return;
  end if;
  insert into public.plays (faixa_id, criacao_id, dono_id, user_id, origem)
  values (p_faixa, v.criacao_id, v.dono, v_uid, left(coalesce(p_origem, 'app'), 20));
  if v_uid is distinct from v.dono then
    perform privado.checar_metas(v.dono);
  end if;
end $$;

create or replace function public.registrar_compartilhamento(p_criacao uuid, p_canal text default 'link') returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;
  if not exists (select 1 from public.criacoes c where c.id = p_criacao and (c.publico = 'publica' or c.user_id = v_uid)) then
    return;
  end if;
  if exists (select 1 from public.compartilhamentos s where s.user_id = v_uid and s.criacao_id = p_criacao
               and s.canal = left(coalesce(p_canal, 'link'), 20) and s.created_at > now() - interval '1 hour') then
    return;
  end if;
  insert into public.compartilhamentos (criacao_id, user_id, canal) values (p_criacao, v_uid, left(coalesce(p_canal, 'link'), 20));
  perform privado.checar_metas(v_uid);
end $$;

-- ------------------------------------------------------------ lojinha
create or replace function public.comprar_item(p_item text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_item public.catalogo_itens;
  v_prof public.profiles;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  select * into v_item from public.catalogo_itens c where c.id = p_item and c.preco_sementes is not null;
  if not found then
    raise exception 'Item indisponível.';
  end if;
  select * into v_prof from public.profiles p where p.id = v_uid for update;
  if v_prof.mundo is null then
    raise exception 'Escolha seu mundo primeiro.';
  end if;
  if v_item.mundo <> v_prof.mundo then
    raise exception 'Esse item é de outro mundo.';
  end if;
  if v_prof.sementes < v_item.preco_sementes then
    raise exception 'Faltam sementes. Crie, compartilhe e convide para ganhar mais.';
  end if;
  update public.profiles set sementes = sementes - v_item.preco_sementes where id = v_uid;
  insert into public.sementes_extrato (user_id, delta, motivo, ref) values (v_uid, -v_item.preco_sementes, 'loja', v_item.id);
  perform privado.dar_item(v_uid, v_item.id, 'loja');
  return jsonb_build_object('sementes', v_prof.sementes - v_item.preco_sementes, 'item', v_item.id);
end $$;

-- ------------------------------------------------------------ ESG
create or replace function public.enviar_projeto_esg(p_titulo text, p_descricao text, p_causa text, p_link text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  if (select count(*) from public.esg_projetos e where e.user_id = v_uid and e.ano = extract(year from now())::int) >= 3 then
    raise exception 'Você já enviou 3 projetos este ano.';
  end if;
  if length(trim(coalesce(p_titulo, ''))) < 3 then
    raise exception 'Dê um título ao projeto.';
  end if;
  if length(trim(coalesce(p_descricao, ''))) < 20 then
    raise exception 'Descreva o projeto em pelo menos 20 caracteres.';
  end if;
  if p_causa not in ('planeta', 'oceano', 'floresta') then
    raise exception 'Escolha planeta, oceano ou floresta.';
  end if;
  insert into public.esg_projetos (user_id, titulo, descricao, causa, link)
  values (v_uid, left(trim(p_titulo), 120), left(trim(p_descricao), 3000), p_causa, nullif(left(trim(coalesce(p_link, '')), 300), ''))
  returning id into v_id;
  perform privado.notificar_admin('Novo projeto ESG', left(trim(p_titulo), 120), null, 'seedling');
  return v_id;
end $$;

create or replace function public.votar_esg(p_projeto uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v public.esg_projetos;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta para votar.';
  end if;
  select * into v from public.esg_projetos e where e.id = p_projeto and e.status = 'finalista' for update;
  if not found then
    raise exception 'A votação desse projeto não está aberta.';
  end if;
  begin
    insert into public.esg_votos (projeto_id, user_id, ano) values (v.id, v_uid, v.ano);
  exception when unique_violation then
    raise exception 'Você já votou este ano. Obrigado! 💚';
  end;
  update public.esg_projetos set votos = votos + 1 where id = v.id returning votos into v.votos;
  return v.votos;
end $$;

create or replace function public.esg_painel() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'ano', extract(year from now())::int,
    'fundo_centavos', coalesce((select sum(p.fundo_centavos) from public.pedidos p
                                 where p.status = 'pago' and p.pago_em >= date_trunc('year', now())), 0),
    'percentual', coalesce((privado.cfg('fundo_percentual') #>> '{}')::numeric, 10),
    'finalistas', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'titulo', e.titulo, 'descricao', e.descricao,
                              'causa', e.causa, 'link', e.link, 'votos', e.votos, 'status', e.status) order by e.created_at)
                            from public.esg_projetos e
                            where e.ano = extract(year from now())::int and e.status in ('finalista', 'vencedor')), '[]'::jsonb),
    'meu_voto', (select v.projeto_id from public.esg_votos v where v.user_id = auth.uid() and v.ano = extract(year from now())::int),
    'meus_projetos', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'titulo', e.titulo, 'status', e.status, 'causa', e.causa,
                                 'created_at', e.created_at) order by e.created_at desc)
                               from public.esg_projetos e where e.user_id = auth.uid()), '[]'::jsonb))
$$;

create or replace function public.pedir_licenca(p_criacao uuid, p_tipo text, p_descricao text, p_contato text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Entre na sua conta.';
  end if;
  if length(trim(coalesce(p_descricao, ''))) < 10 then
    raise exception 'Conte um pouco do uso que você quer fazer.';
  end if;
  insert into public.pedidos_licenca (user_id, criacao_id, tipo, descricao, contato)
  values (v_uid, p_criacao, left(coalesce(nullif(trim(p_tipo), ''), 'outro'), 40), left(trim(p_descricao), 2000), left(trim(coalesce(p_contato, '')), 200))
  returning id into v_id;
  perform privado.notificar_admin('Pedido de uso comercial', left(trim(p_descricao), 140), null, 'handshake');
  return v_id;
end $$;

