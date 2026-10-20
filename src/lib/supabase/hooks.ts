"use client";

import { useCallback, useEffect, useState } from "react";
import { demoSettings } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/db";
import {
  fetchLayanan, fetchLoket, fetchPapan, fetchPengaturan,
  fetchPetugas, fetchTiketAdmin, fetchTiketSaya,
} from "@/lib/supabase/queries";
import type { AppSettings, Counter, QueueTicket, Service, Staff } from "@/lib/types";

/**
 * Hook data live Supabase (Fase 1 — pengganti DemoStore per halaman).
 * Setiap hook: { data, memuat, galat, muatUlang } + langganan Realtime
 * pada tabel sumbernya sehingga display/admin mutakhir tanpa refresh.
 */

export interface HasilLive<T> {
  data: T;
  memuat: boolean;
  galat: string | null;
  muatUlang: () => void;
}

function langgananTabel(tabel: readonly string[], muat: () => void): () => void {
  try {
    const sb = supabaseBrowser();
    const ch = sb.channel(`live-${tabel.join("-")}`);
    for (const t of tabel) {
      ch.on("postgres_changes", { event: "*", schema: "public", table: t }, muat);
    }
    ch.subscribe();
    return () => {
      try {
        void sb.removeChannel(ch);
      } catch {
        /* abaikan */
      }
    };
  } catch {
    return () => {};
  }
}

function useLive<T>(awal: T, ambil: () => Promise<T>, tabel: readonly string[]): HasilLive<T> {
  const [data, setData] = useState<T>(awal);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const muat = useCallback(() => {
    let batal = false;
    ambil()
      .then((d) => {
        if (batal) return;
        setData(d);
        setGalat(null);
        setMemuat(false);
      })
      .catch((e: unknown) => {
        if (batal) return;
        setGalat(e instanceof Error ? e.message : "Gagal memuat data.");
        setMemuat(false);
      });
    return () => {
      batal = true;
    };
  }, [ambil]);

  useEffect(() => {
    const batalkan = muat();
    const berhenti = langgananTabel(tabel, () => muat());
    return () => {
      batalkan();
      berhenti();
    };
  }, [muat, tabel]);

  const muatUlang = useCallback(() => {
    muat();
  }, [muat]);

  return { data, memuat, galat, muatUlang };
}

const TABEL_LAYANAN = ["services"];
const TABEL_PAPAN = ["tickets", "counters"];
const TABEL_TIKET = ["tickets", "counters"];
const TABEL_SAYA = ["tickets"];
const TABEL_LOKET = ["counters", "counter_services", "staff", "tickets"];
const TABEL_PETUGAS = ["staff"];
const TABEL_PENGATURAN = ["app_settings"];

export function useLayananLive(): HasilLive<Service[]> {
  const ambil = useCallback(() => fetchLayanan(), []);
  return useLive<Service[]>([], ambil, TABEL_LAYANAN);
}

export function usePapanLive(): HasilLive<QueueTicket[]> {
  const ambil = useCallback(() => fetchPapan(), []);
  return useLive<QueueTicket[]>([], ambil, TABEL_PAPAN);
}

export function useTiketAdminLive(hariKeBelakang = 1): HasilLive<QueueTicket[]> {
  const ambil = useCallback(() => fetchTiketAdmin(hariKeBelakang), [hariKeBelakang]);
  return useLive<QueueTicket[]>([], ambil, TABEL_TIKET);
}

export function useTiketSayaLive(): HasilLive<QueueTicket[]> {
  const ambil = useCallback(() => fetchTiketSaya(), []);
  return useLive<QueueTicket[]>([], ambil, TABEL_SAYA);
}

export function useLoketLive(): HasilLive<Counter[]> {
  const ambil = useCallback(() => fetchLoket(), []);
  return useLive<Counter[]>([], ambil, TABEL_LOKET);
}

export function usePetugasLive(): HasilLive<Staff[]> {
  const ambil = useCallback(() => fetchPetugas(), []);
  return useLive<Staff[]>([], ambil, TABEL_PETUGAS);
}

export function usePengaturanLive(): HasilLive<AppSettings> {
  const ambil = useCallback(() => fetchPengaturan(), []);
  return useLive<AppSettings>({ ...demoSettings }, ambil, TABEL_PENGATURAN);
}
