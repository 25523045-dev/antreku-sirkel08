"use client";

import Link from "next/link";
import { use } from "react";
import { PublicShell } from "@/components/site";
import { Alert, Button, Card, CardBody, LoadingState, SectionHeading, StatusBadge } from "@/components/ui";
import { getCounter, getService } from "@/lib/data";
import { useLayananLive, useLoketLive, usePapanLive, useTiketSayaLive } from "@/lib/supabase/hooks";
import { STATUS_LABEL, estimasiTungguMenit, formatEstimasi, formatWaktuLengkap } from "@/lib/format";
import { countAhead } from "@/lib/queue";
import type { QueueTicket } from "@/lib/types";

const TAHAP: Array<{ kunci: QueueTicket["status"] | "diambil"; label: string }> = [
  { kunci: "diambil", label: "Diambil" },
  { kunci: "menunggu", label: "Menunggu" },
  { kunci: "dipanggil", label: "Dipanggil" },
  { kunci: "dilayani", label: "Dilayani" },
  { kunci: "selesai", label: "Selesai" },
];

function tahapIndex(t: QueueTicket): number {
  if (t.status === "dibatalkan" || t.status === "dilewati") return 2;
  if (t.status === "menunggu") return 1;
  if (t.status === "dipanggil") return 2;
  if (t.status === "dilayani") return 3;
  if (t.status === "selesai") return 4;
  return 0;
}

export function TiketClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: papan, memuat } = usePapanLive();
  const { data: milikSaya } = useTiketSayaLive();
  const kunci = decodeURIComponent(id).trim().toUpperCase();

  // Papan publik (hari ini) + baris penuh bila pembuka adalah pemilik tiket.
  const dariPapan = papan.find((q) => q.nomor.toUpperCase() === kunci) ?? null;
  const penuh = milikSaya.find((t) => t.nomor.toUpperCase() === kunci) ?? null;
  const tiket = penuh ?? dariPapan;
  const status = memuat && !tiket ? "loading" : tiket ? "siap" : "tidak-ada";

  return (
    <PublicShell fullBleed>
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link href="/beranda" className="text-sm font-bold text-brand-700 hover:underline dark:text-brand-100">← Kembali ke beranda</Link>
        <div className="mt-2">
          <SectionHeading eyebrow="Tiket digital" judul="Tiket Antrean" deskripsi="Simpan nomor tiket. Status diperbarui otomatis mengikuti tindakan admin." />
        </div>

        {status === "loading" && (
          <Card className="mt-2"><LoadingState teks="Memuat tiket…" /></Card>
        )}

        {status === "tidak-ada" && (
          <Card className="mt-2">
            <CardBody className="sm:p-8">
              <Alert tone="warning">
                <strong>Tiket “{decodeURIComponent(id)}” tidak ditemukan.</strong>
                <span className="mt-1 block">Periksa penulisan nomor (contoh: A-007) atau ambil nomor baru. Hanya tiket hari ini yang tampil di papan publik.</span>
              </Alert>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link href="/ambil-antrean" className="inline-flex h-12 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">Ambil Nomor Baru</Link>
                <Link href="/lacak-antrean" className="inline-flex h-12 items-center justify-center rounded-xl border border-line text-sm font-bold text-navy-900 dark:text-white">Lacak Nomor Lain</Link>
              </div>
            </CardBody>
          </Card>
        )}

        {status === "siap" && tiket && <TiketBody tiket={tiket} milikSendiri={!!penuh} />}
      </section>
    </PublicShell>
  );
}

