begin;

-- ═══════════════ TABEL ═══════════════

-- Profil: 1 baris per user auth (admin maupun pengunjung anonim).
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'pengunjung'
    check (role in ('admin', 'pengunjung')),
  nama text not null default 'Pengunjung'
    check (char_length(nama) between 1 and 60),
  dibuat_pada timestamptz not null default now()
);

-- Layanan.
create table if not exists public.services (
  id text primary key,
  kode text not null unique check (kode ~ '^[A-Z]{2,4}$'),
  prefix text not null unique check (prefix ~ '^[A-Z]$'),
  nama text not null check (char_length(nama) between 4 and 80),
  deskripsi text not null default '',
  estimasi_menit int not null default 5
    check (estimasi_menit between 1 and 120),
  aktif boolean not null default true
);

-- Loket.
create table if not exists public.counters (
  id text primary key,
  nama text not null,
  aktif boolean not null default true,
  sedang_melayani_ticket_id uuid
);

-- Tiket antrean.
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  service_id text not null
    references public.services (id) on delete restrict,
  tanggal date not null,
  nomor text not null,
  owner_id uuid references auth.users (id) on delete set null,
  nama_pengunjung text not null
    check (char_length(nama_pengunjung) between 3 and 60),
  status text not null default 'menunggu'
    check (
      status in (
        'menunggu',
        'dipanggil',
        'dilayani',
        'selesai',
        'dilewati',
        'dibatalkan'
      )
    ),
  diambil_pada timestamptz not null default now(),
  dipanggil_pada timestamptz,
  mulai_pada timestamptz,
  selesai_pada timestamptz,
  loket_id text references public.counters (id) on delete set null,
  petugas text,
  unique (service_id, tanggal, nomor)
);

-- FK loket → tiket sedang dilayani.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'counters_sedang_melayani_fk'
  ) then
    alter table public.counters
      add constraint counters_sedang_melayani_fk
      foreign key (sedang_melayani_ticket_id)
      references public.tickets (id) on delete set null;
  end if;
end $$;

-- Relasi loket ↔ layanan.
create table if not exists public.counter_services (
  counter_id text not null
    references public.counters (id) on delete cascade,
  service_id text not null
    references public.services (id) on delete cascade,
  primary key (counter_id, service_id)
);

-- Petugas operasional.
create table if not exists public.staff (
  id text primary key,
  nama text not null check (char_length(nama) between 3 and 60),
  username text not null unique
    check (username ~ '^[a-z0-9.]{3,30}$'),
  peran text not null default 'petugas'
    check (peran in ('admin', 'petugas')),
  loket_id text references public.counters (id) on delete set null,
  aktif boolean not null default true
);

-- Riwayat perubahan status.
create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null
    references public.tickets (id) on delete cascade,
  dari text,
  ke text not null,
  aktor uuid references auth.users (id) on delete set null,
  waktu timestamptz not null default now(),
  catatan text
);

-- Counter atomik nomor harian.
create table if not exists public.counters_harian (
  service_id text not null
    references public.services (id) on delete cascade,
  tanggal date not null,
  terakhir int not null default 0 check (terakhir >= 0),
  primary key (service_id, tanggal)
);

-- Pengaturan aplikasi.
create table if not exists public.app_settings (
  id int primary key check (id = 1),
  nama_instansi text not null
    default 'Pusat Layanan Kampus SIRKEL-08',
  nama_aplikasi text not null default 'AntreKu',
  jam_buka text not null default '08:00',
  jam_tutup text not null default '16:00',
  awalan_nomor text not null
    default 'Tanggal + prefix layanan (mis. A-007)',
  reset_harian boolean not null default true,
  tampilkan_estimasi boolean not null default true,
  tampilkan_riwayat_display boolean not null default true,
  suara_panggilan boolean not null default true,
  diperbarui_pada timestamptz not null default now()
);

-- ═══════════════ INDEX ═══════════════

create index if not exists tickets_service_tanggal_status_idx
  on public.tickets (service_id, tanggal, status);

create index if not exists tickets_owner_tanggal_idx
  on public.tickets (owner_id, tanggal);

create index if not exists tickets_status_dipanggil_idx
  on public.tickets (status, dipanggil_pada);

create index if not exists ticket_events_ticket_waktu_idx
  on public.ticket_events (ticket_id, waktu desc);

-- ═══════════════ ROW LEVEL SECURITY ═══════════════
-- Fungsi dibuat setelah tabel profiles tersedia.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

