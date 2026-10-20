"use client";

import { pastikanSesiPengunjung } from "@/lib/supabase/auth";
import { pesanGalat, supabaseBrowser } from "@/lib/supabase/db";
import {
  petaLayanan, petaLoket, petaPapan, petaPengaturan, petaPetugas, petaTiket,
  type BarisLayanan, type BarisLoket, type BarisPapan, type BarisPengaturan,
  type BarisPetugas, type BarisRelasiLoket, type BarisTiket,
} from "@/lib/supabase/mapper";
import { todayJakarta } from "@/lib/format";
import type { AppSettings, Counter, QueueStatus, QueueTicket, Service, Staff } from "@/lib/types";

/**
 * Kueri baca + mutasi Supabase (Fase 1). RLS menegakkan otorisasi:
 * baca publik (layanan/loket/papan/pengaturan) via anon, baca tiket penuh
 * hanya admin/pemilik, tulis status hanya via RPC SECURITY DEFINER.
 */

async function ambilatauLempar<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(pesanGalat(error));
  return (data ?? []) as T;
}

/* ── Baca publik ──────────────────────────────────── */
export async function fetchLayanan(): Promise<Service[]> {
  const rows = await ambilatauLempar<BarisLayanan[]>(
    supabaseBrowser().from("services").select("*").order("kode", { ascending: true }),
  );
  return rows.map(petaLayanan);
}

export async function fetchPapan(tanggal = todayJakarta()): Promise<QueueTicket[]> {
  const rows = await ambilatauLempar<BarisPapan[]>(
    supabaseBrowser().from("public_board").select("*").eq("tanggal", tanggal).order("diambil_pada", { ascending: true }).limit(300),
  );
  return rows.map(petaPapan);
}

