"use client";

import { createBrowserClient } from "@supabase/ssr";
import { bacaSupabaseEnv } from "@/lib/supabase/env";

/**
 * Klien Supabase sisi browser (Fase 0 — fondasi, BELUM dipakai halaman mana pun).
 *
 * Dipakai oleh Client Component interaktif pada Fase 1+ (login/logout,
 * Realtime display/lacak). Sesi disimpan di cookie HttpOnly bawaan
 * `@supabase/ssr` sehingga terbaca juga oleh server (`server.ts`) dan
 * `proxy.ts` — menggantikan cookie penanda `antreku_admin`/`antreku_pengunjung`.
 *
 * Keamanan: hanya anon key (publik) yang dipakai di sini. Service-role key
 * dilarang masuk ke file ini atau ke bundle klien mana pun.
 */
export function buatSupabaseBrowser() {
  const { url, anonKey } = bacaSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
