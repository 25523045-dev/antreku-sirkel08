"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { PENGUNJUNG_SESSION_KEY, akhiriSesiPengunjung, type SesiPengunjung } from "@/lib/sesi";
import { keluarSupabase } from "@/lib/supabase/auth";
import { getCounter, getService } from "@/lib/data";
import { useLayananLive, useLoketLive, usePapanLive, useTiketSayaLive } from "@/lib/supabase/hooks";
import { estimasiTungguMenit, formatEstimasi, formatWaktuLengkap } from "@/lib/format";
import { countAhead } from "@/lib/queue";
import { PublicShell } from "@/components/site";
import { Alert, Card, CardBody, LoadingState, StatusBadge } from "@/components/ui";

function langgananSesi(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("pageshow", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("pageshow", notify);
  };
}

/**
 * Snapshot mentah (string) untuk useSyncExternalStore.
 * React mewajibkan getSnapshot mengembalikan nilai yang stabil — objek hasil
 * JSON.parse selalu baru setiap panggilan sehingga memicu error
 * "The result of getSnapshot should be cached" (loop render, halaman crash
 * di production). String dibandingkan berdasarkan nilai sehingga aman.
 */
function snapshotSesiMentah(): string | null {
  try {
    return window.sessionStorage.getItem(PENGUNJUNG_SESSION_KEY);
  } catch {
    return null;
  }
}

function uraiSesi(mentah: string | null): SesiPengunjung | null {
  if (!mentah) return null;
  try {
    return JSON.parse(mentah) as SesiPengunjung;
  } catch {
    return null;
  }
}

/** Dasbor pengunjung — tiket saya + jalan pintas. Terlindungi sesi Supabase. */
export default function DasborPengunjung() {
  const router = useRouter();
  const sesiMentah = useSyncExternalStore(langgananSesi, snapshotSesiMentah, () => null);
  const sesi = useMemo(() => uraiSesi(sesiMentah), [sesiMentah]);

  useEffect(() => {
    if (sesi === null) router.replace("/pengunjung/login");
  }, [sesi, router]);

  const keluar = useCallback(() => {
    akhiriSesiPengunjung();
    void keluarSupabase();
    router.replace("/pengunjung/login");
  }, [router]);

  const { data: papan, memuat } = usePapanLive();
  const { data: milikSaya } = useTiketSayaLive();
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();

  if (!sesi) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl">
          <LoadingState teks="Memeriksa sesi pengunjung…" />
        </div>
      </PublicShell>
    );
  }

  const kunci = sesi.nomor.toUpperCase();
  // Baris penuh milik sendiri bila tersedia, fallback ke papan publik.
  const tiket = milikSaya.find((q) => q.nomor.toUpperCase() === kunci)
    ?? papan.find((q) => q.nomor.toUpperCase() === kunci);
  const svc = tiket ? (daftarLayanan.find((s) => s.id === tiket.layananId) ?? getService(tiket.layananId)) : undefined;
  const loket = tiket ? (daftarLoket.find((l) => l.id === tiket.loketId) ?? getCounter(tiket.loketId)) : undefined;
  const depan = tiket ? countAhead(papan, tiket) : 0;

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-100">Area pengunjung</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl dark:text-white">
              Halo, {sesi.nama}
            </h1>
            <p className="mt-1 text-sm text-ink-600">Tiket Anda: <strong className="tnum font-mono">{sesi.nomor}</strong></p>
          </div>
          <button
            type="button"
            onClick={keluar}
            className="inline-flex h-10 cursor-pointer items-center rounded-[10px] border border-line bg-white px-4 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:bg-white/5 dark:text-white dark:hover:border-white/40"
          >
            Keluar
          </button>
        </div>

        {memuat && !tiket ? (
          <Card className="mt-6"><LoadingState teks="Memuat tiket Anda…" /></Card>
        ) : tiket && svc ? (
          <Card className="mt-6 overflow-hidden">
            <div className="bg-navy-950 px-6 py-5 text-center text-white">
              <p className="text-xs font-bold tracking-widest uppercase text-white/60">{svc.nama}</p>
              <p className="tnum mt-1 font-mono text-6xl font-black tracking-tight">{tiket.nomor}</p>
              <p className="tnum mt-1.5 font-mono text-xs text-white/60">Diambil: {formatWaktuLengkap(tiket.diambilPada)}</p>
              <div className="mt-3 flex justify-center"><StatusBadge status={tiket.status} pulse /></div>
            </div>
            <CardBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-[12px] bg-canvas px-4 py-3">
                  <dt className="text-xs font-semibold text-ink-500">Waktu pengambilan</dt>
                  <dd className="mt-0.5 font-bold text-ink-900">{formatWaktuLengkap(tiket.diambilPada)}</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-4 py-3">
                  <dt className="text-xs font-semibold text-ink-500">Loket</dt>
                  <dd className="mt-0.5 font-bold text-ink-900">{loket?.nama ?? "Menunggu penugasan"}</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-4 py-3">
                  <dt className="text-xs font-semibold text-ink-500">Antrean di depan</dt>
                  <dd className="tnum mt-0.5 font-bold text-ink-900">{depan} orang</dd>
                </div>
                <div className="rounded-[12px] bg-canvas px-4 py-3">
                  <dt className="text-xs font-semibold text-ink-500">Perkiraan tunggu</dt>
                  <dd className="mt-0.5 font-bold text-ink-900">{formatEstimasi(estimasiTungguMenit(depan, svc.estimasiMenit))}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/tiket/${tiket.nomor}`} className="inline-flex h-11 items-center rounded-[12px] bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-800 dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300">
                  Buka Tiket Lengkap
                </Link>
                <Link href="/lacak-antrean" className="inline-flex h-11 items-center rounded-[12px] border border-line px-5 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40">
                  Lacak Antrean
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="mt-6">
            <CardBody>
              <Alert tone="warning">
                <strong>Tiket {sesi.nomor} tidak ditemukan di database hari ini.</strong>
                <span className="mt-1 block">Mungkin tiket dari perangkat lain atau hari berbeda. Ambil nomor baru atau lacak manual.</span>
              </Alert>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/ambil-antrean" className="inline-flex h-11 items-center rounded-[12px] bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-800 dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300">
                  Ambil Nomor Baru
                </Link>
                <Link href="/lacak-antrean" className="inline-flex h-11 items-center rounded-[12px] border border-line px-5 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40">
                  Lacak Manual
                </Link>
              </div>
            </CardBody>
          </Card>
        )}

        <Card className="mt-4">
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Jalan pintas</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { href: "/ambil-antrean", label: "Ambil Nomor" },
                { href: "/lacak-antrean", label: "Lacak Antrean" },
                { href: "/display", label: "Layar Antrean" },
              ].map((a) => (
                <Link key={a.href} href={a.href} className="rounded-[10px] border border-line px-4 py-3 text-center text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40">
                  {a.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-ink-500">
              Sesi pengunjung ini tidak memberikan hak akses admin. Membuka <span className="tnum font-mono">/admin</span> akan meminta login admin tersendiri.
            </p>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
