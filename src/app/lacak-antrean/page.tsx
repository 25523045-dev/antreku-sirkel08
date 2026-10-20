"use client";

import Link from "next/link";
import { useState } from "react";
import { PublicShell } from "@/components/site";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LoadingState, SectionHeading, StatusBadge } from "@/components/ui";
import { getCounter } from "@/lib/data";
import { useLayananLive, useLoketLive, usePapanLive, useTiketSayaLive } from "@/lib/supabase/hooks";
import { estimasiTungguMenit, formatEstimasi, formatWaktuLengkap } from "@/lib/format";
import { countAhead } from "@/lib/queue";
import type { QueueTicket } from "@/lib/types";

type CariState = "idle" | "loading" | "ketemu" | "tidak-ada";

export default function LacakAntrean() {
  const { data: daftarTiket, memuat } = usePapanLive();
  const [nomor, setNomor] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [state, setState] = useState<CariState>("idle");
  const [hasil, setHasil] = useState<QueueTicket | null>(null);

  function cari(ev: React.FormEvent) {
    ev.preventDefault();
    const kunci = nomor.trim().toUpperCase();
    if (kunci.length < 3) {
      setError("Masukkan nomor antrean, contoh: A-004.");
      return;
    }
    setError(undefined);
    setState("loading");
    const found = daftarTiket.find((q) => q.nomor.toUpperCase() === kunci) ?? null;
    setHasil(found);
    setState(found ? "ketemu" : "tidak-ada");
  }

  const live = daftarTiket.filter((q) => ["dipanggil", "dilayani"].includes(q.status)).slice(0, 5);

  return (
    <PublicShell fullBleed>
      <section className="border-b border-line bg-white dark:bg-navy-950">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <SectionHeading
            eyebrow="Pemantauan antrean"
            judul="Lacak Antrean"
            deskripsi="Masukkan nomor tiket untuk melihat status live, posisi, dan perkiraan tunggu dari database yang sama dengan admin."
          />
          <Card className="overflow-hidden shadow-lift">
            <div className="bg-navy-950 px-6 py-5 sm:px-8">
              <form onSubmit={cari} noValidate>
                <Label htmlFor="nomor"><span className="text-white">Nomor antrean</span></Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input id="nomor" placeholder="cth. A-004" value={nomor} onChange={(e) => setNomor(e.target.value.toUpperCase())} className="tnum h-13 font-mono text-lg font-bold uppercase" maxLength={12} />
                  <Button type="submit" size="lg" className="sm:w-48" loading={state === "loading"}>
                    {state === "loading" ? "Mencari…" : "Lacak →"}
                  </Button>
                </div>
                <FieldError message={error} />
              </form>
            </div>
            <CardBody className="sm:p-7">
              <div aria-live="polite">
                {state === "idle" && (
                  <div className="rounded-2xl border border-dashed border-line bg-canvas px-5 py-4 text-sm text-ink-600">
                    {memuat ? "Memuat data live…" : (<>Contoh nomor yang dapat dilacak: <strong className="tnum font-mono">A-004</strong>, <strong className="tnum font-mono">B-002</strong>, <strong className="tnum font-mono">C-001</strong> — atau nomor yang baru Anda ambil.</>)}
                  </div>
                )}
                {state === "loading" && <LoadingState teks="Mencari nomor antrean…" />}
                {state === "tidak-ada" && (
                  <Alert tone="warning">
                    <strong>Nomor “{nomor.trim().toUpperCase()}” tidak ditemukan.</strong>
                    <span className="mt-1 block">Periksa penulisan atau pastikan tiket diambil pada hari yang sama.</span>
                  </Alert>
                )}
                {state === "ketemu" && hasil && <HasilLacak tiket={hasil} />}
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-navy-900 dark:text-white">Live dari layar antrean</h2>
                <Link href="/display" className="text-sm font-bold text-brand-700 hover:underline dark:text-brand-100">Buka display →</Link>
              </div>
              {live.length === 0 ? (
                <p className="mt-2 text-sm text-ink-600">Belum ada nomor yang dipanggil.</p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {live.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3 text-sm">
                      <span><strong className="tnum font-mono text-base">{q.nomor}</strong> <span className="text-ink-500">· {getCounter(q.loketId)?.nama ?? "—"}</span></span>
                      <StatusBadge status={q.status} pulse />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}

const PROGRES = ["Diambil", "Menunggu", "Dipanggil", "Selesai"] as const;

function progresIndex(t: QueueTicket): number {
  if (t.status === "selesai") return 3;
  if (t.status === "dipanggil" || t.status === "dilayani" || t.status === "dilewati") return 2;
  return 1;
}

function HasilLacak({ tiket: awal }: { tiket: QueueTicket }) {
  const { data: papan } = usePapanLive();
  const { data: layanan } = useLayananLive();
  const { data: loket } = useLoketLive();
  const { data: milikSaya } = useTiketSayaLive();
  // Tingkatkan ke baris penuh bila pelacak adalah pemilik tiket (RLS owner).
  const penuh = milikSaya.find((t) => t.nomor.toUpperCase() === awal.nomor.toUpperCase());
  const segar = papan.find((t) => t.nomor.toUpperCase() === awal.nomor.toUpperCase());
  const tiket = penuh ?? segar ?? awal;
  const svc = layanan.find((s) => s.id === tiket.layananId);
  const loketTiket = loket.find((l) => l.id === tiket.loketId) ?? getCounter(tiket.loketId);
  const depan = countAhead(papan, { ...tiket, id: tiket.id });
  const estimasi = svc ? formatEstimasi(estimasiTungguMenit(depan, svc.estimasiMenit)) : "—";
  const idx = progresIndex(tiket);

  return (
    <div role="status" className="overflow-hidden rounded-2xl border-2 border-navy-900/10 dark:border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-950 px-6 py-5 text-white">
        <div>
          <p className="tnum font-mono text-4xl font-black">{tiket.nomor}</p>
          <p className="tnum mt-1 font-mono text-xs text-white/60">
            {penuh ? `ID: ${tiket.id} · ${tiket.namaPengunjung}` : "Tiket milik orang lain — nama disembunyikan"}
          </p>
        </div>
        <StatusBadge status={tiket.status} pulse />
      </div>
      <div className="px-6 py-5">
        <ol className="flex items-center" aria-label="Progres antrean">
          {PROGRES.map((label, i) => {
            const done = i <= idx;
            return (
              <li key={label} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <span aria-hidden className={done ? "flex size-8 items-center justify-center rounded-full bg-navy-900 text-xs font-black text-white dark:bg-emerald-400 dark:text-navy-950" : "flex size-8 items-center justify-center rounded-full border border-line text-xs font-bold text-ink-500"}>{done ? "✓" : i + 1}</span>
                  <span className={done ? "text-[11px] font-bold text-navy-900 dark:text-white" : "text-[11px] text-ink-500"}>{label}</span>
                </div>
                {i < PROGRES.length - 1 && <span aria-hidden className={`mx-2 mb-5 h-0.5 flex-1 rounded ${i < idx ? "bg-navy-900 dark:bg-emerald-400" : "stepper-line"}`} />}
              </li>
            );
          })}
        </ol>
        <dl className="mt-5 grid gap-2.5 text-sm sm:grid-cols-2">
          {[
            ["Layanan", svc?.nama ?? tiket.layananId],
            ["Diambil", formatWaktuLengkap(tiket.diambilPada)],
            ["Posisi", `${depan} antrean di depan Anda`],
            ["Perkiraan tunggu", estimasi],
            ["Loket", loketTiket?.nama ?? "Menunggu penugasan"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-4 py-3">
              <dt className="text-ink-500">{k}</dt>
              <dd className="text-right font-bold text-ink-900">{v}</dd>
            </div>
          ))}
        </dl>
        <Link href={`/tiket/${tiket.nomor}`} className="mt-4 inline-block text-sm font-bold text-brand-700 hover:underline dark:text-brand-100">
          Buka detail tiket lengkap →
        </Link>
      </div>
    </div>
  );
}
