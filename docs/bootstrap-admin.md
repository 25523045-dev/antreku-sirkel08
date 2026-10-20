# Bootstrap Admin Pertama — AntreKu SIRKEL-08 (Fase 0)

## Prasyarat Fase 1 (wajib sebelum aplikasi dipakai)

1. **Jalankan migrasi `0001_schema.sql`** di SQL Editor sampai sukses
   (sudah terverifikasi: tabel, seed, view `public_board`, RLS, RPC
   `ambil_nomor`/`ubah_status` aktif).
2. **Jalankan migrasi `supabase/migrations/0002_profile_trigger.sql`**
   di SQL Editor sebagai pemilik proyek (memasang trigger
   `on_auth_user_created` di `auth.users` + RPC `panggil_ulang`).
   Idempoten — aman dijalankan ulang.
3. **Aktifkan Anonymous sign-ins** (alur pengunjung tanpa password):
   Dashboard → Authentication → Sign In / Up → centang
   “Allow anonymous sign-ins” → Save.
4. Lanjut ke Langkah 1 di bawah untuk akun admin pertama.

Prosedur ini membuat **satu akun admin pertama** tanpa menaruh password
atau secret apa pun di kode, env, maupun repo. Hanya **pemilik proyek
Supabase** yang dapat melakukannya.

> Prasyarat: migrasi `supabase/migrations/0001_schema.sql` sudah dijalankan
> di SQL Editor dan berakhir sukses.

## Langkah 1 — Buat user di Dashboard Supabase

1. Buka proyek Anda di Supabase Dashboard.
2. Masuk ke **Authentication → Users → Add user → Create new user**.
3. Isi email admin (milik Anda sendiri) dan password kuat yang dibuat saat itu juga.
4. Centang **Auto Confirm user** agar langsung aktif.
5. Klik Create. Catat **UID** user tersebut (kolom UID di daftar Users).

Password ini hanya ada di Auth Supabase + ingatan Anda. Tidak ditulis ke file mana pun.

## Langkah 2 — Angkat menjadi admin via SQL

Di **SQL Editor** (sebagai pemilik proyek), jalankan — ganti UID dengan milik Anda:

```sql
insert into public.profiles (user_id, role, nama)
values ('PASTE-UID-ADMIN-DISINI', 'admin', 'Admin Utama')
on conflict (user_id) do update
  set role = 'admin', nama = excluded.nama;
```

Verifikasi (harus tepat 1 baris milik Anda):

```sql
select user_id, role, nama from public.profiles where role = 'admin';
```

## Langkah 3 — Uji login (setelah Fase 1 selesai)

1. Isi `.env.local` (lihat `.env.example`), restart dev server.
2. Buka `/admin/login`, masuk dengan email + password Langkah 1.
3. Dashboard harus menampilkan data dari database. Bila gagal, cek:
   - env terbaca (restart setelah mengisi `.env.local`),
   - baris `profiles` role admin ada untuk UID yang login (cek UID di
     Dashboard → Authentication → Users).

## Aturan keamanan yang berlaku seterusnya

- **Jangan** membuat akun `admin/admin123` di database — kredensial demo lama
  dihapus pada Fase 1 dan tidak boleh dihidupkan kembali.
- **Jangan** membagikan service-role key kepada siapa pun / menaruhnya di env
  klien. Prosedur ini tidak membutuhkannya sama sekali.
- Penambahan admin berikutnya dilakukan **oleh admin yang sudah ada**
  (fitur Fase 1+) atau oleh pemilik proyek via prosedur yang sama.
- Bila akun admin disusupi: ganti password via Dashboard
  (Authentication → Users → … → Reset password) lalu audit
  `ticket_events` untuk perubahan mencurigakan.
