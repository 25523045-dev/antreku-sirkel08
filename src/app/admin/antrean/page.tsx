"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, EmptyState, Input, LiveBadge, LoadingState, PageHeader, Pagination, Select, StatusBadge } from "@/components/ui";
import { getService } from "@/lib/data";
import { useLayananLive, useLoketLive, useTiketAdminLive } from "@/lib/supabase/hooks";
import { rpcPanggilUlang, rpcUbahStatus } from "@/lib/supabase/queries";
import { STATUS_LABEL, formatJam } from "@/lib/format";
import { allowedTransitions, bandingWaktu, canTransition, nextWaiting } from "@/lib/queue";
import type { Counter, QueueStatus } from "@/lib/types";

/** Pilih loket aktif yang mendukung layanan tiket (fallback: loket aktif mana pun). */
function pilihLoket(layananId: string, daftarLoket: Counter[]): string | null {
  return (
    daftarLoket.find((l) => l.aktif && l.layananIds.includes(layananId))?.id ??
    daftarLoket.find((l) => l.aktif)?.id ??
    null
  );
}

export default function KelolaAntrean() {
  const { data: tiket, memuat, galat, muatUlang } = useTiketAdminLive(1);
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarLoket } = useLoketLive();
  const [cari, setCari] = useState("");
  const [fLayanan, setFLayanan] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [halaman, setHalaman] = useState(1);
  const [pesan, setPesan] = useState<{ nada: "success" | "error" | "info"; teks: string } | null>(null);
  const [aksiId, setAksiId] = useState<string | null>(null);
  const PER_HALAMAN = 8;

  function namaLayanan(id: string): string {
    return daftarLayanan.find((s) => s.id === id)?.nama ?? getService(id)?.nama ?? id;
  }

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return tiket.filter((t) => {
      if (fLayanan && t.layananId !== fLayanan) return false;
      if (fStatus && t.status !== fStatus) return false;
      if (k && !(`${t.nomor} ${t.namaPengunjung}`.toLowerCase().includes(k))) return false;
      return true;
    }).sort((a, b) => bandingWaktu(a.diambilPada, b.diambilPada));
  }, [tiket, cari, fLayanan, fStatus]);

  function aturCari(v: string) {
    setCari(v);
    setHalaman(1);
  }
  function aturLayanan(v: string) {
    setFLayanan(v);
    setHalaman(1);
  }
  function aturStatus(v: string) {
    setFStatus(v);
    setHalaman(1);
  }

  async function ubahStatus(id: string, ke: QueueStatus, butuhKonfirmasi?: string) {
    const target = tiket.find((t) => t.id === id);
    if (!target) return;
    if (!canTransition(target.status, ke)) {
      setPesan({ nada: "error", teks: `${target.nomor}: tidak dapat diubah dari “${STATUS_LABEL[target.status]}” menjadi “${STATUS_LABEL[ke]}”. Transisi yang diizinkan: ${allowedTransitions(target.status).map((s) => STATUS_LABEL[s]).join(", ") || "—"}.` });
      return;
    }
    if (butuhKonfirmasi && !window.confirm(butuhKonfirmasi)) return;
    // Loket pendukung layanan; server (RPC) memvalidasi ulang + sinkronkan
    // penanda "sedang melayani" agar display & halaman loket ikut mutakhir.
    const loketId = ke === "dipanggil" ? (target.loketId ?? pilihLoket(target.layananId, daftarLoket)) : undefined;
    setAksiId(id);
    try {
      const hasil = await rpcUbahStatus(id, ke, loketId);
      setPesan({ nada: "success", teks: `${hasil.nomor} berhasil diubah menjadi “${STATUS_LABEL[ke]}”. (Tersimpan di database.)` });
      muatUlang();
    } catch (e) {
      setPesan({ nada: "error", teks: e instanceof Error ? e.message : "Perubahan status gagal. Coba lagi." });
    } finally {
      setAksiId(null);
    }
  }

  function panggilBerikutnya() {
    const next = nextWaiting(tiket);
    if (!next) {
      setPesan({ nada: "info", teks: "Tidak ada antrean menunggu. Semua sudah diproses atau belum ada pendaftar baru." });
      return;
    }
    void ubahStatus(next.id, "dipanggil");
  }

  /** Panggil ulang: nomor sudah berstatus dipanggil, segarkan waktu panggilnya. */
  async function panggilUlang(id: string) {
    const target = tiket.find((t) => t.id === id);
    if (!target || target.status !== "dipanggil") return;
    setAksiId(id);
    try {
      const hasil = await rpcPanggilUlang(id);
      setPesan({ nada: "success", teks: `${hasil.nomor} dipanggil ulang di ${hasil.loketId ? hasil.loketId.replace("loket-", "Loket ") : "loket yang sama"}. (Tersimpan di database.)` });
      muatUlang();
    } catch (e) {
      setPesan({ nada: "error", teks: e instanceof Error ? e.message : "Panggil ulang gagal. Coba lagi." });
    } finally {
      setAksiId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Operasional antrean"
        judul="Manajemen Antrean"
        deskripsi="Panggil, layani, dan selesaikan antrean. Tombol aksi otomatis nonaktif bila tidak sesuai status."
        badge={<LiveBadge />}
        aksi={<Button size="lg" onClick={panggilBerikutnya}>Panggil Berikutnya →</Button>}
      />

      {pesan && (
        <div className="mb-4" role={pesan.nada === "error" ? "alert" : "status"}>
          <Alert tone={pesan.nada === "success" ? "success" : pesan.nada === "error" ? "error" : "info"}>
            {pesan.teks}
          </Alert>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-4 dark:bg-white/5">
          <div>
            <h2 className="font-extrabold text-navy-900 dark:text-white">Daftar antrean</h2>
            <p className="text-[13px] text-ink-500">{tersaring.length} data · aksi mengikuti aturan transisi status</p>
          </div>
          <span className="tnum rounded-full bg-canvas px-3 py-1.5 font-mono text-xs font-bold text-ink-600">hal. {halaman}</span>
        </div>
        <CardBody>
          <div className="grid gap-3 rounded-2xl border border-line bg-canvas p-3 md:grid-cols-[1.4fr_1fr_1fr] dark:bg-white/5">
            <Input placeholder="Cari nomor atau nama… (cth. A-00 / Nadia)" value={cari} onChange={(e) => aturCari(e.target.value)} aria-label="Cari antrean" />
            <Select value={fLayanan} onChange={(e) => aturLayanan(e.target.value)} aria-label="Filter layanan">
              <option value="">Semua layanan</option>
              {daftarLayanan.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </Select>
            <Select value={fStatus} onChange={(e) => aturStatus(e.target.value)} aria-label="Filter status">
              <option value="">Semua status</option>
              {(Object.keys(STATUS_LABEL) as QueueStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </Select>
          </div>

          {memuat && tiket.length === 0 ? (
            <LoadingState teks="Memuat antrean live…" />
          ) : galat && tiket.length === 0 ? (
            <div className="mt-4"><Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert></div>
          ) : tersaring.length === 0 ? (
            <EmptyState judul="Belum ada antrean yang cocok" deskripsi="Ubah kata kunci atau filter, atau tunggu pendaftar baru." />
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="table-admin w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wider text-ink-500">
                      <th scope="col" className="py-2 pr-3 font-bold">Nomor</th>
                      <th scope="col" className="py-2 pr-3 font-bold">Pengunjung</th>
                      <th scope="col" className="py-2 pr-3 font-bold">Layanan</th>
                      <th scope="col" className="py-2 pr-3 font-bold">Diambil</th>
                      <th scope="col" className="py-2 pr-3 font-bold">Status</th>
                      <th scope="col" className="py-2 font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {tersaring.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN).map((t) => {
                      const sibuk = aksiId === t.id;
                      return (
                      <tr key={t.id}>
                        <td className="tnum py-2.5 pr-3 font-mono font-bold text-navy-900 dark:text-white">{t.nomor}</td>
                        <td className="py-2.5 pr-3">{t.namaPengunjung}</td>
                        <td className="py-2.5 pr-3 text-ink-600">{namaLayanan(t.layananId)}</td>
                        <td className="tnum py-2.5 pr-3 text-ink-600">{formatJam(t.diambilPada)}</td>
                        <td className="py-2.5 pr-3"><StatusBadge status={t.status} pulse /></td>
                        <td className="py-2.5">
                          <div className="flex flex-wrap gap-1.5">
                            <Aksi label={sibuk ? "…" : "Panggil"} title="Ubah menjadi Dipanggil" onClick={() => ubahStatus(t.id, "dipanggil")} enabled={canTransition(t.status, "dipanggil") && !sibuk} />
                            <Aksi label={sibuk ? "…" : "Ulangi"} title="Panggil ulang (segarkan waktu panggil)" onClick={() => panggilUlang(t.id)} enabled={t.status === "dipanggil" && !sibuk} />
                            <Aksi label={sibuk ? "…" : "Layani"} title="Mulai melayani" onClick={() => ubahStatus(t.id, "dilayani")} enabled={canTransition(t.status, "dilayani") && !sibuk} />
                            <Aksi label={sibuk ? "…" : "Selesai"} title="Tandai selesai" onClick={() => ubahStatus(t.id, "selesai", `Tandai ${t.nomor} sebagai SELESAI?`)} enabled={canTransition(t.status, "selesai") && !sibuk} />
                            <Aksi label={sibuk ? "…" : "Lewati"} title="Lewati antrean" onClick={() => ubahStatus(t.id, "dilewati", `Lewati ${t.nomor}? Nomor tetap tercatat di riwayat.`)} enabled={canTransition(t.status, "dilewati") && !sibuk} />
                            <Aksi label={sibuk ? "…" : "Batal"} title="Batalkan antrean" onClick={() => ubahStatus(t.id, "dibatalkan", `Batalkan ${t.nomor}? Tindakan ini tidak dapat dibatalkan.`)} enabled={canTransition(t.status, "dibatalkan") && !sibuk} danger />
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                halaman={Math.min(halaman, Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN)))}
                totalHalaman={Math.max(1, Math.ceil(tersaring.length / PER_HALAMAN))}
                totalItem={tersaring.length}
                onHalaman={setHalaman}
              />
            </>
          )}
          <p className="mt-3 text-[13px] text-ink-500">
            Aturan: Menunggu → Dipanggil → Dilayani → Selesai. Nomor dilewati tetap tercatat di riwayat. Perubahan tersimpan di database dan terlihat di layar publik seketika.
          </p>
        </CardBody>
      </Card>
    </>
  );
}

function Aksi({ label, title, onClick, enabled, danger }: { label: string; title: string; onClick: () => void; enabled: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      title={enabled ? title : `${title} (tidak tersedia untuk status saat ini)`}
      disabled={!enabled}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors ${
        enabled
          ? danger
            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-200 dark:hover:bg-red-400/20"
            : "border-line bg-white text-navy-900 hover:border-navy-900/40 dark:bg-white/5 dark:text-white dark:hover:border-white/40"
          : "cursor-not-allowed border-line bg-slate-50 text-slate-400 dark:bg-white/5 dark:text-white/35"
      }`}
    >
      {label}
    </button>
  );
}
