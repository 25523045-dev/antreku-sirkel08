"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Alert, Card, CardBody, EmptyState, Ikon, LiveBadge, LoadingState, PageHeader, StatusBadge } from "@/components/ui";
import { getCounter, getService } from "@/lib/data";
import { useLayananLive, useLoketLive, useTiketAdminLive } from "@/lib/supabase/hooks";
import { formatJam, formatTanggalPanjang, todayJakarta } from "@/lib/format";
import { bandingWaktu } from "@/lib/queue";
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
    dilewati: by("dilewati"),
    dibatalkan: by("dibatalkan"),
  };
}

export function DashboardClient() {
  return (
    <Suspense fallback={<LoadingState teks="Memuat dashboard…" />}>
      <IsiDashboard />
    </Suspense>
  );
}

const STAT_STYLE = [
  { ikon: "tiket" as const, grad: "from-navy-900 to-navy-700", chip: "bg-navy-900/5 text-navy-900 dark:bg-white/10 dark:text-white" },
  { ikon: "antrean" as const, grad: "from-amber-500 to-orange-500", chip: "bg-amber-50 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200" },
  { ikon: "loket" as const, grad: "from-brand-600 to-emerald-500", chip: "bg-brand-50 text-brand-700 dark:bg-emerald-400/15 dark:text-emerald-200" },
  { ikon: "cek" as const, grad: "from-emerald-500 to-teal-500", chip: "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" },
];

