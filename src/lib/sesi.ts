/**
 * Sesi demo AntreKu (prototipe Tahap 1 — BUKAN autentikasi aman produksi).
 *
 * - Sesi admin & pengunjung disimpan di sessionStorage (hilang saat tab ditutup).
 * - Cookie `antreku_admin` / `antreku_pengunjung` HANYA penanda agar middleware
 *   server dapat menolak akses langsung ke rute terlindungi. Cookie ini dapat
 *   dipalsukan — otorisasi production wajib di server dengan sesi/HttpOnly.
 * - Kedua peran memakai kunci terpisah dan tidak saling menimpa.
 */

export const ADMIN_SESSION_KEY = "antreku:demo-session";
export const ADMIN_COOKIE = "antreku_admin";
export const PENGUNJUNG_SESSION_KEY = "antreku:sesi-pengunjung";
export const PENGUNJUNG_COOKIE = "antreku_pengunjung";

export interface SesiAdmin {
  user: string;
  peran: "admin";
  waktu: string;
}

export interface SesiPengunjung {
  nama: string;
  nomor: string;
  waktu: string;
}

function tulisCookie(nama: string, nilai: string, hapus = false) {
  document.cookie = `${nama}=${nilai}; path=/; SameSite=Lax; max-age=${hapus ? 0 : 12 * 3600}`;
}

function simpanJSON(kunci: string, nilai: unknown) {
  try {
    window.sessionStorage.setItem(kunci, JSON.stringify(nilai));
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

function bacaJSON<T>(kunci: string): T | null {
  try {
    const mentah = window.sessionStorage.getItem(kunci);
    return mentah ? (JSON.parse(mentah) as T) : null;
  } catch {
    return null;
  }
}

/* ── Admin ─────────────────────────────────────── */
export function mulaiSesiAdmin(user = "admin") {
  simpanJSON(ADMIN_SESSION_KEY, { user, peran: "admin", waktu: new Date().toISOString() });
  tulisCookie(ADMIN_COOKIE, "1");
}

export function bacaSesiAdmin(): SesiAdmin | null {
  const s = bacaJSON<SesiAdmin>(ADMIN_SESSION_KEY);
  return s && s.peran === "admin" ? s : null;
}

export function akhiriSesiAdmin() {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* abaikan */
  }
  tulisCookie(ADMIN_COOKIE, "", true);
}

/* ── Pengunjung ────────────────────────────────── */
export function mulaiSesiPengunjung(nama: string, nomor: string) {
  simpanJSON(PENGUNJUNG_SESSION_KEY, { nama, nomor, waktu: new Date().toISOString() });
  tulisCookie(PENGUNJUNG_COOKIE, "1");
}

export function bacaSesiPengunjung(): SesiPengunjung | null {
  return bacaJSON<SesiPengunjung>(PENGUNJUNG_SESSION_KEY);
}

export function akhiriSesiPengunjung() {
  try {
    window.sessionStorage.removeItem(PENGUNJUNG_SESSION_KEY);
  } catch {
    /* abaikan */
  }
  tulisCookie(PENGUNJUNG_COOKIE, "", true);
}
