import { demoCounters, demoQueues, demoServices, demoSettings, demoStaff } from "@/lib/data";
import { buatStore } from "@/lib/store";
import type { AppSettings, Counter, QueueTicket, Service, Staff } from "@/lib/types";

function salin<T>(nilai: T): T {
  return JSON.parse(JSON.stringify(nilai)) as T;
}

const KUNCI_TIKET_LAMA = "antreku:tiket-sesi";
const KUNCI_TERAKHIR_LAMA = "antreku:tiket-terakhir";

/**
 * Gabungkan tiket sesi-browser lama (dibuat via /ambil-antrean sebelum store
 * ada, atau dari tab lain) ke dalam benih. Hanya berjalan di klien saat
 * hidrasi awal — ID deterministik `sesi-${nomor}` agar semua pembaca sepakat.
 */
function gabungTiketSesi(benih: QueueTicket[]): QueueTicket[] {
  if (typeof window === "undefined") return benih;
  let sesi: unknown;
  let terakhir: { nomor?: string; nama?: string; layananId?: string; waktu?: string } | null = null;
  try {
    sesi = JSON.parse(window.localStorage.getItem(KUNCI_TIKET_LAMA) ?? "[]");
    terakhir = JSON.parse(window.localStorage.getItem(KUNCI_TERAKHIR_LAMA) ?? "null");
  } catch {
    return benih;
  }
  if (!Array.isArray(sesi) || sesi.length === 0) return benih;
  const hasil = [...benih];
  for (const item of sesi) {
    const nomor = typeof (item as { nomor?: unknown }).nomor === "string" ? (item as { nomor: string }).nomor : "";
    const layananId = typeof (item as { layananId?: unknown }).layananId === "string" ? (item as { layananId: string }).layananId : "";
    if (!nomor) continue;
    const kunci = nomor.toUpperCase();
    if (hasil.some((t) => t.nomor.toUpperCase() === kunci)) continue;
    const cocok = terakhir && typeof terakhir.nomor === "string" && terakhir.nomor.toUpperCase() === kunci ? terakhir : null;
    const waktu = typeof cocok?.waktu === "string" ? cocok.waktu : new Date().toISOString();
    hasil.push({
      id: `sesi-${nomor}`,
      nomor,
      layananId,
      namaPengunjung: typeof cocok?.nama === "string" && cocok.nama ? cocok.nama : "Pengunjung (sesi ini)",
      status: "menunggu",
      tanggal: waktu.slice(0, 10),
      diambilPada: waktu,
    });
  }
  return hasil;
}

export const tiketStore = buatStore<QueueTicket[]>("antreku:store:v1:tiket", () => salin(demoQueues), gabungTiketSesi);
export const layananStore = buatStore<Service[]>("antreku:store:v1:layanan", () => salin(demoServices));
export const loketStore = buatStore<Counter[]>("antreku:store:v1:loket", () => salin(demoCounters));
export const petugasStore = buatStore<Staff[]>("antreku:store:v1:petugas", () => salin(demoStaff));
export const pengaturanStore = buatStore<AppSettings>("antreku:store:v1:pengaturan", () => salin(demoSettings));
