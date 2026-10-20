"use client";

import { supabaseBrowser } from "@/lib/supabase/db";

/**
 * Lapisan autentikasi Supabase AntreKu (Fase 1 — menggantikan sesi demo).
 *
 * - Admin: email + password (Auth bawaan) + peran dari public.profiles.
 *   Akun admin pertama dibuat pemilik proyek via docs/bootstrap-admin.md.
 * - Pengunjung: sesi anonim (tanpa password). Wajib mengaktifkan
 *   "Allow anonymous sign-ins" di Dashboard → Authentication → Sign In/Up.
 *   Tiket yang diterbitkan RPC ambil_nomor terikat ke owner_id anonim ini.
 */

export type Peran = "admin" | "pengunjung";

export interface SesiSupabase {
  userId: string;
  email?: string | null;
  anonim: boolean;
  peran: Peran | null;
}

/** User aktif (null bila belum masuk). Tidak melempar bila env hilang. */
export async function ambilUser(): Promise<{ id: string; email?: string | null; anonim: boolean } | null> {
  try {
    const { data } = await supabaseBrowser().auth.getUser();
    const u = data.user;
    if (!u) return null;
    return { id: u.id, email: u.email ?? null, anonim: (u as { is_anonymous?: boolean }).is_anonymous === true };
  } catch {
    return null;
  }
}

/** Peran dari public.profiles (null bila belum ada baris / belum masuk). */
export async function peranSaya(): Promise<SesiSupabase | null> {
  const user = await ambilUser();
  if (!user) return null;
  try {
    const { data } = await supabaseBrowser()
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    const role = (data as { role?: string } | null)?.role;
    const peran: Peran | null = role === "admin" ? "admin" : role === "pengunjung" ? "pengunjung" : null;
    return { userId: user.id, email: user.email, anonim: user.anonim, peran };
  } catch {
    return { userId: user.id, email: user.email, anonim: user.anonim, peran: null };
  }
}

/** Pastikan ada sesi (anonim bila belum masuk). Dipakai alur pengunjung. */
export async function pastikanSesiPengunjung(): Promise<string> {
  const ada = await ambilUser();
  if (ada) return ada.id;
  const sb = supabaseBrowser();
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(
      "Sesi anonim ditolak server. Aktifkan “Allow anonymous sign-ins” di Dashboard Supabase → Authentication → Sign In/Up, lalu coba lagi.",
    );
  }
  return data.user.id;
}

/** Masuk admin: verifikasi password + pastikan peran admin di profiles. */
export async function masukAdmin(email: string, password: string): Promise<SesiSupabase> {
  const sb = supabaseBrowser();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    throw new Error("Email atau password salah. Gunakan akun admin yang terdaftar di Supabase.");
  }
  const { data: profil } = await sb
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if ((profil as { role?: string } | null)?.role !== "admin") {
    await sb.auth.signOut();
    throw new Error("Akun ini bukan admin. Minta pemilik proyek mengangkatnya via docs/bootstrap-admin.md.");
  }
  return { userId: data.user.id, email: data.user.email ?? null, anonim: false, peran: "admin" };
}

/** Keluar: tutup sesi Supabase (admin maupun pengunjung anonim). */
export async function keluarSupabase(): Promise<void> {
  try {
    await supabaseBrowser().auth.signOut();
  } catch {
    /* abaikan — sesi dianggap berakhir */
  }
}
