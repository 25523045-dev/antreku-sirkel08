"use client";

import { useMemo, useState } from "react";
import { Alert, Card, CardBody, EmptyState, Input, LiveBadge, LoadingState, PageHeader, Select, StatusBadge } from "@/components/ui";
import { getCounter, getService } from "@/lib/data";
import { useLayananLive, useLoketLive, useTiketAdminLive } from "@/lib/supabase/hooks";
import { STATUS_LABEL, formatJam, formatWaktuLengkap } from "@/lib/format";
import { bandingWaktu } from "@/lib/queue";
import type { QueueStatus } from "@/lib/types";

function durasiMenit(isoAwal?: string | null, isoAkhir?: string | null): string {
  if (!isoAwal || !isoAkhir) return "—";
  const m = Math.round((new Date(isoAkhir).getTime() - new Date(isoAwal).getTime()) / 60000);
  return Number.isFinite(m) && m >= 0 ? `${m} mnt` : "—";
}

export default function Riwayat() {
  const { data: tiket, memuat, galat, muatUlang } = useTiketAdminLive(30);
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();
  const [cari, setCari] = useState("");
  const [fLayanan, setFLayanan] = useState("");
  const [fStatus, setFStatus] = useState("");

  const riwayat = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return tiket
      .filter((t) => ["selesai", "dibatalkan", "dilewati"].includes(t.status))
      .filter((t) => !fLayanan || t.layananId === fLayanan)
      .filter((t) => !fStatus || t.status === fStatus)
      .filter((t) => !k || `${t.nomor} ${t.namaPengunjung}`.toLowerCase().includes(k))
      .sort((a, b) => bandingWaktu(b.diambilPada, a.diambilPada));
  }, [tiket, cari, fLayanan, fStatus]);

  const namaLayanan = (id: string) =>
    daftarLayanan.find((s) => s.id === id)?.nama ?? getService(id)?.nama ?? id;
  const namaLoket = (id: string | null | undefined) =>
    daftarLoket.find((l) => l.id === id)?.nama ?? getCounter(id)?.nama ?? "—";

  return (
    <>
      <PageHeader eyebrow="Data & sistem" judul="Riwayat Antrean" deskripsi="Transaksi antrean 30 hari terakhir yang telah diproses beserta detail waktu dan durasi pelayanan." badge={<LiveBadge />} />

      <Card>
        <CardBody>
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
            <Input placeholder="Cari nomor / nama…" value={cari} onChange={(e) => setCari(e.target.value)} aria-label="Cari riwayat" />
            <Select value={fLayanan} onChange={(e) => setFLayanan(e.target.value)} aria-label="Filter layanan">
              <option value="">Semua layanan</option>
              {daftarLayanan.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </Select>
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter status">
              <option value="">Selesai + dilewati + dibatalkan</option>
              {(["selesai", "dilewati", "dibatalkan"] as QueueStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          </div>

          {memuat && tiket.length === 0 ? (
            <div className="mt-4"><LoadingState teks="Memuat riwayat…" /></div>
          ) : galat && tiket.length === 0 ? (
            <div className="mt-4"><Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert></div>
          ) : riwayat.length === 0 ? (
            <EmptyState judul="Belum ada riwayat yang cocok" deskripsi="Riwayat terisi setelah antrean selesai, dilewati, atau dibatalkan." />
          ) : (
            <ul className="mt-4 space-y-3">
              {riwayat.map((t) => (
                <li key={t.id} className="rounded-[12px] border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p><strong className="tnum font-mono text-lg text-navy-900 dark:text-white">{t.nomor}</strong> <span className="text-sm text-ink-600">· {t.namaPengunjung} · {namaLayanan(t.layananId)}</span></p>
                    <StatusBadge status={t.status} />
                  </div>
                  <dl className="mt-2 grid gap-2 text-[13px] text-ink-600 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-canvas px-3 py-2"><dt className="font-semibold text-ink-500">Diambil</dt><dd className="tnum font-bold text-ink-900">{formatJam(t.diambilPada)}</dd></div>
                    <div className="rounded-lg bg-canvas px-3 py-2"><dt className="font-semibold text-ink-500">Dipanggil</dt><dd className="tnum font-bold text-ink-900">{t.dipanggilPada ? formatJam(t.dipanggilPada) : "—"}</dd></div>
                    <div className="rounded-lg bg-canvas px-3 py-2"><dt className="font-semibold text-ink-500">Loket / Petugas</dt><dd className="font-bold text-ink-900">{namaLoket(t.loketId)} · {t.petugas ?? "—"}</dd></div>
                    <div className="rounded-lg bg-canvas px-3 py-2"><dt className="font-semibold text-ink-500">Durasi layani</dt><dd className="tnum font-bold text-ink-900">{durasiMenit(t.mulaiPada, t.selesaiPada)}</dd></div>
                  </dl>
                  <p className="mt-1.5 text-xs text-ink-500" title={formatWaktuLengkap(t.diambilPada)}>Detail: diambil {formatWaktuLengkap(t.diambilPada)}{t.selesaiPada ? ` · selesai ${formatWaktuLengkap(t.selesaiPada)}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </>
  );
}