function TiketBody({ tiket: dimuat, milikSendiri }: { tiket: QueueTicket; milikSendiri: boolean }) {
  const { data: papan } = usePapanLive();
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();
  const segar = papan.find((t) => t.nomor.toUpperCase() === dimuat.nomor.toUpperCase());
  const tiket = milikSendiri ? dimuat : (segar ?? dimuat);
  const svc = daftarLayanan.find((s) => s.id === tiket.layananId) ?? getService(tiket.layananId);
  const loket = daftarLoket.find((l) => l.id === tiket.loketId) ?? getCounter(tiket.loketId);
  const depan = countAhead(papan, tiket);
  const estimasi = svc ? formatEstimasi(estimasiTungguMenit(depan, svc.estimasiMenit)) : "—";
  const idx = tahapIndex(tiket);

  return (
    <div>
      {/* Tiket digital */}
      <article className="overflow-hidden rounded-3xl border border-line bg-card shadow-lift">
        <div className="hero-navy relative px-8 py-10 text-center text-white sm:px-12">
          <div aria-hidden className="hero-grid absolute inset-0" />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/60">{svc?.nama ?? "Layanan"} · {tiket.tanggal}</p>
            <p className="tnum mt-2 font-mono text-8xl font-black tracking-tight sm:text-9xl">{tiket.nomor}</p>
            <p className="tnum mt-3 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-mono text-xs text-white/85">
              {milikSendiri ? `ID tiket: ${tiket.id}` : "Tiket hari ini · papan publik"}
            </p>
            <div className="mt-4 flex justify-center"><StatusBadge status={tiket.status} pulse /></div>
          </div>
        </div>
        <div className="tiket-perforasi mx-8" />
        <div className="grid gap-3 px-6 py-6 sm:grid-cols-3 sm:px-8">
          {[
            { label: "Nama pengunjung", nilai: tiket.namaPengunjung || "Disembunyikan (layar publik)" },
            { label: "Layanan", nilai: `${svc?.nama ?? tiket.layananId} (${svc?.kode ?? "—"})` },
            { label: "Loket", nilai: loket?.nama ?? "Menunggu penugasan" },
            { label: "Waktu pengambilan", nilai: formatWaktuLengkap(tiket.diambilPada) },
            { label: "Antrean di depan", nilai: `${depan} orang` },
            { label: "Perkiraan tunggu", nilai: estimasi },
          ].map((f) => (
            <div key={f.label} className="rounded-2xl bg-canvas px-4 py-3.5">
              <p className="text-[11px] font-bold tracking-wide uppercase text-ink-500">{f.label}</p>
              <p className="mt-1 text-[15px] font-bold text-ink-900">{f.nilai}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-6 py-5 sm:px-8">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-500">Progres antrean</p>
          <ol className="mt-3 flex items-center" aria-label="Progres antrean">
            {TAHAP.map((tahap, i) => {
              const done = i <= idx;
              return (
                <li key={tahap.kunci} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span aria-hidden className={done ? "flex size-8 items-center justify-center rounded-full bg-navy-900 text-xs font-black text-white dark:bg-emerald-400 dark:text-navy-950" : "flex size-8 items-center justify-center rounded-full border border-line text-xs font-bold text-ink-500"}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={done ? "text-[11px] font-bold text-navy-900 dark:text-white" : "text-[11px] font-semibold text-ink-500"}>{tahap.label}</span>
                  </div>
                  {i < TAHAP.length - 1 && <span aria-hidden className={`mx-2 mb-5 h-0.5 flex-1 rounded ${i < idx ? "bg-navy-900 dark:bg-emerald-400" : "stepper-line"}`} />}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-[13px] text-ink-500">Status saat ini: <strong className="text-ink-900">{STATUS_LABEL[tiket.status]}</strong></p>
        </div>
      </article>

      <div className="mt-5">
        <Alert tone={tiket.status === "menunggu" ? "info" : "success"}>
          {tiket.status === "menunggu" && "Mohon tetap di area tunggu dan perhatikan Layar Antrean. Nomor Anda akan dipanggil sesuai urutan."}
          {tiket.status === "dipanggil" && "Nomor Anda sedang dipanggil — segera menuju loket yang tertera."}
          {tiket.status === "dilayani" && "Anda sedang dilayani petugas. Siapkan dokumen yang diperlukan."}
          {tiket.status === "selesai" && "Pelayanan selesai. Terima kasih atas kunjungan Anda."}
          {tiket.status === "dilewati" && "Nomor Anda dilewati karena tidak hadir saat dipanggil. Hubungi petugas untuk penjadwalan ulang."}
          {tiket.status === "dibatalkan" && "Tiket ini telah dibatalkan dan tidak berlaku lagi."}
        </Alert>
      </div>

      <div className="no-print mt-5 grid gap-2 sm:grid-cols-3">
        <Link href="/lacak-antrean" className="inline-flex h-12 items-center justify-center rounded-xl bg-navy-900 text-sm font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">Lacak Status</Link>
        <Link href="/display" className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-white text-sm font-bold text-navy-900 dark:bg-white/5 dark:text-white">Buka Layar Antrean</Link>
        <Button variant="secondary" size="lg" onClick={() => window.print()}>Cetak / Simpan</Button>
      </div>
    </div>
  );
}
