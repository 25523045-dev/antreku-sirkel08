"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buatSupabaseBrowser } from "@/lib/supabase/client";

let browser: SupabaseClient | null = null;

/** Singleton klien browser (dibuat lazy agar impor modul tetap aman saat SSR). */
export function supabaseBrowser(): SupabaseClient {
  if (!browser) browser = buatSupabaseBrowser() as unknown as SupabaseClient;
  return browser;
}

export function pesanGalat(e: unknown): string {
  if (!e) return "Terjadi gangguan. Silakan coba lagi.";
  if (typeof e === "string") return e;
  if (e instanceof Error && !("code" in e)) return e.message;
  const err = e as { code?: string; message?: string };
  if (err.code === "23505") return "Data sudah digunakan. Gunakan nilai lain.";
  if (err.code === "23503") return "Data masih dipakai di tempat lain sehingga tidak dapat dihapus/diubah.";
  if (err.code === "42501") return "Anda tidak punya izin untuk aksi ini.";
  if (err.code === "PGRST116") return "Data tidak ditemukan.";
  if (err.message) return err.message;
  return "Terjadi gangguan. Silakan coba lagi.";
}
