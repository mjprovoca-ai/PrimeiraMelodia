-- Primeira Melodia V2 · segurança (RLS, permissões, gatilhos e storage)

-- gatilho: cada conta nova ganha um perfil
create trigger ao_criar_usuario after insert on auth.users
  for each row execute function privado.novo_usuario();

-- ------------------------------------------------------------ RLS em todas as tabelas
alter table public.config enable row level security;
alter table public.profiles enable row level security;
alter table public.pacotes enable row level security;
alter table public.cupons enable row level security;
alter table public.cupom_usos enable row level security;
alter table public.pedidos enable row level security;
alter table public.creditos_extrato enable row level security;
alter table public.criacoes enable row level security;
alter table public.faixas enable row level security;
alter table public.plays enable row level security;
alter table public.compartilhamentos enable row level security;
alter table public.catalogo_itens enable row level security;
alter table public.itens_mundo enable row level security;
alter table public.metas enable row level security;
alter table public.metas_atingidas enable row level security;
alter table public.sementes_extrato enable row level security;
alter table public.palco_fila enable row level security;
alter table public.esg_projetos enable row level security;
alter table public.esg_votos enable row level security;
alter table public.notificacoes enable row level security;
alter table public.pedidos_licenca enable row level security;

create policy config_leitura on public.config for select using (publico or (select public.is_admin()));
create policy perfis_leitura on public.profiles for select using (true);
create policy perfis_editar on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy pacotes_leitura on public.pacotes for select using (ativo or (select public.is_admin()));
create policy cupons_admin on public.cupons for select using ((select public.is_admin()));
create policy cupom_usos_admin on public.cupom_usos for select using ((select public.is_admin()));
create policy pedidos_dono on public.pedidos for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy extrato_dono on public.creditos_extrato for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy criacoes_leitura on public.criacoes for select
  using (user_id = (select auth.uid()) or publico = 'publica' or (select public.is_admin()));
create policy faixas_leitura on public.faixas for select using (
  exists (select 1 from public.criacoes c where c.id = criacao_id
            and (c.user_id = (select auth.uid()) or c.publico = 'publica' or (select public.is_admin()))));
create policy plays_admin on public.plays for select using ((select public.is_admin()));
create policy compart_admin on public.compartilhamentos for select using ((select public.is_admin()));
create policy catalogo_leitura on public.catalogo_itens for select using (true);
create policy itens_leitura on public.itens_mundo for select using (true);
create policy metas_leitura on public.metas for select using (true);
create policy metas_ating_dono on public.metas_atingidas for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy sementes_dono on public.sementes_extrato for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy palco_leitura on public.palco_fila for select using (true);
create policy esg_leitura on public.esg_projetos for select
  using (status in ('finalista', 'vencedor') or user_id = (select auth.uid()) or (select public.is_admin()));
create policy esg_votos_dono on public.esg_votos for select using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy notif_dono on public.notificacoes for select using (user_id = (select auth.uid()));
create policy notif_lida on public.notificacoes for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy licenca_dono on public.pedidos_licenca for select using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ------------------------------------------------------------ permissões por coluna
-- Por padrão o Supabase dá tudo para anon/authenticated; aqui fica só o necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.config, public.pacotes, public.catalogo_itens, public.metas, public.palco_fila, public.itens_mundo,
                public.faixas, public.esg_projetos to anon, authenticated;
grant select (id, nome, username, avatar_url, mundo, created_at) on public.profiles to anon, authenticated;
grant update (nome, avatar_url) on public.profiles to authenticated;
grant select (id, user_id, titulo, para_quem, tem_letra, letra, estilo, voz, mundo, status, publico, motivo_recusa,
              karaoke, created_at, pronta_em) on public.criacoes to anon, authenticated;
grant select on public.pedidos, public.creditos_extrato, public.metas_atingidas, public.sementes_extrato, public.notificacoes,
                public.pedidos_licenca, public.esg_votos, public.cupons, public.cupom_usos, public.plays, public.compartilhamentos
  to authenticated;
grant update (lida) on public.notificacoes to authenticated;

-- ------------------------------------------------------------ funções: nada é executável por padrão
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema privado from public, anon, authenticated;

grant execute on function public.is_admin(), public.palco_estado(), public.musica_publica(uuid), public.mundo_publico(text),
  public.esg_painel(), public.registrar_play(uuid, text) to anon, authenticated;

grant execute on function
  public.meu_perfil(), public.meu_progresso(), public.meu_mundo(), public.atualizar_perfil(text, text),
  public.escolher_mundo(public.mundo), public.aplicar_convite(text), public.marcar_notificacoes_lidas(),
  public.validar_cupom(text, int), public.criar_pedido(int, text),
  public.criar_musica(text, text, text, boolean, text, text, text, boolean), public.minha_criacao(uuid),
  public.definir_palco(uuid, boolean), public.registrar_compartilhamento(uuid, text), public.comprar_item(text),
  public.enviar_projeto_esg(text, text, text, text), public.votar_esg(uuid), public.pedir_licenca(uuid, text, text, text),
  public.admin_resumo(int), public.admin_criar_cupom(text, int, int, timestamptz, text, boolean), public.admin_cupom_ativo(text, boolean),
  public.admin_moderar(uuid, text), public.admin_esg_status(uuid, public.status_esg), public.admin_creditos(uuid, int, text),
  public.admin_marcar_pago(uuid), public.admin_role(uuid, text), public.admin_config(text, jsonb), public.admin_pacote(int, int, boolean),
  public.admin_usuarios(text, int), public.admin_licenca_status(uuid, text)
  to authenticated;

grant execute on function public.cron_confere(text), public.pagamento_confirmado(uuid, text), public.expirar_pedidos(),
  public.palco_manter(), public.worker_pegar(int), public.worker_iniciada(uuid, text, text, text), public.worker_aguardar(uuid),
  public.worker_finalizar(uuid, jsonb, text, jsonb), public.worker_falhar(uuid, text, boolean, boolean)
  to service_role;

-- ------------------------------------------------------------ storage: áudio privado, sem link público
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('faixas', 'faixas', false, 26214400, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/ogg'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy faixas_ouvir on storage.objects for select to anon, authenticated using (
  bucket_id = 'faixas' and exists (
    select 1 from public.faixas f join public.criacoes c on c.id = f.criacao_id
     where f.storage_path = storage.objects.name
       and (c.publico = 'publica' or c.user_id = (select auth.uid()) or (select public.is_admin()))));
