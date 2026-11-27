-- The public Site calls a scoped Vercel endpoint. Only its service role can
-- use these functions/tables. Lead, internal event and LINE job commit together.
create table if not exists public.aed_rental_delivery_log (
  event_id uuid not null references public.aed_analytics_events(id) on delete cascade,
  destination text not null check (destination in ('ga4','google_ads','meta_browser','meta_capi','openai_pixel','line')),
  status text not null check (status in ('pending','queued','tag_callback','accepted','unconfirmed','failed','not_configured','no_consent')),
  detail integer,
  updated_at timestamptz not null default now(),
  primary key (event_id, destination)
);
create table if not exists public.aed_rental_line_outbox (
  event_id uuid primary key references public.aed_leads(id) on delete cascade,
  attempts integer not null default 0,
  next_at timestamptz not null default now(),
  lease uuid,
  sent_at timestamptz
);
alter table public.aed_rental_delivery_log enable row level security;
alter table public.aed_rental_line_outbox enable row level security;
revoke all on public.aed_rental_delivery_log, public.aed_rental_line_outbox from anon, authenticated;
grant select, insert, update on public.aed_rental_delivery_log, public.aed_rental_line_outbox to service_role;

create or replace function public.aed_save_rental_lead(p_id uuid, p jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  marketing boolean := coalesce((p->>'marketing')::boolean, false);
  analytics boolean := coalesce((p->>'analytics')::boolean, false);
  source_page constant text := 'https://aed.jia1669.com/rental';
begin
  insert into public.aed_leads (id, source, full_name, phone, company_name, product_id,
    message, unit_count, page_url, marketing_consent, gclid, fbclid, utm_source, utm_medium,
    utm_campaign, utm_term, utm_content, fbc, fbp, ga_client_id, ip_hash)
  values (p_id, 'mini_form', p->>'fullName', p->>'phone', p->>'company', 'yuwell-gps',
    p->>'message', p->>'unitCount', source_page, marketing,
    case when marketing then p->>'gclid' end, case when marketing then p->>'fbclid' end,
    case when marketing then p->'utm'->>'source' end, case when marketing then p->'utm'->>'medium' end,
    case when marketing then p->'utm'->>'campaign' end, case when marketing then p->'utm'->>'term' end,
    case when marketing then p->'utm'->>'content' end, case when marketing then p->>'fbc' end,
    case when marketing then p->>'fbp' end, case when marketing then p->>'gaClientId' end, p->>'ipHash')
  on conflict (id) do nothing;
  if not found then return false; end if;

  insert into public.aed_analytics_events (id, event_name, page_url, properties, gclid, utm_source, utm_campaign)
  values (p_id, 'lead_form_submit', source_page,
    jsonb_build_object('variant','y8_gps_rental','product_id','yuwell-gps','lead_id',p_id,'traffic','production'),
    case when marketing then p->>'gclid' end, case when marketing then p->'utm'->>'source' end,
    case when marketing then p->'utm'->>'campaign' end);
  insert into public.aed_rental_line_outbox (event_id) values (p_id);
  insert into public.aed_rental_delivery_log (event_id, destination, status)
  select p_id, target.destination, case when target.allowed then 'pending' else 'no_consent' end
    from (values ('ga4',analytics), ('google_ads',marketing), ('meta_browser',marketing),
      ('meta_capi',marketing), ('openai_pixel',marketing), ('line',true)) as target(destination,allowed);
  return true;
end;
$$;

create or replace function public.aed_claim_rental_line(p_id uuid default null)
returns table(event_id uuid, lease uuid, attempts integer)
language sql security invoker set search_path = '' as $$
  update public.aed_rental_line_outbox q
  set lease = gen_random_uuid(), next_at = now() + interval '2 minutes', attempts = q.attempts + 1
  where q.event_id in (
    select j.event_id from public.aed_rental_line_outbox j
    where j.sent_at is null and j.next_at <= now() and (p_id is null or j.event_id = p_id)
    order by j.next_at limit 5 for update skip locked
  )
  returning q.event_id, q.lease, q.attempts
$$;

create or replace function public.aed_finish_rental_line(p_id uuid, p_lease uuid, p_status text, p_http integer)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.aed_rental_line_outbox
  set lease = null, sent_at = case when p_status = 'accepted' then now() else null end,
    next_at = now() + make_interval(mins => least(360, 3 * (1 << least(attempts - 1, 7))))
  where event_id = p_id and lease = p_lease;
  if found then
    update public.aed_rental_delivery_log set status = p_status, detail = p_http, updated_at = now()
    where event_id = p_id and destination = 'line';
  end if;
end;
$$;

revoke all on function public.aed_save_rental_lead(uuid,jsonb), public.aed_claim_rental_line(uuid),
  public.aed_finish_rental_line(uuid,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.aed_save_rental_lead(uuid,jsonb), public.aed_claim_rental_line(uuid),
  public.aed_finish_rental_line(uuid,uuid,text,integer) to service_role;
