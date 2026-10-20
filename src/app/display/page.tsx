"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme";
import { getCounter, getService } from "@/lib/data";
import { useLayananLive, useLoketLive, usePapanLive, usePengaturanLive } from "@/lib/supabase/hooks";
import { bandingWaktu, sortForCalling } from "@/lib/queue";

function IkonLonceng({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IkonTiket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm13 1v2m0 4v2" />
    </svg>
  );
}

function IkonInfo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

export default function Display() {
  // Data live Supabase (papan publik hari ini + realtime). Tanpa store demo.
  const { data: daftarTiket, memuat: memuatTiket, galat, muatUlang } = usePapanLive();
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();
  const { data: pengaturan } = usePengaturanLive();
  const [jam, setJam] = useState("--.--");
  const [tanggal, setTanggal] = useState("Memuat tanggal…");

  useEffect(() => {
    const tick = () => {
      const kini = new Date();
      setTanggal(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric",
        }).format(kini),
      );
      setJam(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
        }).format(kini).replaceAll(":", "."),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Jaring pengaman bila Realtime terputus: muat ulang tiap 30 detik.
  useEffect(() => {
    const id = window.setInterval(muatUlang, 30000);
    return () => window.clearInterval(id);
  }, [muatUlang]);

  const namaLayanan = (id: string) =>
    daftarLayanan.find((s) => s.id === id)?.nama ?? getService(id)?.nama ?? id;
  const namaLoket = (id: string | null | undefined) =>
    daftarLoket.find((l) => l.id === id)?.nama ?? getCounter(id)?.nama ?? "—";

  const dipanggil = daftarTiket.filter((q) => q.status === "dipanggil").sort((a, b) => bandingWaktu(b.dipanggilPada, a.dipanggilPada));
  const dilayani = daftarTiket.filter((q) => q.status === "dilayani").sort((a, b) => bandingWaktu(b.mulaiPada ?? b.dipanggilPada, a.mulaiPada ?? a.dipanggilPada));
  const utama = dipanggil[0] ?? dilayani[0] ?? null;
  const menunggu = daftarTiket.filter((q) => q.status === "menunggu").sort(sortForCalling);
  const menungguCount = menunggu.length;
  const dimuat = !memuatTiket;

  return (
    <div className="display-page flex min-h-screen flex-col">
      {/* Bar atas display */}
      <header className="display-header-rule">
        <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3.5">
            <span aria-hidden className="display-logo flex size-11 items-center justify-center">
              <IkonTiket className="size-6" />
            </span>
            <div>
              <p className="text-xl font-semibold tracking-tight">AntreKu</p>
              <p className="mt-0.5 text-sm">{pengaturan.namaInstansi} · {tanggal}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex flex-col items-end gap-1">
              <p className="display-clock flex items-baseline gap-1.5 text-4xl font-bold sm:text-5xl">
                {jam} <span className="display-clock-suffix">WIB</span>
              </p>
              <Link href="/beranda" className="display-exit">← Keluar dari mode layar</Link>
            </div>
          </div>
        </div>
      </header>

      {!dimuat ? (
        <div role="status" className="flex flex-1 items-center justify-center p-10">
          <p className="animate-called text-lg font-semibold">Memuat data antrean…</p>
        </div>
      ) : galat && daftarTiket.length === 0 ? (
        <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center">
          <p className="text-lg font-semibold">Data live belum berhasil dimuat.</p>
          <p className="text-sm">{galat}</p>
          <button type="button" onClick={muatUlang} className="display-exit underline underline-offset-4">
            Coba lagi
          </button>
        </div>
      ) : (
        <main className="mx-auto grid w-full max-w-[1760px] flex-1 gap-5 p-4 sm:p-6 lg:grid-cols-[1.45fr_1fr] lg:items-stretch">
          {/* Kartu utama "Sedang Dipanggil" */}
          <section className="display-main flex min-h-[26.25rem] flex-col p-7 text-center sm:p-10">
            {utama ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="display-label flex items-center gap-2">
                    <IkonLonceng className="size-4" />
                    {utama.status === "dipanggil" ? "Sedang dipanggil" : "Sedang dilayani"}
                  </p>
                  <span className="display-status-pill">
                    <span aria-hidden className="display-status-dot" />
                    {utama.status === "dipanggil" ? "Dipanggil" : "Dilayani"}
                  </span>
                </div>
                <div aria-live="polite" className="display-number-glow flex flex-1 flex-col items-center justify-center py-6">
                  <p className="display-number">{utama.nomor}</p>
                  <div aria-hidden className="display-gold-rule my-4" />
                  <p className="text-[1.75rem] leading-tight font-bold">{namaLoket(utama.loketId)}</p>
                  <p className="mt-1.5 text-sm">{namaLayanan(utama.layananId)}</p>
                </div>
                <div className="display-info-strip mx-auto w-full max-w-md text-left">
                  <IkonInfo className="size-4" />
                  <p>Harap segera menuju loket tertera. Perhatikan barang bawaan Anda.</p>
                </div>
              </>
            ) : (
              <div aria-live="polite" className="flex flex-1 flex-col items-center justify-center py-6">
                <p className="display-number" aria-hidden>— — —</p>
                <p className="mt-5 text-2xl font-bold">Belum ada nomor yang dipanggil</p>
                <p className="mt-2 text-sm">Ambil nomor dan tunggu hingga loket tampil di layar ini.</p>
              </div>
            )}
          </section>

          {/* Kolom kanan: 3 panel satu sistem */}
          <div className="flex flex-col gap-5">
            <section aria-label="Dipanggil" className="display-panel">
              <h2 className="display-label flex items-center justify-between">
                Dipanggil <span className="display-count display-count-gold">{dipanggil.length}</span>
              </h2>
              {dipanggil.length === 0 ? (
                <p className="mt-2.5 text-sm">Tidak ada panggilan aktif.</p>
              ) : (
                <ul className="display-rows">
                  {dipanggil.slice(0, 3).map((q) => (
                    <li key={q.id} className={`display-row-called ${q.id === utama?.id ? "is-active" : ""}`}>
                      <span className="display-ticket text-2xl">{q.nomor}</span>
                      <span className="display-row-loket display-loket">{namaLoket(q.loketId)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Sedang dilayani" className="display-panel">
              <h2 className="display-label flex items-center justify-between">
                Sedang dilayani <span className="display-count display-count-mint">{dilayani.length}</span>
              </h2>
              {dilayani.length === 0 ? (
                <p className="mt-2.5 text-sm">Belum ada yang dilayani.</p>
              ) : (
                <ul className="display-rows">
                  {dilayani.slice(0, 3).map((q) => (
                    <li key={q.id} className="display-row-serving">
                      <span className="display-ticket text-2xl">{q.nomor}</span>
                      <span className="flex flex-col items-end gap-0.5">
                        <span className="display-loket text-[0.8125rem]">{namaLoket(q.loketId)}</span>
                        <span className="display-service-right text-xs">{namaLayanan(q.layananId)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Menunggu" className="display-panel flex flex-1 flex-col">
              <h2 className="display-label flex items-center justify-between">
                Menunggu <span className="display-count display-count-neutral">{menungguCount}</span>
              </h2>
              {menunggu.length === 0 ? (
                <p className="mt-2.5 text-sm">Tidak ada antrean menunggu.</p>
              ) : (
                <div className="display-fade-wrap flex-1">
                  <ul className="display-rows">
                    {menunggu.slice(0, 5).map((q, i) => (
                      <li key={q.id} className="display-row-waiting">
                        <span aria-hidden className="display-queue-num">{i + 1}</span>
                        <span className="display-ticket text-xl">{q.nomor}</span>
                        <span className="display-service text-xs">{namaLayanan(q.layananId)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </main>
      )}

      <footer className="display-header-rule px-5 py-3.5" style={{ borderBottom: "none", borderTop: "1px solid var(--border-soft)" }}>
        <p className="display-footer mx-auto flex max-w-[1760px] items-center justify-center gap-2 text-center">
          <span aria-hidden className="display-live-dot" />
          Data live · jam mengikuti zona Asia/Jakarta
        </p>
      </footer>
    </div>
  );
}
