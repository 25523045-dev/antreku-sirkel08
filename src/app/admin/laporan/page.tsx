"use client";

import { Suspense, useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, EmptyState, LiveBadge, LoadingState, PageHeader } from "@/components/ui";
import { useLayananLive, useTiketAdminLive } from "@/lib/supabase/hooks";
import { todayJakarta } from "@/lib/format";

function bar(persen: number) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="img" aria-label={`${Math.round(persen)} persen`}>
      <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, Math.max(0, persen))}%` }} />
    </div>
  );
}

const RENTANG_HARI: Record<string, number> = { "hari-ini": 1, "7-hari": 7, "30-hari": 30 };

/** Tanggal Jakarta (YYYY-MM-DD) dari ISO timestamp. */
function tanggalDariISO(iso: string): string {
  return todayJakarta(new Date(iso));
}

export default function Laporan() {
  // Waktu-nyata dibaca saat render → di balik Suspense agar prerender aman.
  return (
    <Suspense fallback={<LoadingState teks="Memuat laporan…" />}>
      <IsiLaporan />
    </Suspense>
  );
}

function IsiLaporan() {
  const { data: semuaTiket, memuat, galat, muatUlang } = useTiketAdminLive(30);
  const { data: daftarLayanan } = useLayananLive();
  const [periode, setPeriode] = useState("hari-ini");

  const data = useMemo(() => {
    const batas = RENTANG_HARI[periode] ?? 1;
    const hariIni = todayJakarta();
    const keHari = (ymd: string) => Math.round((new Date(`${hariIni}T00:00:00+07:00`).getTime() - new Date(`${ymd}T00:00:00+07:00`).getTime()) / 86400000);
    return semuaTiket.filter((t) => {
      const selisih = keHari(tanggalDariISO(t.diambilPada));
      return selisih >= 0 && selisih < batas;
    });
  }, [semuaTiket, periode]);
  const total = data.length;
  const selesai = data.filter((t) => t.status === "selesai").length;
  const batal = data.filter((t) => t.status === "dibatalkan").length;
  const lewati = data.filter((t) => t.status === "dilewati").length;

  const perLayanan = daftarLayanan.map((s) => {
    const tiket = data.filter((t) => t.layananId === s.id);
    return {
      s,
      total: tiket.length,
      selesai: tiket.filter((t) => t.status === "selesai").length,
    };
  });
  const maks = Math.max(1, ...perLayanan.map((p) => p.total));

  function eksporCSV() {
    const header = "nomor,layanan,pengunjung,status,diambil,dipanggil,mulai,selesai,loket,petugas";
    const baris = data.map((t) => {
      const svc = daftarLayanan.find((s) => s.id === t.layananId);
      const sel = [t.nomor, svc?.nama ?? t.layananId, t.namaPengunjung, t.status, t.diambilPada, t.dipanggilPada ?? "", t.mulaiPada ?? "", t.selesaiPada ?? "", t.loketId ?? "", t.petugas ?? ""];
      return sel.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",");
    });
    const blob = new Blob([`\uFEFF${[header, ...baris].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-antrean-${periode}-${todayJakarta()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        eyebrow="Data & sistem"
        judul="Laporan Operasional"
        deskripsi="Ringkasan volume antrean dari database — angka aktual operasional."
        badge={<LiveBadge />}
        aksi={
          <>
            <div className="flex overflow-hidden rounded-[10px] border border-line bg-white text-sm font-bold dark:bg-white/5" role="group" aria-label="Filter periode">
              {["hari-ini", "7-hari", "30-hari"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriode(p)}
                  aria-pressed={periode === p}
                  className={`px-3.5 py-2.5 ${periode === p ? "bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950" : "text-navy-900 hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"}`}
                >
                  {p === "hari-ini" ? "Hari ini" : p === "7-hari" ? "7 hari" : "30 hari"}
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={eksporCSV}>Ekspor CSV</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {memuat && semuaTiket.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-4"><Card><LoadingState teks="Memuat laporan…" /></Card></div>
        ) : galat && semuaTiket.length === 0 ? (
          <div className="sm:col-span-2 xl:col-span-4"><Card><CardBody><Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert></CardBody></Card></div>
        ) : (
        [
          { label: "Volume antrean", nilai: total },
          { label: "Selesai", nilai: selesai },
          { label: "Dibatalkan", nilai: batal },
          { label: "Dilewati", nilai: lewati },
        ].map((k) => (
          <Card key={k.label}>
            <CardBody>
              <p className="text-sm font-medium text-ink-600">{k.label}</p>
              <p className="tnum mt-1 text-3xl font-bold text-navy-900 dark:text-white">{k.nilai}</p>
              <p className="mt-1 text-[13px] text-ink-500">
                {periode === "hari-ini" ? "Hari ini" : periode === "7-hari" ? "7 hari terakhir" : "30 hari terakhir"} · {todayJakarta()}
              </p>
            </CardBody>
          </Card>
        ))
        )}
      </div>

      {total === 0 && (
        <div className="mt-4">
          <Card><EmptyState judul="Belum ada data pada periode ini" deskripsi="Ubah filter periode atau tunggu pendaftar baru." /></Card>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Statistik per layanan</h2>
            <ul className="mt-3 space-y-3">
              {perLayanan.map(({ s, total: t, selesai: sl }) => (
                <li key={s.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-ink-900">{s.nama}</span>
                    <span className="tnum text-ink-600">{t} tiket · {sl} selesai</span>
                  </div>
                  <div className="mt-1.5">{bar((t / maks) * 100)}</div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Komposisi status</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                { label: "Selesai", n: selesai, warna: "bg-emerald-500" },
                { label: "Menunggu", n: data.filter((t) => t.status === "menunggu").length, warna: "bg-amber-400" },
                { label: "Dipanggil / dilayani", n: data.filter((t) => ["dipanggil", "dilayani"].includes(t.status)).length, warna: "bg-brand-600" },
                { label: "Dilewati", n: lewati, warna: "bg-slate-400" },
                { label: "Dibatalkan", n: batal, warna: "bg-red-500" },
              ].map((r) => (
                <li key={r.label}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold text-ink-900">
                      <span aria-hidden className={`size-2.5 rounded-full ${r.warna}`} />{r.label}
                    </span>
                    <span className="tnum text-ink-600">{r.n} ({total ? Math.round((r.n / total) * 100) : 0}%)</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className={`h-full rounded-full ${r.warna}`} style={{ width: `${total ? (r.n / total) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-[12px] bg-canvas px-4 py-3 text-[13px] leading-relaxed text-ink-600">
              Data di atas dibaca live dari database Supabase (30 hari terakhir). Ekspor CSV mengunduh periode yang sedang dipilih.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