-- Aktifkan RLS pada semua tabel.

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.counters enable row level security;
alter table public.counter_services enable row level security;
alter table public.staff enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_events enable row level security;
alter table public.counters_harian enable row level security;
alter table public.app_settings enable row level security;

-- ═══════════════ POLICY PROFILES ═══════════════

drop policy if exists profiles_select on public.profiles;

create policy profiles_select
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert on public.profiles;

create policy profiles_insert
  on public.profiles
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'pengunjung'
  );

drop policy if exists profiles_update on public.profiles;

create policy profiles_update
  on public.profiles
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
  )
  with check (
    role = 'pengunjung'
    or public.is_admin()
  );

-- ═══════════════ POLICY SERVICES ═══════════════

drop policy if exists services_select on public.services;

create policy services_select
  on public.services
  for select
  to anon, authenticated
  using (true);

drop policy if exists services_write on public.services;

create policy services_write
  on public.services
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════ POLICY COUNTERS ═══════════════

drop policy if exists counters_select on public.counters;

create policy counters_select
  on public.counters
  for select
  to anon, authenticated
  using (true);

drop policy if exists counters_write on public.counters;

create policy counters_write
  on public.counters
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════ POLICY COUNTER SERVICES ═══════════════

drop policy if exists counter_services_select
  on public.counter_services;

create policy counter_services_select
  on public.counter_services
  for select
  to anon, authenticated
  using (true);

drop policy if exists counter_services_write
  on public.counter_services;

create policy counter_services_write
  on public.counter_services
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════ POLICY STAFF ═══════════════

drop policy if exists staff_select on public.staff;

create policy staff_select
  on public.staff
  for select
  to anon, authenticated
  using (true);

drop policy if exists staff_write on public.staff;

create policy staff_write
  on public.staff
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════ POLICY SETTINGS ═══════════════

drop policy if exists settings_select on public.app_settings;

create policy settings_select
  on public.app_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists settings_write on public.app_settings;

create policy settings_write
  on public.app_settings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════ POLICY TICKETS ═══════════════

drop policy if exists tickets_select on public.tickets;

create policy tickets_select
  on public.tickets
  for select
  to authenticated
  using (
    public.is_admin()
    or owner_id = auth.uid()
  );

-- ═══════════════ POLICY TICKET EVENTS ═══════════════

drop policy if exists events_select on public.ticket_events;

create policy events_select
  on public.ticket_events
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.tickets t
      where t.id = ticket_id
        and t.owner_id = auth.uid()
    )
  );

-- counters_harian tidak memiliki policy langsung.
-- Hanya RPC SECURITY DEFINER yang mengaksesnya.

-- ═══════════════ GRANT ═══════════════

grant usage on schema public to anon, authenticated;

grant select on
  public.services,
  public.counters,
  public.counter_services,
  public.staff,
  public.app_settings
to anon, authenticated;

grant insert, update, delete on
  public.services,
  public.counters,
  public.counter_services,
  public.staff,
  public.app_settings
to authenticated;

grant select, insert, update
  on public.profiles
  to authenticated;

grant select on
  public.tickets,
  public.ticket_events
to authenticated;

-- ═══════════════ VIEW PAPAN PUBLIK ═══════════════
-- Nama pengunjung tidak diekspos melalui view ini.

create or replace view public.public_board
with (security_invoker = false) as
select
  t.nomor,
  t.service_id,
  s.nama as layanan,
  s.prefix,
  t.status,
  t.tanggal,
  t.loket_id,
  c.nama as loket,
  t.diambil_pada,
  t.dipanggil_pada
from public.tickets t
join public.services s
  on s.id = t.service_id
left join public.counters c
  on c.id = t.loket_id
where t.status in ('menunggu', 'dipanggil', 'dilayani')
order by t.diambil_pada asc, t.nomor asc;

grant select on public.public_board to anon, authenticated;

-- ═══════════════ SUPABASE REALTIME ═══════════════

