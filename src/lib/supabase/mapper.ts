"use client";

import type { AppSettings, Counter, QueueStatus, QueueTicket, Service, Staff } from "@/lib/types";

/**
 * Baris database (snake_case) + pemeta ke tipe aplikasi (camelCase).
 * Satu-satunya tempat yang boleh menyebut nama kolom DB.
 */

/* ── Baris mentah ─────────────────────────────────── */
export interface BarisLayanan {
  id: string; kode: string; prefix: string; nama: string;
  deskripsi: string; estimasi_menit: number; aktif: boolean;
}
export interface BarisLoket {
  id: string; nama: string; aktif: boolean;
  sedang_melayani_ticket_id: string | null;
}
export interface BarisRelasiLoket {
  counter_id: string; service_id: string;
}
export interface BarisPetugas {
  id: string; nama: string; username: string;
  peran: "admin" | "petugas"; loket_id: string | null; aktif: boolean;
}
export interface BarisTiket {
  id: string; service_id: string; tanggal: string; nomor: string;
  owner_id: string | null; nama_pengunjung: string; status: string;
  diambil_pada: string; dipanggil_pada: string | null;
  mulai_pada: string | null; selesai_pada: string | null;
  loket_id: string | null; petugas: string | null;
}
export interface BarisPapan {
  nomor: string; service_id: string; layanan: string; prefix: string;
  status: string; tanggal: string; loket_id: string | null; loket: string | null;
  diambil_pada: string; dipanggil_pada: string | null;
}
export interface BarisPengaturan {
  id: number; nama_instansi: string; nama_aplikasi: string;
  jam_buka: string; jam_tutup: string; awalan_nomor: string;
  reset_harian: boolean; tampilkan_estimasi: boolean;
  tampilkan_riwayat_display: boolean; suara_panggilan: boolean;
}

const STATUS_VALID: QueueStatus[] = ["menunggu", "dipanggil", "dilayani", "selesai", "dilewati", "dibatalkan"];

function keStatus(v: string): QueueStatus {
  return (STATUS_VALID as string[]).includes(v) ? (v as QueueStatus) : "menunggu";
}

/* ── Pemeta ───────────────────────────────────────── */
export function petaLayanan(b: BarisLayanan): Service {
  return {
    id: b.id, kode: b.kode, prefix: b.prefix, nama: b.nama,
    deskripsi: b.deskripsi ?? "", estimasiMenit: b.estimasi_menit ?? 5,
    aktif: b.aktif,
  };
}

export function petaTiket(b: BarisTiket): QueueTicket {
  return {
    id: b.id, nomor: b.nomor, layananId: b.service_id,
    namaPengunjung: b.nama_pengunjung, status: keStatus(b.status),
    tanggal: b.tanggal, diambilPada: b.diambil_pada,
    dipanggilPada: b.dipanggil_pada, mulaiPada: b.mulai_pada,
    selesaiPada: b.selesai_pada, loketId: b.loket_id, petugas: b.petugas,
  };
}

/**
 * Baris papan publik → QueueTicket parsial. Nama pengunjung memang tidak
 * diekspos view (privasi, lihat 0001_schema.sql); id diisi nomor sebagai
 * kunci tampilan — JANGAN dipakai untuk mutasi.
 */
export function petaPapan(b: BarisPapan): QueueTicket {
  return {
    id: `papan-${b.nomor}`, nomor: b.nomor, layananId: b.service_id,
    namaPengunjung: "", status: keStatus(b.status), tanggal: b.tanggal,
    diambilPada: b.diambil_pada, dipanggilPada: b.dipanggil_pada,
    mulaiPada: null, selesaiPada: null, loketId: b.loket_id, petugas: null,
  };
}

/** Gabung counters + relasi + petugas + nomor tiket sedang dilayani. */
export function petaLoket(
  b: BarisLoket,
  relasi: BarisRelasiLoket[],
  daftarPetugas: Staff[],
  nomorTiket: Map<string, string>,
): Counter {
  return {
    id: b.id,
    nama: b.nama,
    layananIds: relasi.filter((r) => r.counter_id === b.id).map((r) => r.service_id),
    petugas: daftarPetugas.find((p) => p.loketId === b.id)?.nama,
    aktif: b.aktif,
    sedangMelayani: b.sedang_melayani_ticket_id
      ? (nomorTiket.get(b.sedang_melayani_ticket_id) ?? null)
      : null,
  };
}

export function petaPetugas(b: BarisPetugas): Staff {
  return {
    id: b.id, nama: b.nama, username: b.username, peran: b.peran,
    loketId: b.loket_id, aktif: b.aktif,
  };
}

export function petaPengaturan(b: BarisPengaturan): AppSettings {
  return {
    namaInstansi: b.nama_instansi, namaAplikasi: b.nama_aplikasi,
    jamBuka: b.jam_buka, jamTutup: b.jam_tutup, awalanNomor: b.awalan_nomor,
    resetHarian: b.reset_harian, tampilkanEstimasi: b.tampilkan_estimasi,
    tampilkanRiwayatDisplay: b.tampilkan_riwayat_display,
    suaraPanggilan: b.suara_panggilan,
  };
}
