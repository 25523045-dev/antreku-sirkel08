/**
 * Tipe data inti AntreKu (SIRKEL-08).
 * Tahap 1: tipe untuk prototipe frontend dengan mock data terpusat.
 * Siap dipetakan ke tabel PostgreSQL/Supabase:
 * services, counters, profiles/users, queues, queue_events.
 */

export type QueueStatus =
  | "menunggu"
  | "dipanggil"
  | "dilayani"
  | "selesai"
  | "dilewati"
  | "dibatalkan";

export interface Service {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  estimasiMenit: number;
  aktif: boolean;
  prefix: string;
}

export interface Counter {
  id: string;
  nama: string;
  layananIds: string[];
  petugas?: string;
  aktif: boolean;
  sedangMelayani?: string | null;
}

export interface Staff {
  id: string;
  nama: string;
  username: string;
  peran: "admin" | "petugas";
  loketId?: string | null;
  aktif: boolean;
}

export interface QueueTicket {
  id: string;
  nomor: string;
  layananId: string;
  namaPengunjung: string;
  status: QueueStatus;
  tanggal: string; // YYYY-MM-DD (waktu Asia/Jakarta)
  diambilPada: string; // ISO
  dipanggilPada?: string | null;
  mulaiPada?: string | null;
  selesaiPada?: string | null;
  loketId?: string | null;
  petugas?: string | null;
}

export interface AppSettings {
  namaInstansi: string;
  namaAplikasi: string;
  jamBuka: string;
  jamTutup: string;
  awalanNomor: string;
  resetHarian: boolean;
  tampilkanEstimasi: boolean;
  tampilkanRiwayatDisplay: boolean;
  suaraPanggilan: boolean;
}

export interface ActivityItem {
  id: string;
  waktu: string; // ISO
  teks: string;
  jenis: QueueStatus | "info";
}