export async function fetchPengaturan(): Promise<AppSettings> {
  const { data, error } = await supabaseBrowser().from("app_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) throw new Error(pesanGalat(error ?? "Pengaturan tidak ditemukan."));
  return petaPengaturan(data as BarisPengaturan);
}

export async function fetchPetugas(): Promise<Staff[]> {
  const rows = await ambilatauLempar<BarisPetugas[]>(
    supabaseBrowser().from("staff").select("*").order("nama", { ascending: true }),
  );
  return rows.map(petaPetugas);
}

export async function fetchLoket(): Promise<Counter[]> {
  const sb = supabaseBrowser();
  const [loket, relasi, petugas] = await Promise.all([
    ambilatauLempar<BarisLoket[]>(sb.from("counters").select("*").order("id", { ascending: true })),
    ambilatauLempar<BarisRelasiLoket[]>(sb.from("counter_services").select("counter_id,service_id")),
    fetchPetugas(),
  ]);
  // Petakan penanda sedang-melayani (uuid) ke nomor tiket.
  // Admin dapat membaca tickets; peran lain mendapat peta kosong (RLS) —
  // halaman publik tidak memakai field ini (hanya nama loket).
  const peta = new Map<string, string>();
  try {
    const semua = await ambilatauLempar<BarisTiket[]>(
      sb.from("tickets").select("*").eq("tanggal", todayJakarta()).limit(500),
    );
    for (const t of semua) peta.set(t.id, t.nomor);
  } catch {
    /* bukan admin — biarkan kosong */
  }
  return loket.map((l) => petaLoket(l, relasi, petugas, peta));
}

/* ── Baca terotentikasi ───────────────────────────── */
export async function fetchTiketAdmin(hariKeBelakang = 1): Promise<QueueTicket[]> {
  const sejak = new Date(`${todayJakarta()}T00:00:00+07:00`);
  sejak.setDate(sejak.getDate() - (hariKeBelakang - 1));
  const ymd = `${sejak.getFullYear()}-${String(sejak.getMonth() + 1).padStart(2, "0")}-${String(sejak.getDate()).padStart(2, "0")}`;
  const rows = await ambilatauLempar<BarisTiket[]>(
    supabaseBrowser().from("tickets").select("*").gte("tanggal", ymd).order("diambil_pada", { ascending: false }).limit(1000),
  );
  return rows.map(petaTiket);
}

export async function fetchTiketSaya(): Promise<QueueTicket[]> {
  const { data: { user } } = await supabaseBrowser().auth.getUser();
  if (!user) return [];
  const rows = await ambilatauLempar<BarisTiket[]>(
    supabaseBrowser().from("tickets").select("*").eq("owner_id", user.id).order("diambil_pada", { ascending: false }).limit(50),
  );
  return rows.map(petaTiket);
}

export async function hitungPakaiLayanan(serviceId: string): Promise<{ jumlah: number; contoh: string[] }> {
  const { data } = await supabaseBrowser().from("tickets").select("nomor").eq("service_id", serviceId).limit(4);
  const rows = (data ?? []) as Array<{ nomor: string }>;
  return { jumlah: rows.length, contoh: rows.slice(0, 3).map((r) => r.nomor) };
}

/* ── Tulis pengunjung (RPC atomik) ────────────────── */
export async function rpcAmbilNomor(serviceId: string, nama: string): Promise<QueueTicket> {
  await pastikanSesiPengunjung();
  const { data, error } = await supabaseBrowser().rpc("ambil_nomor", { p_service_id: serviceId, p_nama: nama.trim() });
  if (error) throw new Error(pesanGalat(error));
  const baris = (Array.isArray(data) ? data[0] : data) as BarisTiket;
  if (!baris?.id) throw new Error("Server tidak mengembalikan tiket. Coba lagi.");
  return petaTiket(baris);
}

/* ── Tulis admin ──────────────────────────────────── */
export async function rpcUbahStatus(ticketId: string, status: QueueStatus, loketId?: string | null): Promise<QueueTicket> {
  const { data, error } = await supabaseBrowser().rpc("ubah_status", {
    p_ticket_id: ticketId, p_status_baru: status, p_loket_id: loketId ?? null,
  });
  if (error) throw new Error(pesanGalat(error));
  const baris = (Array.isArray(data) ? data[0] : data) as BarisTiket;
  if (!baris?.id) throw new Error("Server tidak mengembalikan tiket. Coba lagi.");
  return petaTiket(baris);
}

export async function rpcPanggilUlang(ticketId: string): Promise<QueueTicket> {
  const { data, error } = await supabaseBrowser().rpc("panggil_ulang", { p_ticket_id: ticketId });
  if (error) throw new Error(pesanGalat(error));
  const baris = (Array.isArray(data) ? data[0] : data) as BarisTiket;
  if (!baris?.id) throw new Error("Server tidak mengembalikan tiket. Coba lagi.");
  return petaTiket(baris);
}

export async function simpanLayanan(
  s: { id?: string; kode: string; nama: string; deskripsi: string; estimasiMenit: number; aktif: boolean; prefix: string },
): Promise<void> {
  const sb = supabaseBrowser();
  if (s.id) {
    const { error } = await sb.from("services").update({
      kode: s.kode, nama: s.nama, deskripsi: s.deskripsi,
      estimasi_menit: s.estimasiMenit, prefix: s.prefix,
    }).eq("id", s.id);
    if (error) throw new Error(pesanGalat(error));
    return;
  }
  const id = `lay-${Date.now()}`;
  const { error } = await sb.from("services").insert({
    id, kode: s.kode, prefix: s.prefix, nama: s.nama,
    deskripsi: s.deskripsi, estimasi_menit: s.estimasiMenit, aktif: true,
  });
  if (error) throw new Error(pesanGalat(error));
}

export async function toggleLayanan(id: string, aktif: boolean): Promise<void> {
  const { error } = await supabaseBrowser().from("services").update({ aktif }).eq("id", id);
  if (error) throw new Error(pesanGalat(error));
}

export async function hapusLayanan(id: string): Promise<void> {
  const { error } = await supabaseBrowser().from("services").delete().eq("id", id);
  if (error) throw new Error(pesanGalat(error));
}

export async function toggleLoket(id: string, aktif: boolean): Promise<void> {
  const { error } = await supabaseBrowser().from("counters").update({ aktif }).eq("id", id);
  if (error) throw new Error(pesanGalat(error));
}

export async function simpanPetugas(
  p: { id?: string; nama: string; username: string; peran: "admin" | "petugas"; loketId: string | null; aktif: boolean },
): Promise<void> {
  const sb = supabaseBrowser();
  if (p.id) {
    const { error } = await sb.from("staff").update({
      nama: p.nama, username: p.username, peran: p.peran, loket_id: p.loketId,
    }).eq("id", p.id);
    if (error) throw new Error(pesanGalat(error));
    return;
  }
  const { error } = await sb.from("staff").insert({
    id: `st-${Date.now()}`, nama: p.nama, username: p.username,
    peran: p.peran, loket_id: p.loketId, aktif: true,
  });
  if (error) throw new Error(pesanGalat(error));
}

export async function togglePetugas(id: string, aktif: boolean): Promise<void> {
  const { error } = await supabaseBrowser().from("staff").update({ aktif }).eq("id", id);
  if (error) throw new Error(pesanGalat(error));
}

export async function hapusPetugas(id: string): Promise<void> {
  const { error } = await supabaseBrowser().from("staff").delete().eq("id", id);
  if (error) throw new Error(pesanGalat(error));
}

export async function simpanPengaturan(p: AppSettings): Promise<void> {
  const { error } = await supabaseBrowser().from("app_settings").update({
    nama_instansi: p.namaInstansi, jam_buka: p.jamBuka, jam_tutup: p.jamTutup,
    awalan_nomor: p.awalanNomor, reset_harian: p.resetHarian,
    tampilkan_estimasi: p.tampilkanEstimasi,
    tampilkan_riwayat_display: p.tampilkanRiwayatDisplay,
    suara_panggilan: p.suaraPanggilan,
  }).eq("id", 1);
  if (error) throw new Error(pesanGalat(error));
}
