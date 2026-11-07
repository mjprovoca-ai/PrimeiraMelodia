-- Primeira Melodia V2 · limite de cadastros por IP (usado pela Edge Function "conta")
create or replace function public.cadastro_permitido(p_ip text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_n int;
begin
  select count(*) into v_n from privado.cadastros c where c.ip = p_ip and c.created_at > now() - interval '1 hour';
  if v_n >= 8 then
    return false;
  end if;
  insert into privado.cadastros (ip) values (p_ip);
  return true;
end $$;

revoke execute on function public.cadastro_permitido(text) from public, anon, authenticated;
grant execute on function public.cadastro_permitido(text) to service_role;