do $$
declare
  t text;
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    raise notice
      'AntreKu: publication supabase_realtime tidak ditemukan. Pendaftaran Realtime dilewati.';
    return;
  end if;

  foreach t in array array[
    'tickets',
    'counters',
    'ticket_events'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;

-- ═══════════════ RPC ═══════════════

-- ── ambil_nomor: penerbitan tiket atomik ─────────────────────────────────────

create or replace function public.ambil_nomor(
  p_service_id text,
  p_nama text
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prefix text;
  v_tanggal date;
  v_urut int;
  v_nomor text;
  v_nama text := btrim(p_nama);
  v_tiket public.tickets;
begin
  if v_uid is null then
    raise exception
      'Masuk terlebih dahulu sebelum mengambil nomor.'
      using errcode = '28000';
  end if;

  if char_length(v_nama) < 3
    or char_length(v_nama) > 60 then
    raise exception
      'Nama pengunjung 3–60 karakter.'
      using errcode = '22001';
  end if;

  select s.prefix
    into v_prefix
  from public.services s
  where s.id = p_service_id
    and s.aktif;

  if not found then
    raise exception
      'Layanan tidak tersedia atau nonaktif.'
      using errcode = '02000';
  end if;

  v_tanggal :=
    (now() at time zone 'Asia/Jakarta')::date;

  perform pg_advisory_xact_lock(
    hashtext(
      'antreku:' || p_service_id || ':' || v_tanggal::text
    )
  );

  insert into public.counters_harian (
    service_id,
    tanggal,
    terakhir
  )
  values (
    p_service_id,
    v_tanggal,
    0
  )
  on conflict (service_id, tanggal) do nothing;

  update public.counters_harian
  set terakhir = terakhir + 1
  where service_id = p_service_id
    and tanggal = v_tanggal
  returning terakhir into v_urut;

  v_nomor :=
    v_prefix || '-' || lpad(v_urut::text, 3, '0');

  insert into public.tickets (
    service_id,
    tanggal,
    nomor,
    owner_id,
    nama_pengunjung,
    status
  )
  values (
    p_service_id,
    v_tanggal,
    v_nomor,
    v_uid,
    v_nama,
    'menunggu'
  )
  returning * into v_tiket;

  insert into public.ticket_events (
    ticket_id,
    dari,
    ke,
    aktor
  )
  values (
    v_tiket.id,
    null,
    'menunggu',
    v_uid
  );

  return v_tiket;
end;
$$;

-- ── ubah_status: admin saja, dengan validasi transisi ────────────────────────

create or replace function public.ubah_status(
  p_ticket_id uuid,
  p_status_baru text,
  p_loket_id text default null
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lama text;
  v_service text;
  v_loket text;
  v_ok boolean := false;
  v_tiket public.tickets;
begin
  if not public.is_admin() then
    raise exception
      'Hanya admin yang dapat mengubah status.'
      using errcode = '42501';
  end if;

  select status, service_id, loket_id
    into v_lama, v_service, v_loket
  from public.tickets
  where id = p_ticket_id;

  if not found then
    raise exception
      'Tiket tidak ditemukan.'
      using errcode = '02000';
  end if;

  v_ok := case v_lama
    when 'menunggu' then
      p_status_baru in ('dipanggil', 'dibatalkan')
    when 'dipanggil' then
      p_status_baru in (
        'dilayani',
        'dilewati',
        'dibatalkan',
        'menunggu'
      )
    when 'dilayani' then
      p_status_baru in ('selesai', 'dibatalkan')
    when 'dilewati' then
      p_status_baru in ('dipanggil', 'dibatalkan')
    else false
  end;

  if not v_ok then
    raise exception
      'Transisi % → % tidak diizinkan.',
      v_lama,
      p_status_baru
      using errcode = '23514';
  end if;

  -- Loket tujuan saat tiket dipanggil.
  if p_status_baru = 'dipanggil' then
    if p_loket_id is null then
      select cs.counter_id
        into p_loket_id
      from public.counter_services cs
      join public.counters c
        on c.id = cs.counter_id
      where cs.service_id = v_service
        and c.aktif
      order by cs.counter_id asc
      limit 1;
    else
      if not exists (
        select 1
        from public.counters c
        join public.counter_services cs
          on cs.counter_id = c.id
        where c.id = p_loket_id
          and c.aktif
          and cs.service_id = v_service
      ) then
        raise exception
          'Loket tidak aktif atau tidak melayani layanan ini.'
          using errcode = '23514';
      end if;
    end if;

    if p_loket_id is null then
      raise exception
        'Tidak ada loket aktif untuk layanan ini.'
        using errcode = '23514';
    end if;
  end if;

  update public.tickets t
  set
    status = p_status_baru,
    loket_id = case
      when p_status_baru = 'dipanggil'
        then p_loket_id
      when p_status_baru = 'menunggu'
        then null
      else t.loket_id
    end,
    dipanggil_pada = case
      when p_status_baru = 'dipanggil'
        then now()
      when p_status_baru = 'menunggu'
        then null
      else t.dipanggil_pada
    end,
    mulai_pada = case
      when p_status_baru = 'dilayani'
        then now()
      else t.mulai_pada
    end,
    selesai_pada = case
      when p_status_baru = 'selesai'
        then now()
      else t.selesai_pada
    end
  where t.id = p_ticket_id
  returning * into v_tiket;

  -- Sinkronkan penanda loket.
  if p_status_baru in ('dipanggil', 'dilayani')
    and v_tiket.loket_id is not null then
    update public.counters
    set sedang_melayani_ticket_id = v_tiket.id
    where id = v_tiket.loket_id;
  else
    update public.counters
    set sedang_melayani_ticket_id = null
    where sedang_melayani_ticket_id = v_tiket.id;
  end if;

  insert into public.ticket_events (
    ticket_id,
    dari,
    ke,
    aktor
  )
  values (
    v_tiket.id,
    v_lama,
    p_status_baru,
    v_uid
  );

  return v_tiket;
end;
$$;

-- ═══════════════ HAK EKSEKUSI RPC ═══════════════

revoke all
  on function public.is_admin()
  from public, anon;

revoke all
  on function public.ambil_nomor(text, text)
  from public, anon;

revoke all
  on function public.ubah_status(uuid, text, text)
  from public, anon;

grant execute
  on function public.is_admin()
  to authenticated;

grant execute
  on function public.ambil_nomor(text, text)
  to authenticated;

grant execute
  on function public.ubah_status(uuid, text, text)
  to authenticated;

-- ═══════════════ SEED IDEMPOTEN ═══════════════

-- Layanan demo.

insert into public.services (
  id,
  kode,
  prefix,
  nama,
  deskripsi,
  estimasi_menit,
  aktif
)
values
  (
    'lay-akademik',
    'AKD',
    'A',
    'Administrasi Akademik',
    'Legalisir, surat keterangan aktif kuliah, dan transkrip.',
    8,
    true
  ),
  (
    'lay-keuangan',
    'KEU',
    'B',
    'Layanan Keuangan',
    'Pembayaran UKT, denda, dan pengajuan keringanan.',
    6,
    true
  ),
  (
    'lay-kemahasiswaan',
    'KMH',
    'C',
    'Kemahasiswaan',
    'Beasiswa, organisasi mahasiswa, dan layanan konseling.',
    10,
    true
  ),
  (
    'lay-umum',
    'UMM',
    'D',
    'Layanan Umum',
    'Informasi umum, lost & found, dan surat menyurat.',
    5,
    false
  )
on conflict (id) do nothing;

-- Loket demo.

insert into public.counters (
  id,
  nama,
  aktif
)
values
  ('loket-1', 'Loket 1', true),
  ('loket-2', 'Loket 2', true),
  ('loket-3', 'Loket 3', true),
  ('loket-4', 'Loket 4', false)
on conflict (id) do nothing;

-- Relasi loket dengan layanan.

insert into public.counter_services (
  counter_id,
  service_id
)
values
  ('loket-1', 'lay-akademik'),
  ('loket-1', 'lay-umum'),
  ('loket-2', 'lay-keuangan'),
  ('loket-3', 'lay-kemahasiswaan'),
  ('loket-4', 'lay-akademik'),
  ('loket-4', 'lay-keuangan'),
  ('loket-4', 'lay-kemahasiswaan')
on conflict do nothing;

-- Petugas demo.

insert into public.staff (
  id,
  nama,
  username,
  peran,
  loket_id,
  aktif
)
values
  ('st-1', 'Admin Utama', 'admin', 'admin', null, true),
  ('st-2', 'Sari Puspita', 'sari.p', 'petugas', 'loket-1', true),
  ('st-3', 'Budi Hartono', 'budi.h', 'petugas', 'loket-2', true),
  ('st-4', 'Dewi Anggraini', 'dewi.a', 'petugas', 'loket-3', true),
  ('st-5', 'Agus Nonaktif', 'agus.n', 'petugas', null, false)
on conflict (id) do nothing;

-- Tiket demo tanggal 2026-10-14.

insert into public.tickets (
  service_id,
  tanggal,
  nomor,
  owner_id,
  nama_pengunjung,
  status,
  diambil_pada,
  dipanggil_pada,
  mulai_pada,
  selesai_pada,
  loket_id,
  petugas
)
values
  (
    'lay-akademik',
    '2026-10-14',
    'A-001',
    null,
    'Nadia Rahma',
    'selesai',
    '2026-10-14T08:02:00+07:00',
    '2026-10-14T08:10:00+07:00',
    '2026-10-14T08:11:00+07:00',
    '2026-10-14T08:19:00+07:00',
    'loket-1',
    'Sari Puspita'
  ),
  (
    'lay-akademik',
    '2026-10-14',
    'A-002',
    null,
    'Rizky Pratama',
    'selesai',
    '2026-10-14T08:05:00+07:00',
    '2026-10-14T08:20:00+07:00',
    '2026-10-14T08:21:00+07:00',
    '2026-10-14T08:29:00+07:00',
    'loket-1',
    'Sari Puspita'
  ),
  (
    'lay-keuangan',
    '2026-10-14',
    'B-001',
    null,
    'Intan Permata',
    'selesai',
    '2026-10-14T08:07:00+07:00',
    '2026-10-14T08:15:00+07:00',
    '2026-10-14T08:16:00+07:00',
    '2026-10-14T08:22:00+07:00',
    'loket-2',
    'Budi Hartono'
  ),
  (
    'lay-akademik',
    '2026-10-14',
    'A-003',
    null,
    'Fajar Nugroho',
    'dilewati',
    '2026-10-14T08:12:00+07:00',
    '2026-10-14T08:31:00+07:00',
    null,
    null,
    'loket-1',
    'Sari Puspita'
  ),
  (
    'lay-akademik',
    '2026-10-14',
    'A-004',
    null,
    'Putri Ayu',
    'dilayani',
    '2026-10-14T08:20:00+07:00',
    '2026-10-14T08:35:00+07:00',
    '2026-10-14T08:36:00+07:00',
    null,
    'loket-1',
    'Sari Puspita'
  ),
  (
    'lay-keuangan',
    '2026-10-14',
    'B-002',
    null,
    'Hendra Gunawan',
    'dipanggil',
    '2026-10-14T08:25:00+07:00',
    '2026-10-14T08:40:00+07:00',
    null,
    null,
    'loket-2',
    'Budi Hartono'
  ),
  (
    'lay-kemahasiswaan',
    '2026-10-14',
    'C-001',
    null,
    'Lestari Wulandari',
    'menunggu',
    '2026-10-14T08:33:00+07:00',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'lay-akademik',
    '2026-10-14',
    'A-005',
    null,
    'Dimas Saputra',
    'menunggu',
    '2026-10-14T08:38:00+07:00',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'lay-keuangan',
    '2026-10-14',
    'B-003',
    null,
    'Mega Lestari',
    'menunggu',
    '2026-10-14T08:44:00+07:00',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'lay-kemahasiswaan',
    '2026-10-14',
    'C-002',
    null,
    'Yoga Firmansyah',
    'menunggu',
    '2026-10-14T08:51:00+07:00',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'lay-akademik',
    '2026-10-14',
    'A-006',
    null,
    'Tania Kusuma',
    'menunggu',
    '2026-10-14T08:57:00+07:00',
    null,
    null,
    null,
    null,
    null
  ),
  (
    'lay-keuangan',
    '2026-10-14',
    'B-004',
    null,
    'Rudi Santoso',
    'dibatalkan',
    '2026-10-14T09:02:00+07:00',
    null,
    null,
    null,
    null,
    null
  )
on conflict (service_id, tanggal, nomor) do nothing;

-- Selaraskan counter harian demo.

insert into public.counters_harian (
  service_id,
  tanggal,
  terakhir
)
select
  service_id,
  tanggal,
  count(*)
from public.tickets
group by service_id, tanggal
on conflict (service_id, tanggal) do update
set terakhir = greatest(
  public.counters_harian.terakhir,
  excluded.terakhir
);

-- Penanda loket demo, hanya jika masih kosong.

update public.counters
set sedang_melayani_ticket_id = (
  select id
  from public.tickets
  where nomor = 'A-004'
  limit 1
)
where id = 'loket-1'
  and sedang_melayani_ticket_id is null;

update public.counters
set sedang_melayani_ticket_id = (
  select id
  from public.tickets
  where nomor = 'B-002'
  limit 1
)
where id = 'loket-2'
  and sedang_melayani_ticket_id is null;

-- Pengaturan awal, tidak menimpa pengaturan yang sudah ada.

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

commit;