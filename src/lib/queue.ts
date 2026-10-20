import type { QueueStatus, QueueTicket } from "@/lib/types";

/**
 * Aturan transisi status antrean (SIRKEL-08 bagian E).
 * Fungsi murni — dapat diuji unit dan dipakai ulang oleh API/Server Action.
 */
const ALLOWED: Record<QueueStatus, QueueStatus[]> = {
  menunggu: ["dipanggil", "dibatalkan"],
  dipanggil: ["dilayani", "dilewati", "dibatalkan", "menunggu"],
  dilayani: ["selesai", "dibatalkan"],
  selesai: [],
  dilewati: ["dipanggil", "dibatalkan"],
  dibatalkan: [],
};

export function canTransition(from: QueueStatus, to: QueueStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: QueueStatus): QueueStatus[] {
  return [...(ALLOWED[from] ?? [])];
}

/** Urutan pemanggilan konsisten: menunggu → tertua dulu, lalu nomor terkecil. */
export function sortForCalling(a: QueueTicket, b: QueueTicket): number {
  const t = waktuEpoch(a.diambilPada) - waktuEpoch(b.diambilPada);
  if (t !== 0) return t;
  return a.nomor.localeCompare(b.nomor, "id");
}

/**
 * Epoch-ms dari ISO timestamp. WAJIB dipakai untuk mengurutkan waktu —
 * pembanding string (localeCompare) SALAH bila offset zona bercampur
 * (mis. demo "+07:00" vs sesi-browser "Z"), membuat antrean baru kalah
 * dari antrean demo yang sebenarnya lebih lama.
 */
export function waktuEpoch(iso?: string | null): number {
  if (!iso) return 0;
  const v = new Date(iso).getTime();
  return Number.isFinite(v) ? v : 0;
}

/** Bandingkan dua ISO timestamp secara kronologis (negatif bila a lebih dulu). */
export function bandingWaktu(a?: string | null, b?: string | null): number {
  return waktuEpoch(a) - waktuEpoch(b);
}

/** Antrean menunggu berikutnya untuk suatu layanan (atau semua layanan). */
export function nextWaiting(
  tickets: QueueTicket[],
  layananId?: string,
): QueueTicket | null {
  const pool = tickets
    .filter(
      (t) =>
        t.status === "menunggu" && (!layananId || t.layananId === layananId),
    )
    .sort(sortForCalling);
  return pool[0] ?? null;
}

/** Jumlah antrean aktif di depan tiket tertentu pada layanan yang sama. */
export function countAhead(tickets: QueueTicket[], target: QueueTicket): number {
  const aktif: QueueStatus[] = ["menunggu", "dipanggil", "dilayani"];
  const pool = tickets
    .filter(
      (t) =>
        t.layananId === target.layananId &&
        t.tanggal === target.tanggal &&
        aktif.includes(t.status),
    )
    .sort(sortForCalling);
  const idx = pool.findIndex((t) => t.id === target.id);
  return idx <= 0 ? 0 : idx;
}

/**
 * Nomor unik demo dalam lingkup layanan + tanggal.
 * Format: {PREFIX}-{NOMOR 3 digit}, mis. A-007.
 * CATATAN: hanya untuk prototipe frontend. Mode multi-pengguna wajib
 * memakai counter atomik di database (lihat Tahap 3).
 */
export function generateQueueNumber(
  prefix: string,
  existing: QueueTicket[],
  layananId: string,
  tanggal: string,
): string {
  const used = new Set(
    existing
      .filter((t) => t.layananId === layananId && t.tanggal === tanggal)
      .map((t) => t.nomor),
  );
  let n = used.size + 1;
  while (used.has(`${prefix}-${String(n).padStart(3, "0")}`)) n += 1;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}
