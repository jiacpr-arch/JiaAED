begin;
create table public.aed_ads_receipts (
  receipt uuid primary key,
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);
create table public.aed_ads_delivery (
  session_id text primary key,
  receipt uuid not null references public.aed_ads_receipts,
  campaign text,
  oppref text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  attempts integer not null default 0,
  lease uuid,
  lease_until timestamptz
);
create index on public.aed_ads_delivery(receipt);
create index on public.aed_ads_receipts(created_at);
create index on public.aed_ads_delivery(created_at) where oppref is not null;
alter table public.aed_ads_receipts enable row level security;
alter table public.aed_ads_delivery enable row level security;
revoke all on public.aed_ads_receipts, public.aed_ads_delivery from public, anon, authenticated;
grant select, insert, update on public.aed_ads_receipts, public.aed_ads_delivery to service_role;

grant delete on public.aed_ads_receipts to service_role;

-- All clients use the service role. A revocation always wins over a late bind.
create function public.aed_ads_delivery_op(op text, payload jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  sid text := payload->>'session';
  token uuid := (payload->>'receipt')::uuid;
  row_data public.aed_ads_delivery;
  denied boolean;
begin
  if op='cleanup' then
    update public.aed_ads_delivery set oppref=null where oppref is not null and created_at < now()-interval '2 days';
    delete from public.aed_ads_receipts r where r.created_at < now()-interval '31 days'
      and not exists(select 1 from public.aed_ads_delivery d where d.receipt=r.receipt);
    return '{}';
  end if;
  if op='register' then
    insert into public.aed_ads_receipts(receipt) values(token) on conflict do nothing;
    return '{}';
  end if;
  if op='revoke' then
    -- Withdrawal from another tab may arrive before the checkout registers.
    -- Keep a short-lived tombstone even in this order; register never re-grants it.
    insert into public.aed_ads_receipts(receipt,revoked) values(token,true)
    on conflict(receipt) do update set revoked=true;
    update public.aed_ads_delivery set oppref=null,campaign=null where receipt=token;
    return '{}';
  end if;
  if op='bind' then
    select revoked into denied from public.aed_ads_receipts where receipt=token for update;
    if found and not denied then
      insert into public.aed_ads_delivery(session_id,receipt,campaign,oppref)
      values(sid,token,payload->>'campaign',payload->>'oppref') on conflict do nothing;
    end if;
    return '{}';
  end if;
  if op='claim' then
    select * into row_data from public.aed_ads_delivery where session_id=sid for update;
    if not found or row_data.accepted_at is not null then return '{"state":"skip"}'; end if;
    select revoked into denied from public.aed_ads_receipts where receipt=row_data.receipt;
    if denied then return '{"state":"skip"}'; end if;
    if row_data.lease_until > clock_timestamp() then return '{"state":"busy"}'; end if;
    update public.aed_ads_delivery set attempts=attempts+1,lease=gen_random_uuid(),
      lease_until=clock_timestamp()+interval '30 seconds' where session_id=sid returning * into row_data;
    return jsonb_build_object('state','send','lease',row_data.lease,'oppref',row_data.oppref);
  end if;
  if op='allowed' then
    return to_jsonb(exists(
      select 1 from public.aed_ads_delivery d join public.aed_ads_receipts r using(receipt)
      where d.session_id=sid and d.lease=(payload->>'lease')::uuid and not r.revoked
        and d.lease_until>clock_timestamp()
    ));
  end if;
  if op in ('accepted','failed') then
    update public.aed_ads_delivery set accepted_at=case when op='accepted' then clock_timestamp() else accepted_at end,
      oppref=case when op='accepted' then null else oppref end,lease=null,lease_until=null
      where session_id=sid and lease=(payload->>'lease')::uuid;
    return '{}';
  end if;
  raise exception 'Unknown delivery operation';
end $$;
revoke all on function public.aed_ads_delivery_op(text,jsonb) from public, anon, authenticated;
grant execute on function public.aed_ads_delivery_op(text,jsonb) to service_role;
create view public.aed_ads_daily with (security_invoker=true) as
select (p.paid_at at time zone 'Asia/Bangkok')::date as paid_day,
       count(*) as paid_sessions,
       sum(p.total_thb) as paid_thb,
       coalesce(sum(p.total_thb) filter(where d.accepted_at is not null),0) as api_accepted_thb,
       count(d.session_id) as bound_at_checkout,
       count(*) filter (where r.revoked) as revoked_receipts,
       count(*) filter (where d.attempts>0) as attempted,
       count(d.accepted_at) as api_accepted,
       count(*) filter (where d.attempts>0 and d.accepted_at is null and not r.revoked) as awaiting_acceptance,
       count(*) filter (where d.campaign is not null) as known_campaign
from public.aed_orders p
left join public.aed_ads_delivery d on d.session_id=p.stripe_session_id
left join public.aed_ads_receipts r using(receipt)
where p.stripe_session_id like 'cs\_live\_%' and p.paid_at is not null and p.status='paid'
group by 1;
revoke all on public.aed_ads_daily from public, anon, authenticated;
grant select on public.aed_ads_daily to service_role;
commit;