function IsiDashboard() {
  const { data: tiket, memuat, galat, muatUlang } = useTiketAdminLive(1);
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();

  const s = hitungStatistik(tiket);
  const terbaru = [...tiket].sort((a, b) => bandingWaktu(b.diambilPada, a.diambilPada)).slice(0, 7);
  const aktifPanel = tiket.filter((q) => ["dipanggil", "dilayani"].includes(q.status)).slice(0, 4);
  const tanggalPanjang = formatTanggalPanjang();

  const namaLayanan = (id: string) =>
    daftarLayanan.find((x) => x.id === id)?.nama ?? getService(id)?.nama ?? "—";
  const namaLoket = (id: string | null | undefined) =>
    daftarLoket.find((l) => l.id === id)?.nama ?? getCounter(id)?.nama ?? "—";

  const aktivitas = [...tiket]
    .flatMap((t) => {
      const entri: Array<{ waktu: string; teks: string }> = [];
      if (t.dipanggilPada) entri.push({ waktu: t.dipanggilPada, teks: `${t.nomor} dipanggil${t.loketId ? ` di ${namaLoket(t.loketId)}` : ""}${t.petugas ? ` oleh ${t.petugas}` : ""}` });
      if (t.mulaiPada) entri.push({ waktu: t.mulaiPada, teks: `${t.nomor} mulai dilayani${t.loketId ? ` di ${namaLoket(t.loketId)}` : ""}` });
      if (t.selesaiPada) entri.push({ waktu: t.selesaiPada, teks: `${t.nomor} selesai dilayani${t.loketId ? ` di ${namaLoket(t.loketId)}` : ""}` });
      else if (t.status === "selesai") entri.push({ waktu: t.diambilPada, teks: `${t.nomor} selesai dilayani` });
      if (t.status === "dilewati" && t.dipanggilPada) entri.push({ waktu: t.dipanggilPada, teks: `${t.nomor} dilewati (tidak hadir)` });
      if (t.status === "dibatalkan") entri.push({ waktu: t.diambilPada, teks: `${t.nomor} dibatalkan` });
      return entri;
    })
    .sort((a, b) => bandingWaktu(b.waktu, a.waktu))
    .slice(0, 6);

  const perLayanan = daftarLayanan
    .map((svc) => ({ svc, jumlah: tiket.filter((q) => q.layananId === svc.id).length }))
    .sort((a, b) => b.jumlah - a.jumlah);
  const maksLayanan = Math.max(1, ...perLayanan.map((p) => p.jumlah));

  const kartu = [
    { label: "Total antrean hari ini", nilai: s.total, sub: `${s.menunggu} menunggu · ${s.dipanggil + s.dilayani} aktif`, href: "/admin/antrean" },
    { label: "Menunggu panggilan", nilai: s.menunggu, sub: "Perlu segera dipanggil", href: "/admin/antrean" },
    { label: "Aktif (panggil + layan)", nilai: s.dipanggil + s.dilayani, sub: `${s.dipanggil} dipanggil · ${s.dilayani} dilayani`, href: "/admin/antrean" },
    { label: "Selesai", nilai: s.selesai, sub: `${s.dilewati} dilewati · ${s.dibatalkan} dibatalkan`, href: "/admin/riwayat" },
  ];

  return (
    <>
      <PageHeader
        judul="Dashboard Operasional"
        deskripsi={`Ringkasan live ${tanggalPanjang} (Asia/Jakarta) — seluruh angka dihitung dari tiket aktual di database.`}
        badge={<LiveBadge />}
        eyebrow="Panel admin"
        aksi={
          <>
            <Link href="/admin/antrean" className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">
              Kelola Antrean →
            </Link>
            <Link href="/display" className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-5 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:bg-white/5 dark:text-white">
              Layar Publik
            </Link>
          </>
        }
      />

      {/* 4 kartu statistik besar */}
      {memuat && tiket.length === 0 ? (
        <LoadingState teks="Memuat data live…" />
      ) : galat && tiket.length === 0 ? (
        <Alert tone="error">
          Data live belum berhasil dimuat ({galat}).{" "}
          <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button>
        </Alert>
      ) : (
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((k, i) => (
          <Link key={k.label} href={k.href} className="card-lift block rounded-2xl" aria-label={`${k.label}: ${k.nilai}`}>
            <Card className="h-full overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${STAT_STYLE[i].grad}`} aria-hidden />
              <CardBody>
                <div className="flex items-center justify-between">
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${STAT_STYLE[i].chip}`}>
                    <Ikon nama={STAT_STYLE[i].ikon} />
                  </span>
                  <span className="tnum rounded-full bg-canvas px-2.5 py-1 font-mono text-xs font-bold text-ink-600">live</span>
                </div>
                <p className="tnum mt-4 text-[42px] leading-none font-black tracking-tight text-navy-900 dark:text-white">{k.nilai}</p>
                <p className="mt-2 text-sm font-bold text-ink-900">{k.label}</p>
                <p className="mt-0.5 text-[13px] text-ink-500">{k.sub}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
      )}

      {/* Dua kolom proporsional */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Tabel antrean terbaru */}
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-4 dark:bg-white/5">
            <div>
              <h2 className="font-extrabold text-navy-900 dark:text-white">Antrean terbaru</h2>
              <p className="text-[13px] text-ink-500">7 tiket paling baru · kelola di halaman Antrean</p>
            </div>
            <Link href="/admin/antrean" className="inline-flex h-10 items-center rounded-xl bg-navy-900 px-4 text-sm font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">
              Lihat semua →
            </Link>
          </div>
          {terbaru.length === 0 ? (
            <EmptyState judul="Belum ada antrean" deskripsi="Antrean yang diambil pengunjung akan tampil di sini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-admin w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-canvas/60 text-[11px] uppercase tracking-[0.12em] text-ink-500">
                    <th scope="col" className="px-6 py-3 font-bold">Nomor</th>
                    <th scope="col" className="px-3 py-3 font-bold">Pengunjung</th>
                    <th scope="col" className="px-3 py-3 font-bold">Layanan</th>
                    <th scope="col" className="px-3 py-3 font-bold">Diambil</th>
                    <th scope="col" className="px-6 py-3 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {terbaru.map((q) => (
                    <tr key={q.id}>
                      <td className="tnum px-6 py-3.5 font-mono font-black text-navy-900 dark:text-white">{q.nomor}</td>
                      <td className="px-3 py-3.5 font-semibold">{q.namaPengunjung}</td>
                      <td className="px-3 py-3.5 text-ink-600">{namaLayanan(q.layananId)}</td>
                      <td className="tnum px-3 py-3.5 text-ink-600">{formatJam(q.diambilPada)}</td>
                      <td className="px-6 py-3.5 text-right"><StatusBadge status={q.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          {/* Panel panggilan aktif */}
          <Card className="overflow-hidden">
            <div className="border-b border-line bg-navy-950 px-6 py-4 text-white">
              <h2 className="font-extrabold">Panggilan aktif</h2>
              <p className="text-[13px] text-white/60">{aktifPanel.length} nomor di loket sekarang</p>
            </div>
            <CardBody>
              {aktifPanel.length === 0 ? (
                <p className="text-sm text-ink-600">Belum ada nomor yang dipanggil.</p>
              ) : (
                <ul className="space-y-2.5">
                  {aktifPanel.map((q) => (
                    <li key={q.id} className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-canvas px-4 py-3 text-sm">
                      <span><strong className="tnum font-mono text-base">{q.nomor}</strong> <span className="text-ink-500">· {namaLoket(q.loketId)}</span></span>
                      <StatusBadge status={q.status} pulse />
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/antrean" className="mt-3 block rounded-xl border border-line px-4 py-2.5 text-center text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white">
                Panggil berikutnya →
              </Link>
            </CardBody>
          </Card>

          {/* Aktivitas + layanan */}
          <Card>
            <CardBody>
              <h2 className="font-extrabold text-navy-900 dark:text-white">Aktivitas terbaru</h2>
              <p className="text-xs text-ink-500">Otomatis dari waktu tiket aktual</p>
              {aktivitas.length === 0 ? (
                <p className="mt-3 text-sm text-ink-600">Belum ada aktivitas tercatat.</p>
              ) : (
                <ol className="relative mt-4 space-y-4 border-l-2 border-line pl-5">
                  {aktivitas.map((a, i) => (
                    <li key={`${a.waktu}-${i}`} className="relative text-sm">
                      <span aria-hidden className="absolute top-1 -left-[29px] size-3 rounded-full border-2 border-card bg-brand-600" />
                      <p className="text-ink-600">{a.teks}</p>
                      <p className="tnum font-mono text-xs text-ink-500">{formatJam(a.waktu)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="font-extrabold text-navy-900 dark:text-white">Beban per layanan</h2>
              <ul className="mt-3 space-y-3">
                {perLayanan.map(({ svc, jumlah }) => (
                  <li key={svc.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-ink-900">{svc.nama}</span>
                      <span className="tnum text-ink-600">{jumlah} tiket</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-navy-900 to-brand-500 dark:from-emerald-400 dark:to-cyan-glow" style={{ width: `${(jumlah / maksLayanan) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
