# Push-tilkynningar — uppsetning (einu sinni)

Web push fyrir stjórnendur og starfsmenn í appinu (PWA á heimaskjá).
Kóðinn er tilbúinn; þessi tvö skref þarf að gera handvirkt áður en þetta virkar.

## 1. Keyra SQL í Supabase (SQL Editor)

```sql
-- Tafla fyrir push-áskriftir. user_id er uuid = auth.uid()
-- (ATH: hér þarf EKKI ::text cast — það á bara við bookings.worker_id, sjá LOAD-BEARING.md)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Hver notandi sýslar aðeins með sínar eigin áskriftir.
-- Serverinn (service role key) fer framhjá RLS og les allt — það er rétt.
create policy "Own push subs select" on push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "Own push subs insert" on push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
create policy "Own push subs update" on push_subscriptions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Own push subs delete" on push_subscriptions
  for delete to authenticated using (user_id = auth.uid());
```

## 2. Bæta env-breytum við í Vercel (Settings → Environment Variables)

| Nafn | Gildi |
|------|-------|
| `VAPID_PUBLIC_KEY` | `BDq3Ik6xFerP9OoCFrO5GmmVoXEfikAV2u9DAhybiNn0kWbEHwIS2qVLYIU_fVvDReOmJBgk4awQEwJDjOn4fqE` |
| `VAPID_PRIVATE_KEY` | *(einkalykill — EKKI í repo-inu; Arnór fékk hann sér)* |
| `VAPID_SUBJECT` | `mailto:hreingaedi@hreingaedi.is` |

Svo **redeploy** (nýtt deploy tekur env-breytur inn).

## Hvernig þetta virkar

- `sw.js` — service worker sem tekur á móti push og sýnir tilkynningu; smellur opnar rétta síðu.
- `push.js` — deilt client-skjal (dashboard + worker): skráir sw, biður um leyfi (verður að gerast við smell — iOS-regla), vistar áskrift í `push_subscriptions`.
- `api/_push.js` — server-hjálpari (undirstrik = ekki endpoint). Les áskriftir með service-role og sendir. Gleypir allar villur: push má ALDREI fella email-sendingar. Ef VAPID-lyklana vantar gerir hann ekkert (öruggt að deploya á undan uppsetningu).
- `api/notify.js` — push fylgir sömu atburðum og emailin:
  - Ný bókun → allir admin/manager (`/dashboard.html?view=bookings`)
  - Ný fyrirspurn → allir admin/manager (`/dashboard.html?view=quotes`)
  - Úthlutun / afúthlutun → viðkomandi starfsmaður (`/worker.html`)
  - Afbókun → úthlutaður starfsmaður, ef einhver

## Að kveikja (hver notandi, einu sinni á hverju tæki)

1. iPhone: opna hreingaedi.is/dashboard.html (eða worker.html) í Safari → Deila → **Bæta á heimaskjá** (þarf iOS 16.4+). Push virkar aðeins úr heimaskjá-appinu á iPhone.
2. Opna appið af heimaskjánum, skrá sig inn.
3. Ýta á **bjölluna** (dashboard: efst til hægri eða undir Meira; worker: efst) og samþykkja leyfið.

## Prófun eftir uppsetningu

1. Kveikja á tilkynningum sem admin á símanum.
2. Gera prufubókun á /booking.html → push "Ný bókun" á að birtast.
3. Úthluta prufustarfsmanni verki → push "Nýtt verkefni" hjá starfsmanninum.
4. Afbóka verkið → push "Verkefni afbókað" hjá starfsmanninum.
5. Eyða prufugögnum.
