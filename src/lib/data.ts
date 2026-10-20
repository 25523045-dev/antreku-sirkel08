import type {
  ActivityItem,
  AppSettings,
  Counter,
  QueueTicket,
  Service,
  Staff,
} from "@/lib/types";

/**
 * DATA DEMO TERPUSAT — jelas ditandai sebagai demo (bukan data aktual).
 * Satu-satunya sumber dataset demo; jangan menduplikasi di halaman lain.
 * Untuk Tahap 2, state sesi akan meniru lapisan ini agar mudah diganti API.
 */
export const IS_DEMO = true;

const T = "2026-10-14"; // tanggal demo (Asia/Jakarta)

export const demoServices: Service[] = [
  {
    id: "lay-akademik",
    kode: "AKD",
    nama: "Administrasi Akademik",
    deskripsi: "Legalisir, surat keterangan aktif kuliah, dan transkrip.",
    estimasiMenit: 8,
    aktif: true,
    prefix: "A",
  },
  {
    id: "lay-keuangan",
    kode: "KEU",
    nama: "Layanan Keuangan",
    deskripsi: "Pembayaran UKT, denda, dan pengajuan keringanan.",
    estimasiMenit: 6,
    aktif: true,
    prefix: "B",
  },
  {
    id: "lay-kemahasiswaan",
    kode: "KMH",
    nama: "Kemahasiswaan",
    deskripsi: "Beasiswa, organisasi mahasiswa, dan layanan konseling.",
    estimasiMenit: 10,
    aktif: true,
    prefix: "C",
  },
  {
    id: "lay-umum",
    kode: "UMM",
    nama: "Layanan Umum",
    deskripsi: "Informasi umum, lost & found, dan surat menyurat.",
    estimasiMenit: 5,
    aktif: false,
    prefix: "D",
  },
];

export const demoCounters: Counter[] = [
  {
    id: "loket-1",
    nama: "Loket 1",
    layananIds: ["lay-akademik", "lay-umum"],
    petugas: "Sari Puspita",
    aktif: true,
    sedangMelayani: "A-004",
  },
  {
    id: "loket-2",
    nama: "Loket 2",
    layananIds: ["lay-keuangan"],
    petugas: "Budi Hartono",
    aktif: true,
    sedangMelayani: "B-002",
  },
  {
    id: "loket-3",
    nama: "Loket 3",
    layananIds: ["lay-kemahasiswaan"],
    petugas: "Dewi Anggraini",
    aktif: true,
    sedangMelayani: null,
  },
  {
    id: "loket-4",
    nama: "Loket 4",
    layananIds: ["lay-akademik", "lay-keuangan", "lay-kemahasiswaan"],
    aktif: false,
    sedangMelayani: null,
  },
];

export const demoStaff: Staff[] = [
  { id: "st-1", nama: "Admin Utama", username: "admin", peran: "admin", aktif: true },
  { id: "st-2", nama: "Sari Puspita", username: "sari.p", peran: "petugas", loketId: "loket-1", aktif: true },
  { id: "st-3", nama: "Budi Hartono", username: "budi.h", peran: "petugas", loketId: "loket-2", aktif: true },
  { id: "st-4", nama: "Dewi Anggraini", username: "dewi.a", peran: "petugas", loketId: "loket-3", aktif: true },
  { id: "st-5", nama: "Agus Nonaktif", username: "agus.n", peran: "petugas", loketId: null, aktif: false },
];

function at(jam: string): string {
  return `${T}T${jam}:00+07:00`;
}

