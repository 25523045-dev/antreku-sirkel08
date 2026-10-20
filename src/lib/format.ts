import type { QueueStatus } from "@/lib/types";

const TIME_ZONE = "Asia/Jakarta";

/** "2026-10-14" menurut zona Asia/Jakarta. */
export function todayJakarta(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return parts; // YYYY-MM-DD
}

/** "14 Okt 2026, 09.30 WIB" */
export function formatWaktuLengkap(iso: string): string {
  const d = new Date(iso);
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(":", ".");
  return `${tanggal}, ${jam} WIB`;
}

/** "09.30" */
export function formatJam(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(":", ".");
}

/** "Rabu, 14 Oktober 2026" */
export function formatTanggalPanjang(date = new Date()): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export const STATUS_LABEL: Record<QueueStatus, string> = {
  menunggu: "Menunggu",
  dipanggil: "Dipanggil",
  dilayani: "Sedang Dilayani",
  selesai: "Selesai",
  dilewati: "Dilewati",
  dibatalkan: "Dibatalkan",
};

export function estimasiTungguMenit(
  posisiDepan: number,
  estimasiPerOrang: number,
): number {
  return Math.max(0, posisiDepan * estimasiPerOrang);
}

export function formatEstimasi(menit: number): string {
  if (menit <= 0) return "± 0 mnt (segera)";
  if (menit < 60) return `± ${menit} mnt`;
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return sisa === 0 ? `± ${jam} jam` : `± ${jam} jam ${sisa} mnt`;
}
