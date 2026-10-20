/**
 * Pembaca konfigurasi Supabase terpusat (Fase 0 — fondasi).
 *
 * - Hanya membaca ANON key (kunci publik untuk klien). Service-role key
 *   TIDAK PERNAH dibaca di sini dan tidak boleh ada di `.env.local`.
 * - Validasi dilakukan LAZY (saat factory dipanggil, bukan saat modul
 *   diimpor) agar production build tetap lolos tanpa env terisi — halaman
 *   yang kelak memakai Supabase akan gagal dengan pesan jelas, bukan diam.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function bacaSupabaseEnv(): SupabaseEnv {
  const url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hilang: string[] = [];
  if (!url) hilang.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) hilang.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error(
      `Konfigurasi Supabase belum lengkap (${hilang.join(", ")}). ` +
        `Salin .env.example menjadi .env.local dan isi nilainya, lalu restart dev server. ` +
        `Lihat docs/bootstrap-admin.md.`,
    );
  }
  return { url, anonKey };
}
