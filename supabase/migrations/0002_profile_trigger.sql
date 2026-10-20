begin;

-- ═══════════════ 0002 · Profil otomatis + RPC panggil ulang ═══════════════
-- Prasyarat: 0001_schema.sql sudah dijalankan sukses.
-- Jalankan di SQL Editor sebagai pemilik proyek (butuh hak atas auth.users
-- untuk memasang trigger). Idempoten: aman dijalankan ulang.

-- ── Profil otomatis untuk setiap user auth baru (termasuk anonim) ──────────
-- Tanpa trigger ini, user yang baru mendaftar/masuk anonim tidak punya baris
-- profiles sehingga pemeriksaan peran selalu gagal.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, nama)
  values (new.id, 'pengunjung', 'Pengunjung')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── panggil_ulang: admin menyegarkan waktu panggil tanpa ubah status ────────
-- Transisi dipanggil → dipanggil tidak diizinkan ubah_status, sehingga butuh
-- RPC khusus. Mencatat event agar tetap teraudit di ticket_events.

create or replace function public.panggil_ulang(
  p_ticket_id uuid
)
returns public.tickets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tiket public.tickets;
begin
  if not public.is_admin() then
    raise exception
      'Hanya admin yang dapat memanggil ulang.'
      using errcode = '42501';
  end if;

  update public.tickets
  set dipanggil_pada = now()
  where id = p_ticket_id
    and status = 'dipanggil'
  returning * into v_tiket;

  if v_tiket.id is null then
    raise exception
      'Tiket tidak ditemukan atau tidak dalam status dipanggil.'
      using errcode = '02000';
  end if;

  insert into public.ticket_events (
    ticket_id,
    dari,
    ke,
    aktor
  )
  values (
    v_tiket.id,
    'dipanggil',
    'dipanggil',
    auth.uid()
  );

  return v_tiket;
end;
$$;

revoke all
  on function public.panggil_ulang(uuid)
  from public, anon;

grant execute
  on function public.panggil_ulang(uuid)
  to authenticated;

commit;