export const demoQueues: QueueTicket[] = [
  { id: "q-001", nomor: "A-001", layananId: "lay-akademik", namaPengunjung: "Nadia Rahma", status: "selesai", tanggal: T, diambilPada: at("08:02"), dipanggilPada: at("08:10"), mulaiPada: at("08:11"), selesaiPada: at("08:19"), loketId: "loket-1", petugas: "Sari Puspita" },
  { id: "q-002", nomor: "A-002", layananId: "lay-akademik", namaPengunjung: "Rizky Pratama", status: "selesai", tanggal: T, diambilPada: at("08:05"), dipanggilPada: at("08:20"), mulaiPada: at("08:21"), selesaiPada: at("08:29"), loketId: "loket-1", petugas: "Sari Puspita" },
  { id: "q-003", nomor: "B-001", layananId: "lay-keuangan", namaPengunjung: "Intan Permata", status: "selesai", tanggal: T, diambilPada: at("08:07"), dipanggilPada: at("08:15"), mulaiPada: at("08:16"), selesaiPada: at("08:22"), loketId: "loket-2", petugas: "Budi Hartono" },
  { id: "q-004", nomor: "A-003", layananId: "lay-akademik", namaPengunjung: "Fajar Nugroho", status: "dilewati", tanggal: T, diambilPada: at("08:12"), dipanggilPada: at("08:31"), loketId: "loket-1", petugas: "Sari Puspita" },
  { id: "q-005", nomor: "A-004", layananId: "lay-akademik", namaPengunjung: "Putri Ayu", status: "dilayani", tanggal: T, diambilPada: at("08:20"), dipanggilPada: at("08:35"), mulaiPada: at("08:36"), loketId: "loket-1", petugas: "Sari Puspita" },
  { id: "q-006", nomor: "B-002", layananId: "lay-keuangan", namaPengunjung: "Hendra Gunawan", status: "dipanggil", tanggal: T, diambilPada: at("08:25"), dipanggilPada: at("08:40"), loketId: "loket-2", petugas: "Budi Hartono" },
  { id: "q-007", nomor: "C-001", layananId: "lay-kemahasiswaan", namaPengunjung: "Lestari Wulandari", status: "menunggu", tanggal: T, diambilPada: at("08:33") },
  { id: "q-008", nomor: "A-005", layananId: "lay-akademik", namaPengunjung: "Dimas Saputra", status: "menunggu", tanggal: T, diambilPada: at("08:38") },
  { id: "q-009", nomor: "B-003", layananId: "lay-keuangan", namaPengunjung: "Mega Lestari", status: "menunggu", tanggal: T, diambilPada: at("08:44") },
  { id: "q-010", nomor: "C-002", layananId: "lay-kemahasiswaan", namaPengunjung: "Yoga Firmansyah", status: "menunggu", tanggal: T, diambilPada: at("08:51") },
  { id: "q-011", nomor: "A-006", layananId: "lay-akademik", namaPengunjung: "Tania Kusuma", status: "menunggu", tanggal: T, diambilPada: at("08:57") },
  { id: "q-012", nomor: "B-004", layananId: "lay-keuangan", namaPengunjung: "Rudi Santoso", status: "dibatalkan", tanggal: T, diambilPada: at("09:02") },
];

export const demoActivities: ActivityItem[] = [
  { id: "a-1", waktu: at("08:40"), teks: "B-002 dipanggil di Loket 2 oleh Budi Hartono", jenis: "dipanggil" },
  { id: "a-2", waktu: at("08:36"), teks: "A-004 mulai dilayani di Loket 1 oleh Sari Puspita", jenis: "dilayani" },
  { id: "a-3", waktu: at("08:31"), teks: "A-003 dilewati (tidak hadir saat dipanggil)", jenis: "dilewati" },
  { id: "a-4", waktu: at("08:29"), teks: "A-002 selesai dilayani di Loket 1", jenis: "selesai" },
  { id: "a-5", waktu: at("09:02"), teks: "B-004 dibatalkan oleh pengunjung", jenis: "dibatalkan" },
];

export const demoSettings: AppSettings = {
  namaInstansi: "Pusat Layanan Kampus SIRKEL-08",
  namaAplikasi: "AntreKu",
  jamBuka: "08:00",
  jamTutup: "16:00",
  awalanNomor: "Tanggal + prefix layanan (mis. A-007)",
  resetHarian: true,
  tampilkanEstimasi: true,
  tampilkanRiwayatDisplay: true,
  suaraPanggilan: true,
};

/* ── Helper baca demo ─────────────────────────────── */

export function getService(id: string): Service | undefined {
  return demoServices.find((s) => s.id === id);
}

export function getCounter(id: string | null | undefined): Counter | undefined {
  if (!id) return undefined;
  return demoCounters.find((c) => c.id === id);
}

export function getTicket(idOrNomor: string): QueueTicket | undefined {
  const kunci = idOrNomor.trim().toUpperCase();
  return demoQueues.find(
    (t) => t.id === idOrNomor || t.nomor.toUpperCase() === kunci,
  );
}

export function dashboardStats() {
  const hariIni = demoQueues.filter((t) => t.tanggal === T);
  const by = (s: QueueTicket["status"]) => hariIni.filter((t) => t.status === s).length;
  return {
    total: hariIni.length,
    menunggu: by("menunggu"),
    dipanggil: by("dipanggil"),
    dilayani: by("dilayani"),
    selesai: by("selesai"),
    dilewati: by("dilewati"),
    dibatalkan: by("dibatalkan"),
  };
}
