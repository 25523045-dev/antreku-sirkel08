"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LiveBadge, LoadingState, PageHeader } from "@/components/ui";
import { usePengaturanLive } from "@/lib/supabase/hooks";
import { simpanPengaturan } from "@/lib/supabase/queries";
import type { AppSettings } from "@/lib/types";

type FormPengaturan = {
  namaInstansi: string;
  jamBuka: string;
  jamTutup: string;
  awalanNomor: string;
  resetHarian: boolean;
  tampilkanEstimasi: boolean;
  tampilkanRiwayat: boolean;
  suara: boolean;
};

function keForm(p: AppSettings): FormPengaturan {
  return {
    namaInstansi: p.namaInstansi,
    jamBuka: p.jamBuka,
    jamTutup: p.jamTutup,
    awalanNomor: p.awalanNomor,
    resetHarian: p.resetHarian,
    tampilkanEstimasi: p.tampilkanEstimasi,
    tampilkanRiwayat: p.tampilkanRiwayatDisplay,
    suara: p.suaraPanggilan,
  };
}

export default function Pengaturan() {
  // Data live dari database. Form mengikuti data server sampai pengguna
  // mengetik (tanpa efek/sinkronisasi manual).
  const { data: pengaturan, memuat, galat, muatUlang } = usePengaturanLive();
  const [form, setForm] = useState<FormPengaturan | null>(null);
  const aktif = form ?? keForm(pengaturan);

  function ubah(patch: Partial<FormPengaturan>) {
    setForm((f) => ({ ...(f ?? keForm(pengaturan)), ...patch }));
  }

  const [errors, setErrors] = useState<{ nama?: string; jam?: string; awalan?: string }>({});
  const [sukses, setSukses] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function simpan(ev: React.FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (aktif.namaInstansi.trim().length < 4) e.nama = "Nama instansi minimal 4 huruf.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(aktif.jamBuka) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(aktif.jamTutup))
      e.jam = "Format jam HH:MM 24-jam (cth. 08:00).";
    else if (aktif.jamBuka >= aktif.jamTutup) e.jam = "Jam buka harus lebih awal dari jam tutup.";
    if (aktif.awalanNomor.trim().length < 3) e.awalan = "Jelaskan pola awalan nomor (cth. A-007).";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setSukses(null);
      return;
    }
    setSibuk(true);
    try {
      await simpanPengaturan({
        ...pengaturan,
        namaInstansi: aktif.namaInstansi.trim(),
        jamBuka: aktif.jamBuka,
        jamTutup: aktif.jamTutup,
        awalanNomor: aktif.awalanNomor.trim(),
        resetHarian: aktif.resetHarian,
        tampilkanEstimasi: aktif.tampilkanEstimasi,
        tampilkanRiwayatDisplay: aktif.tampilkanRiwayat,
        suaraPanggilan: aktif.suara,
      });
      setForm(null); // kembali mengikuti data server yang baru disimpan
      setSukses(`Pengaturan disimpan dan berlaku di seluruh halaman (${aktif.namaInstansi.trim()}, ${aktif.jamBuka}–${aktif.jamTutup} WIB). Tersimpan di database.`);
      muatUlang();
    } catch (err) {
      setSukses(null);
      setErrors({ nama: err instanceof Error ? err.message : "Penyimpanan gagal. Coba lagi." });
    } finally {
      setSibuk(false);
    }
  }

  type KunciBoolean = "resetHarian" | "tampilkanEstimasi" | "tampilkanRiwayat" | "suara";
  const set = (k: KunciBoolean) => ({
    checked: aktif[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => ubah({ [k]: e.target.checked } as Partial<FormPengaturan>),
  });

  return (
    <>
      <PageHeader eyebrow="Data & sistem" judul="Pengaturan" deskripsi="Konfigurasi instansi, jam layanan, pola nomor, dan preferensi layar publik." badge={<LiveBadge />} />
      {sukses && <div className="mb-4"><Alert tone="success">{sukses}</Alert></div>}

      {memuat && !form ? (
        <LoadingState teks="Memuat pengaturan…" />
      ) : galat && !form ? (
        <Alert tone="error">Pengaturan belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert>
      ) : (
      <form onSubmit={simpan} noValidate className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Identitas &amp; jam layanan</h2>
            <div className="mt-3">
              <Label htmlFor="instansi">Nama instansi</Label>
                <Input id="instansi" value={aktif.namaInstansi} onChange={(e) => ubah({ namaInstansi: e.target.value })} maxLength={80} />
              <FieldError message={errors.nama} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="buka">Jam buka (WIB)</Label>
                <Input id="buka" type="time" value={aktif.jamBuka} onChange={(e) => ubah({ jamBuka: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="tutup">Jam tutup (WIB)</Label>
                <Input id="tutup" type="time" value={aktif.jamTutup} onChange={(e) => ubah({ jamTutup: e.target.value })} />
              </div>
            </div>
            <FieldError message={errors.jam} />
            <div className="mt-3">
              <Label htmlFor="awalan">Pola awalan nomor</Label>
                <Input id="awalan" value={aktif.awalanNomor} onChange={(e) => ubah({ awalanNomor: e.target.value })} maxLength={80} />
              <FieldError message={errors.awalan} />
              <p className="mt-1.5 text-[13px] text-ink-500">Nomor unik per layanan + tanggal. Reset harian tidak menghapus riwayat sebelumnya.</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Preferensi operasional</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {[
                { k: "resetHarian" as const, judul: "Reset nomor setiap hari", desc: "Nomor kembali dari 001 tiap tanggal lokal Asia/Jakarta." },
                { k: "tampilkanEstimasi" as const, judul: "Tampilkan estimasi tunggu", desc: "Tunjukkan perkiraan waktu tunggu di tiket dan lacak antrean." },
                { k: "tampilkanRiwayat" as const, judul: "Tampilkan riwayat di layar publik", desc: "Bar “Terakhir dipanggil” pada /display." },
                { k: "suara" as const, judul: "Suara panggilan", desc: "Bunyi saat nomor baru dipanggil (perlu fitur audio Tahap 2+)." },
              ].map((o) => (
                <li key={o.k} className="flex items-start justify-between gap-4 rounded-[12px] border border-line px-4 py-3">
                  <div>
                    <p className="font-bold text-ink-900">{o.judul}</p>
                    <p className="text-[13px] text-ink-600">{o.desc}</p>
                  </div>
                  <input type="checkbox" aria-label={o.judul} className="mt-1 size-5 accent-emerald-600" {...set(o.k)} />
                </li>
              ))}
            </ul>
            <Button type="submit" className="mt-4 w-full" size="lg" loading={sibuk}>Simpan Pengaturan</Button>
            <p className="mt-2 text-center text-[13px] text-ink-500">Validasi berjalan di sisi klien, otorisasi di database (hanya admin).</p>
          </CardBody>
        </Card>
      </form>
      )}
    </>
  );
}
