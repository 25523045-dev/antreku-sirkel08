import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { bacaSupabaseEnv } from "@/lib/supabase/env";

/**
 * Klien Supabase sisi server (Fase 0 — fondasi, BELUM dipakai halaman mana pun).
 *
 * Pola resmi `@supabase/ssr` untuk Next.js App Router: sesi dibaca/ditulis
 * lewat cookie store `next/headers`, sehingga Server Component, Route
 * Handler, dan Server Action pada Fase 1+ dapat memverifikasi user (`getUser`)
 * tanpa memercayai cookie buatan klien.
 *
 * Keamanan: hanya anon key. Otorisasi tetap ditegakkan oleh RLS di database,
 * bukan oleh kode ini.
 */
export async function buatSupabaseServer() {
  const { url, anonKey } = bacaSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component (read-only): cookie hanya bisa
          // ditulis dari Route Handler/Server Action — abaikan dengan aman.
        }
      },
    },
  });
}
