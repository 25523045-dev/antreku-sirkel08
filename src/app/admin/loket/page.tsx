"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, LiveBadge, LoadingState, PageHeader } from "@/components/ui";
import { useLayananLive, useLoketLive, usePetugasLive } from "@/lib/supabase/hooks";
import { toggleLoket } from "@/lib/supabase/queries";

export default function KelolaLoket() {
  const { data: daftar, memuat, galat, muatUlang } = useLoketLive();
  const { data: daftarLayanan } = useLayananLive();
  const { data: daftarPetugas } = usePetugasLive();
  const [pesan, setPesan] = useState<string | null>(null);

  async function toggle(id: string) {
    const target = daftar.find((l) => l.id === id);
    if (!target) return;
    if (target.aktif && target.sedangMelayani) {
      setPesan(`Loket “${target.nama}” sedang melayani ${target.sedangMelayani} — selesaikan dulu sebelum menutup.`);
      return;
    }
    try {
      await toggleLoket(id, !target.aktif);
      setPesan(`Loket “${target.nama}” ${target.aktif ? "ditutup" : "dibuka"}. (Tersimpan di database.)`);
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Perubahan loket gagal. Coba lagi.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Data master" judul="Manajemen Loket" deskripsi="Kelola loket, petugas yang ditugaskan, layanan yang didukung, dan status buka/tutup." badge={<LiveBadge />} />
      {pesan && <div className="mb-4"><Alert tone="warning">{pesan}</Alert></div>}

      {memuat && daftar.length === 0 ? (
        <LoadingState teks="Memuat loket…" />
      ) : galat && daftar.length === 0 ? (
        <Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert>
      ) : (
      <div className="grid gap-5 sm:grid-cols-2">
        {daftar.map((l) => {
          const petugas = daftarPetugas.find((p) => p.nama === l.petugas);
          return (
            <Card key={l.id} className="card-lift overflow-hidden">
              <div aria-hidden className={`h-1.5 ${l.aktif ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-slate-300 dark:bg-white/15"}`} />
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span aria-hidden className={`flex size-13 items-center justify-center rounded-2xl p-3.5 text-lg font-black ${l.aktif ? "bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950" : "bg-slate-200 text-slate-500 dark:bg-white/10"}`}>
                      {l.nama.replace("Loket ", "L")}
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold text-navy-900 dark:text-white">{l.nama}</h2>
                      <p className="text-sm text-ink-600">Petugas: <strong className="text-ink-900">{l.petugas ?? petugas?.nama ?? "Belum ditugaskan"}</strong></p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${l.aktif ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                    <span aria-hidden className="size-1.5 rounded-full bg-current" />
                    {l.aktif ? "Buka" : "Tutup"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {l.layananIds.map((id) => {
                    const s = daftarLayanan.find((x) => x.id === id);
                    return (
                      <span key={id} className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-bold text-navy-900 dark:text-white">
                        {s ? `${s.prefix} · ${s.nama}` : id}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-navy-950 px-4 py-3.5 text-white">
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/60">Sedang melayani</span>
                  <strong className="tnum font-mono text-2xl font-black">{l.sedangMelayani ?? "—"}</strong>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => toggle(l.id)} variant={l.aktif ? "secondary" : "primary"} className="flex-1">
                    {l.aktif ? "Tutup Loket" : "Buka Loket"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      )}
      <p className="mt-4 text-[13px] text-ink-500">
        Validasi: loket yang sedang melayani tidak dapat ditutup. Penugasan petugas diatur di halaman Petugas.
      </p>
    </>
  );
}
