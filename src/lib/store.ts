import { useEffect, useSyncExternalStore } from "react";

/**
 * Store demo bersama (prototipe Tahap 1 — BUKAN database).
 *
 * Menggantikan pola lama `useState(konstantaDemo)` yang terisolasi per halaman
 * (perubahan di satu halaman tak terlihat di halaman lain dan hilang saat
 * refresh). Store ini:
 * - Tunggal per kunci: semua halaman membaca/menulis referensi yang sama.
 * - Persist ke localStorage setiap mutasi → tahan refresh, terbaca lintas tab.
 * - Aman prerender/SSR: render pertama selalu memakai benih (sama dengan
 *   server) sehingga tidak ada hydration mismatch; data tersimpan dimuat
 *   dalam efek setelah mount.
 * - Aman useSyncExternalStore: snapshot selalu referensi stabil (kontrak
 *   "getSnapshot should be cached" — tidak pernah objek baru tiap panggilan).
 * - Sinkron lintas tab via event `storage`.
 *
 * Batasan prototipe: satu browser saja (localStorage tidak lintas perangkat),
 * tanpa counter atomik (dua tab yang menulis bersamaan bisa berebut — lihat
 * Tahap 3 untuk backend sungguhan).
 */

export interface DemoStore<T> {
  /** Baca sinkron (untuk handler/validasi di luar render). */
  baca(): T;
  /** Tulis imutabel: simpan + persist + beri tahu pelanggan. */
  tulis(pembaru: (s: T) => T): void;
  /** Hook React untuk membaca store (snapshot stabil). */
  useStore(): T;
}

export function buatStore<T>(kunci: string, benih: () => T, gabung?: (b: T) => T): DemoStore<T> {
  let refBenih: T | null = null;
  let state: T | null = null;
  let dimuat = false;
  const pendengar = new Set<() => void>();
  let dengarStorage = false;

  function salinBenih(): T {
    // benih() wajib mengembalikan objek baru setiap dipanggil.
    return benih();
  }

  function beriTahu() {
    pendengar.forEach((n) => {
      try {
        n();
      } catch {
        /* abaikan listener rusak */
      }
    });
  }

  function simpan() {
    try {
      window.localStorage.setItem(kunci, JSON.stringify(state));
    } catch {
      /* penyimpanan tidak tersedia — state memori tetap dipakai */
    }
  }

  /** Muat dari localStorage (klien, setelah mount). Kembalikan true bila berubah. */
  function hidrasi(): boolean {
    if (typeof window === "undefined" || dimuat) return false;
    let berikutnya: T | null = null;
    try {
      const mentah = window.localStorage.getItem(kunci);
      if (mentah !== null) berikutnya = JSON.parse(mentah) as T;
    } catch {
      berikutnya = null;
    }
    if (berikutnya === null) {
      const b = salinBenih();
      state = gabung ? gabung(b) : b;
    } else {
      state = berikutnya;
    }
    dimuat = true;
    beriTahu();
    return true;
  }

  function baca(): T {
    if (typeof window === "undefined") {
      if (!refBenih) refBenih = salinBenih();
      return refBenih;
    }
    if (!dimuat) {
      if (!refBenih) refBenih = salinBenih();
      return refBenih;
    }
    if (!state) state = salinBenih();
    return state;
  }

  function tulis(pembaru: (s: T) => T) {
    if (typeof window === "undefined") return;
    const dasar = dimuat && state ? state : salinBenih();
    if (!dimuat) {
      // Tulis sebelum hidrasi: mulai dari persist/benih agar tak menimpa data lama.
      dimuat = true;
      try {
        const mentah = window.localStorage.getItem(kunci);
        state = mentah !== null ? (JSON.parse(mentah) as T) : dasar;
      } catch {
        state = dasar;
      }
    }
    state = pembaru(state as T);
    simpan();
    beriTahu();
  }

  function langganan(n: () => void) {
    pendengar.add(n);
    return () => {
      pendengar.delete(n);
    };
  }

  function dapatkanServerSnapshot(): T {
    return salinBenih();
  }

  function useStore(): T {
    useEffect(() => {
      hidrasi();
      // Sinkron lintas tab selama umur aplikasi (sengaja global, bukan per komponen).
      if (!dengarStorage) {
        dengarStorage = true;
        window.addEventListener("storage", (ev) => {
          if (ev.key !== kunci) return;
          dimuat = false;
          hidrasi();
        });
      }
    }, []);
    return useSyncExternalStore(langganan, baca, dapatkanServerSnapshot);
  }

  return { baca, tulis, useStore };
}
