-- Primeira Melodia V2 · funções (parte 3 de 4)

-- ------------------------------------------------------------ palco (uma fila única, ao vivo)
alter table public.palco_fila add column if not exists cancelada boolean not null default false;

-- fecha os buracos da fila futura (quando uma música sai do palco, as próximas andam)
create or replace function privado.palco_compactar() returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_t timestamptz;
  r record;
begin
  select max(pf.fim) into v_t from public.palco_fila pf where not pf.cancelada and pf.inicio <= now();
  v_t := greatest(coalesce(v_t, now()), now());
  for r in select pf.id, pf.inicio, pf.fim from public.palco_fila pf
            where not pf.cancelada and pf.inicio > now() order by pf.inicio
  loop
    if r.inicio <> v_t + interval '2 seconds' then
      update public.palco_fila set inicio = v_t + interval '2 seconds', fim = v_t + interval '2 seconds' + (r.fim - r.inicio)
       where id = r.id;
    end if;
    v_t := v_t + interval '2 seconds' + (r.fim - r.inicio);
  end loop;
end $$;

create or replace function privado.palco_tirar(p_criacao uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(424242);
  update public.palco_fila set cancelada = true where criacao_id = p_criacao and inicio > now() and not cancelada;
  perform privado.palco_compactar();
end $$;

create or replace function privado.palco_enfileirar(p_criacao uuid, p_reprise boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_f public.faixas;
  v_ini timestamptz;
begin
  perform pg_advisory_xact_lock(424242);
  select f.* into v_f from public.faixas f
   where f.criacao_id = p_criacao
   order by (select count(*) from public.palco_fila pf where pf.faixa_id = f.id and not pf.cancelada), f.versao
   limit 1;
  if not found then
    return;
  end if;
  select greatest(coalesce(max(pf.fim), now()), now()) + interval '2 seconds' into v_ini
    from public.palco_fila pf where not pf.cancelada;
  insert into public.palco_fila (criacao_id, faixa_id, inicio, fim, reprise)
  values (p_criacao, v_f.id, v_ini, v_ini + make_interval(secs => greatest(v_f.duracao_s, 5)::double precision), p_reprise);
end $$;

create or replace function public.palco_manter() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_fim timestamptz;
  v_c uuid;
  n int := 0;
begin
  perform pg_advisory_xact_lock(424243);
  -- o que deixou de ser público sai do futuro e a fila anda
  if exists (select 1 from public.palco_fila pf join public.criacoes c on c.id = pf.criacao_id
              where pf.inicio > now() and not pf.cancelada and c.publico <> 'publica') then
    update public.palco_fila pf set cancelada = true
      from public.criacoes c
     where c.id = pf.criacao_id and pf.inicio > now() and not pf.cancelada and c.publico <> 'publica';
    perform privado.palco_compactar();
  end if;
  loop
    select max(pf.fim) into v_fim from public.palco_fila pf where not pf.cancelada;
    exit when v_fim is not null and v_fim > now() + interval '15 minutes';
    exit when n >= 40;
    v_c := null;
    select c.id into v_c from public.criacoes c
     where c.publico = 'publica' and c.status = 'pronta'
       and exists (select 1 from public.faixas f where f.criacao_id = c.id)
       and not exists (select 1 from public.palco_fila pf where pf.criacao_id = c.id and not pf.cancelada
                         and pf.fim > now() - interval '20 minutes')
     order by (select max(pf.inicio) from public.palco_fila pf where pf.criacao_id = c.id and not pf.cancelada) nulls first, random()
     limit 1;
    if v_c is null then
      select c.id into v_c from public.criacoes c
       where c.publico = 'publica' and c.status = 'pronta'
         and exists (select 1 from public.faixas f where f.criacao_id = c.id)
       order by random() limit 1;
    end if;
    exit when v_c is null;
    perform privado.palco_enfileirar(v_c, true);
    n := n + 1;
  end loop;
  return n;
end $$;

-- (troca a versão da parte 2: sair do palco agora só cancela, sem apagar)
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
     and not exists (select 1 from public.palco_fila pf where pf.criacao_id = v.id and pf.fim > now() and not pf.cancelada) then
    perform privado.palco_enfileirar(v.id, false);
  elsif v_novo <> 'publica' then
    perform privado.palco_tirar(v.id);
  end if;
  return v_novo::text;
end $$;

create or replace function public.palco_estado() returns jsonb
language sql stable security definer set search_path = '' as $$
  with fila as (
    select pf.id, pf.criacao_id, pf.faixa_id, pf.inicio, pf.fim, pf.reprise,
           c.titulo, c.estilo, c.mundo, c.para_quem, f.storage_path, f.duracao_s, f.versao, p.nome as autor, p.username
      from public.palco_fila pf
      join public.criacoes c on c.id = pf.criacao_id
      join public.faixas f on f.id = pf.faixa_id
      join public.profiles p on p.id = c.user_id
     where pf.fim > now() and c.publico = 'publica' and not pf.cancelada
     order by pf.inicio
     limit 31)
  select jsonb_build_object(
    'agora', now(),
    'fila', coalesce((select jsonb_agg(jsonb_build_object(
        'id', f.id, 'criacao_id', f.criacao_id, 'faixa_id', f.faixa_id, 'titulo', f.titulo, 'autor', f.autor,
        'username', f.username, 'inicio', f.inicio, 'fim', f.fim, 'duracao', f.duracao_s, 'storage_path', f.storage_path,
        'versao', f.versao, 'estilo', f.estilo, 'mundo', f.mundo, 'para_quem', f.para_quem) order by f.inicio) from fila f), '[]'::jsonb),
    'atual', (select jsonb_build_object('criacao_id', c.id, 'letra', c.letra, 'karaoke', c.karaoke)
                from fila f join public.criacoes c on c.id = f.criacao_id
               order by f.inicio limit 1),
    'criando_agora', (select count(*) from public.criacoes c where c.status in ('na_fila', 'gerando')),
    'no_palco', (select count(*) from public.criacoes c where c.publico = 'publica' and c.status = 'pronta'))
$$;

-- ------------------------------------------------------------ trabalhador de música (service_role)
create or replace function public.worker_pegar(p_limite int default 3) returns setof public.criacoes
language plpgsql security definer set search_path = '' as $$
begin
  return query
  update public.criacoes c set travado_ate = now() + interval '110 seconds'
   where c.id in (
     select x.id from public.criacoes x
      where (x.status = 'na_fila' or (x.status = 'gerando' and coalesce(x.checado_em, x.created_at) < now() - interval '12 seconds'))
        and (x.travado_ate is null or x.travado_ate < now())
      order by x.created_at
      limit p_limite
      for update skip locked)
  returning c.*;
end $$;

create or replace function public.worker_iniciada(p_id uuid, p_provedor text, p_tarefa text, p_letra text default null) returns void
language sql security definer set search_path = '' as $$
  update public.criacoes
     set status = 'gerando', provedor = p_provedor, tarefa_id = p_tarefa, tentativas = tentativas + 1,
         checado_em = now(), travado_ate = null, letra = coalesce(p_letra, letra), erro = null
   where id = p_id;
$$;

create or replace function public.worker_aguardar(p_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.criacoes set checado_em = now(), travado_ate = null where id = p_id;
$$;

create or replace function public.worker_finalizar(p_id uuid, p_faixas jsonb, p_letra text default null, p_karaoke jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v public.criacoes;
begin
  insert into public.faixas (criacao_id, versao, storage_path, duracao_s, formato)
  select p_id, f.versao, f.storage_path, coalesce(f.duracao_s, 0), coalesce(f.formato, 'mp3')
    from jsonb_to_recordset(p_faixas) as f(versao int, storage_path text, duracao_s numeric, formato text)
  on conflict (criacao_id, versao) do update
    set storage_path = excluded.storage_path, duracao_s = excluded.duracao_s, formato = excluded.formato;
  update public.criacoes
     set status = 'pronta', pronta_em = now(), travado_ate = null, erro = null,
         letra = coalesce(nullif(p_letra, ''), letra), karaoke = coalesce(p_karaoke, karaoke)
   where id = p_id and status <> 'pronta'
  returning * into v;
  if not found then
    return;
  end if;
  perform privado.plantar(v.user_id, v.id);
  perform privado.checar_metas(v.user_id);
  if v.publico = 'publica' then
    perform privado.palco_enfileirar(v.id, false);
  elsif v.publico = 'em_analise' then
    perform privado.notificar_admin('Música para aprovar', v.titulo, null, 'musical_note');
  end if;
  perform privado.notificar(v.user_id, 'Sua música ficou pronta! 🎶', v.titulo, '/minhas/' || v.id);
end $$;

create or replace function public.worker_falhar(p_id uuid, p_erro text, p_definitivo boolean default false, p_recusa boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v public.criacoes;
begin
  select * into v from public.criacoes c where c.id = p_id for update;
  if not found or v.status in ('pronta', 'erro', 'recusada') then
    return;
  end if;
  if p_recusa or p_definitivo or v.tentativas >= 3 then
    update public.criacoes
       set status = case when p_recusa then 'recusada'::public.status_criacao else 'erro'::public.status_criacao end,
           motivo_recusa = case when p_recusa then left(p_erro, 500) end, erro = left(p_erro, 1000), travado_ate = null
     where id = v.id;
    update public.profiles set creditos = creditos + 1 where id = v.user_id;
    insert into public.creditos_extrato (user_id, delta, motivo, criacao_id) values (v.user_id, 1, 'estorno', v.id);
    perform privado.notificar(v.user_id,
      case when p_recusa then 'Essa história não virou música' else 'Não conseguimos criar sua música' end,
      case when p_recusa then left(p_erro, 300) || ' Seu crédito voltou.' else 'Seu crédito voltou. Tente de novo em alguns minutos.' end,
      '/minhas/' || v.id);
    if not p_recusa then
      perform privado.notificar_admin('Erro ao gerar música', v.titulo || ' · ' || left(p_erro, 200), null, 'warning');
    end if;
  else
    update public.criacoes
       set status = 'na_fila', erro = left(p_erro, 1000), travado_ate = now() + interval '45 seconds', tarefa_id = null
     where id = v.id;
  end if;
end $$;

-- agendadores: só chamam a Edge Function quando há trabalho
create or replace function privado.cron_minuto() returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public.palco_manter();
  if exists (select 1 from public.criacoes c where c.status in ('na_fila', 'gerando')) then
    perform privado.acionar('/musica/processar');
  end if;
  if exists (select 1 from public.pedidos p where p.status = 'pendente' and p.mp_order_id is not null
               and p.created_at > now() - interval '3 hours') then
    perform privado.acionar('/pagamentos/conferir');
  end if;
end $$;

