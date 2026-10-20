"use client";

import Link from "next/link";
import { Suspense } from "react";
import { PublicShell } from "@/components/site";
import { Alert, Card, CardBody, Ikon, LiveBadge, LoadingState, SectionHeading, StatusBadge } from "@/components/ui";
import { useLayananLive, useLoketLive, usePapanLive, usePengaturanLive } from "@/lib/supabase/hooks";
import { formatTanggalPanjang, todayJakarta } from "@/lib/format";
import type { QueueTicket } from "@/lib/types";

function hitungStatistik(tiket: QueueTicket[]) {
  const hariIni = tiket.filter((t) => t.tanggal === todayJakarta());
  const by = (s: QueueTicket["status"]) => hariIni.filter((t) => t.status === s).length;
  return {
    total: hariIni.length,
    menunggu: by("menunggu"),
    dipanggil: by("dipanggil"),
    dilayani: by("dilayani"),
    selesai: by("selesai"),
  };
}

export function BerandaClient() {
  return (
    <Suspense fallback={<LoadingState teks="Memuat beranda…" />}>
      <IsiBeranda />
    </Suspense>
  );
}

function IsiBeranda() {
  const { data: tiket } = usePapanLive();
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();
  const { data: pengaturan } = usePengaturanLive();

  const stats = hitungStatistik(tiket);
  const aktif = daftarLayanan.filter((s) => s.aktif);
  const loketBuka = daftarLoket.filter((l) => l.aktif).length;
  const tanggalPanjang = formatTanggalPanjang();
  const antreanAktif = stats.menunggu + stats.dipanggil + stats.dilayani;

  return (
    <PublicShell fullBleed>
      {/* ══ HERO full-bleed dua kolom ══ */}
      <section className="hero-navy relative overflow-hidden text-white">
        <div aria-hidden className="hero-grid absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-20 lg:pb-16">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <LiveBadge />
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase text-white/70">
                {pengaturan.namaInstansi}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[60px] lg:leading-[1.04]">
              Antrean kampus,
              <br />
              <span className="bg-gradient-to-r from-cyan-glow to-emerald-300 bg-clip-text text-transparent">
                tanpa antre berdiri.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Ambil nomor dari ponsel, pantau posisi Anda secara langsung, dan datang ke loket tepat saat
              dipanggil. Operasional {pengaturan.jamBuka}–{pengaturan.jamTutup} WIB · {tanggalPanjang}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ambil-antrean"
                className="inline-flex h-13 items-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-bold text-navy-900 shadow-hero transition-transform hover:-translate-y-0.5"
              >
                Ambil Nomor Antrean
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
              <Link
                href="/lacak-antrean"
                className="inline-flex h-13 items-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                Lacak Antrean
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { nilai: String(antreanAktif), label: "Antrean aktif" },
                { nilai: `${loketBuka}/${daftarLoket.length}`, label: "Loket buka" },
                { nilai: `${pengaturan.jamBuka}–${pengaturan.jamTutup}`, label: "Jam layanan" },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="tnum text-2xl font-extrabold">{s.nilai}</dd>
                  <dd className="mt-1 text-[13px] text-white/60">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual kanan: tiket + status live */}
          <div className="relative" aria-hidden={false}>
            <div className="animate-float relative rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-hero backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-white/60">Tiket digital</p>
                <StatusBadge status="dipanggil" pulse />
              </div>
              <div className="mt-4 rounded-2xl bg-white p-6 text-center text-navy-950">
                <p className="text-xs font-bold tracking-[0.18em] uppercase text-ink-500">Nomor Anda</p>
                <p className="tnum mt-1 font-mono text-7xl font-black tracking-tight">
                  {tiket.find((t) => t.status === "dipanggil")?.nomor ?? "—"}
                </p>
                <div className="tiket-perforasi my-4" />
                <div className="grid grid-cols-2 gap-3 text-left text-sm">
                  <div className="rounded-xl bg-canvas px-3 py-2.5">
                    <p className="text-[11px] font-bold uppercase text-ink-500">Loket</p>
                    <p className="font-bold text-navy-900">Loket 1</p>
                  </div>
                  <div className="rounded-xl bg-canvas px-3 py-2.5">
                    <p className="text-[11px] font-bold uppercase text-ink-500">Estimasi</p>
                    <p className="font-bold text-navy-900">± 8 mnt</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                {[
                  { label: "Menunggu", nilai: stats.menunggu },
                  { label: "Dipanggil", nilai: stats.dipanggil + stats.dilayani },
                  { label: "Selesai", nilai: stats.selesai },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-navy-950/60 px-2 py-3">
                    <p className="tnum text-2xl font-extrabold">{s.nilai}</p>
                    <p className="text-[11px] font-semibold text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
              <Link href="/display" className="mt-4 block rounded-xl bg-cyan-glow px-4 py-3 text-center text-sm font-bold text-navy-950 transition-transform hover:-translate-y-0.5">
                Buka Layar Antrean Publik
              </Link>
            </div>
          </div>
        </div>
        {/* strip bawah hero */}
        <div className="relative border-t border-white/10 bg-navy-950/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3.5 text-[13px] text-white/60 sm:px-6">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" />
              {stats.total} tiket tercatat hari ini (data live database)
            </span>
            <span className="hidden sm:inline">Layar antrean diperbarui otomatis dari database</span>
            <Link href="/masuk" className="ml-auto font-bold text-white hover:underline">Masuk sebagai Admin / Pengunjung →</Link>
          </div>
        </div>
      </section>

      {/* ══ LAYANAN ══ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow="Layanan"
          judul="Pilih layanan sesuai kebutuhan"
          deskripsi={`${aktif.length} layanan aktif tersedia hari ini. Setiap layanan memiliki prefix nomor dan estimasi durasi sendiri.`}
          aksi={
            <Link href="/ambil-antrean" className="inline-flex h-11 items-center rounded-xl bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">
              Ambil nomor →
            </Link>
          }
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {aktif.map((s, i) => (
            <article key={s.id} className="card-lift group relative overflow-hidden rounded-2xl border border-line bg-card p-0 shadow-card">
              <div aria-hidden className="h-1.5 bg-gradient-to-r from-navy-900 via-brand-600 to-cyan-glow" style={{ opacity: 0.85 }} />
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-navy-900 font-mono text-lg font-black text-white dark:bg-emerald-400 dark:text-navy-950">
                    {s.prefix}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
                    <span aria-hidden className="size-1.5 rounded-full bg-current" />
                    Buka · ±{s.estimasiMenit} mnt
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-bold tracking-[0.16em] uppercase text-ink-500">Layanan 0{i + 1} · {s.kode}</p>
                <h3 className="mt-1 text-lg font-extrabold text-navy-900 dark:text-white">{s.nama}</h3>
                <p className="mt-1.5 min-h-[42px] text-sm leading-relaxed text-ink-600">{s.deskripsi}</p>
                <Link
                  href={`/ambil-antrean?layanan=${s.id}`}
                  aria-label={`Ambil nomor antrean ${s.nama}`}
                  className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold text-navy-900 transition-colors group-hover:border-navy-900 group-hover:bg-navy-900 group-hover:text-white dark:text-white dark:group-hover:bg-white dark:group-hover:text-navy-900"
                >
                  Ambil nomor {s.prefix}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ══ CARA KERJA + LOKET ══ */}
      <section className="border-y border-line bg-white dark:bg-navy-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <SectionHeading
              eyebrow="Alur"
              judul="Tiga langkah selesai"
              deskripsi="Tanpa aplikasi tambahan, tanpa registrasi rumit."
            />
            <ol className="space-y-4">
              {[
                { ikon: "tiket" as const, judul: "Ambil nomor", teks: "Pilih layanan, isi nama, tekan “Ambil Nomor”. Simpan nomor tiket dan ID-nya." },
                { ikon: "lacak" as const, judul: "Pantau posisi", teks: "Lihat status, posisi, dan estimasi tunggu di Lacak Antrean atau Layar ruang tunggu." },
                { ikon: "loket" as const, judul: "Datang saat dipanggil", teks: "Menuju loket tertera saat nomor dipanggil. Bawa identitas bila diperlukan." },
              ].map((l, i) => (
                <li key={l.judul} className="flex gap-4 rounded-2xl border border-line bg-canvas p-5">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950">
                    <Ikon nama={l.ikon} />
                  </span>
                  <div>
                    <p className="font-extrabold text-navy-900 dark:text-white">
                      <span className="mr-2 font-mono text-sm text-ink-500">0{i + 1}</span>
                      {l.judul}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{l.teks}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <SectionHeading
              eyebrow="Operasional"
              judul="Status loket hari ini"
              deskripsi={`Jam layanan ${pengaturan.jamBuka}–${pengaturan.jamTutup} WIB. Data live dari database.`}
            />
            <Card>
              <CardBody className="p-0">
                <ul className="divide-y divide-line">
                  {daftarLoket.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-4 px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <span className={`flex size-11 items-center justify-center rounded-xl font-extrabold ${l.aktif ? "bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950" : "bg-slate-200 text-slate-500 dark:bg-white/10"}`}>
                          {l.nama.replace("Loket ", "L")}
                        </span>
                        <div>
                          <p className="font-bold text-ink-900">{l.nama}</p>
                          <p className="text-[13px] text-ink-500">{l.petugas ?? "Belum ditugaskan"} · {l.sedangMelayani ? `melayani ${l.sedangMelayani}` : "siap"}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${l.aktif ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-slate-100 text-slate-500 dark:bg-white/10"}`}>
                        <span aria-hidden className="size-1.5 rounded-full bg-current" />
                        {l.aktif ? "Buka" : "Tutup"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-line px-6 py-4">
                  <Alert tone="info">
                    Nomor dan status di halaman ini berasal dari <strong>database live</strong> (termasuk tiket yang baru diambil), bukan angka dekoratif.
                  </Alert>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="hero-navy relative overflow-hidden rounded-3xl px-8 py-12 text-center text-white sm:px-12">
          <div aria-hidden className="hero-grid absolute inset-0" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Siap mengambil nomor antrean Anda?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Proses kurang dari satu menit. Nomor tersimpan di database dan langsung terbaca admin, pelacakan, dan layar antrean.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/ambil-antrean" className="inline-flex h-12 items-center rounded-xl bg-white px-7 font-bold text-navy-900 hover:bg-brand-100">
                Ambil Nomor Sekarang
              </Link>
              <Link href="/display" className="inline-flex h-12 items-center rounded-xl border border-white/25 px-7 font-bold text-white hover:bg-white/10">
                Lihat Layar Antrean
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
