"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/site";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LoadingState, SectionHeading, Select } from "@/components/ui";
import { useLayananLive, usePapanLive } from "@/lib/supabase/hooks";
import { rpcAmbilNomor } from "@/lib/supabase/queries";
import { estimasiTungguMenit, formatEstimasi } from "@/lib/format";

type Hasil = { id: string; nomor: string; layananNama: string; estimasi: string } | null;

function FormAmbil() {
  const params = useSearchParams();
  const layananAwal = params.get("layanan") ?? "";
  const { data: daftarLayanan, memuat: memuatLayanan, galat: galatMuat, muatUlang } = useLayananLive();
  const { data: daftarTiket } = usePapanLive();
  const [layananId, setLayananId] = useState(layananAwal);
  const [nama, setNama] = useState("");
  const [errors, setErrors] = useState<{ layanan?: string; nama?: string }>({});
  const [loading, setLoading] = useState(false);
  const [gagal, setGagal] = useState<string | null>(null);
  const [hasil, setHasil] = useState<Hasil>(null);

  const layananAktif = useMemo(() => daftarLayanan.filter((s) => s.aktif), [daftarLayanan]);
  const layananDipilih = daftarLayanan.find((s) => s.id === layananId);

  function antreanDepan(): number {
    if (!layananDipilih) return 0;
    return daftarTiket.filter(
      (t) => t.layananId === layananDipilih.id && ["menunggu", "dipanggil", "dilayani"].includes(t.status),
    ).length;
  }

  function validasi(): boolean {
    const e: typeof errors = {};
    const svc = daftarLayanan.find((s) => s.id === layananId);
    if (!layananId) e.layanan = "Pilih jenis layanan terlebih dahulu.";
    else if (!svc) e.layanan = "Layanan tidak dikenal. Pilih layanan lain.";
    else if (!svc?.aktif) e.layanan = "Layanan tersebut sedang nonaktif. Pilih layanan lain.";
    if (nama.trim().length < 3) e.nama = "Isi nama minimal 3 huruf (tanpa data pribadi sensitif).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function ambilNomor(ev: React.FormEvent) {
    ev.preventDefault();
    setGagal(null);
    setHasil(null);
    if (!validasi() || !layananDipilih) return;
    setLoading(true);
    try {
      // Nomor diterbitkan atomik oleh RPC ambil_nomor (counter harian di DB).
      const tiket = await rpcAmbilNomor(layananDipilih.id, nama.trim());
      setHasil({
        id: tiket.id,
        nomor: tiket.nomor,
        layananNama: layananDipilih.nama,
        estimasi: formatEstimasi(estimasiTungguMenit(antreanDepan(), layananDipilih.estimasiMenit)),
      });
    } catch (e) {
      setGagal(e instanceof Error ? e.message : "Nomor belum berhasil dibuat. Coba lagi — data Anda tidak hilang.");
    } finally {
      setLoading(false);
    }
  }

  const langkahAktif = hasil ? 2 : layananId ? (nama.trim().length >= 3 ? 2 : 1) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Kolom form */}
      <div>
        <ol aria-label="Langkah pengambilan nomor" className="flex items-center gap-2 rounded-2xl border border-line bg-white p-4 text-xs font-bold dark:bg-white/5">
          {["Pilih layanan", "Isi nama", "Terima nomor"].map((langkah, i) => {
            const done = i < langkahAktif || !!hasil;
            const current = !hasil && i === langkahAktif;
            return (
              <li key={langkah} className="flex flex-1 items-center gap-2">
                <span aria-hidden className={done || current ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[11px] text-white dark:bg-emerald-400 dark:text-navy-950" : "flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] text-slate-500 dark:bg-white/10"}>
                  {done ? "✓" : i + 1}
                </span>
                <span className={done || current ? "text-navy-900 dark:text-white" : "hidden text-ink-500 sm:inline"}>{langkah}</span>
                {i < 2 && <span aria-hidden className="h-px flex-1 bg-line" />}
              </li>
            );
          })}
        </ol>

        <Card className="mt-5 overflow-hidden">
          <div className="border-b border-line bg-navy-950 px-6 py-5 text-white sm:px-8">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-cyan-glow">Formulir pendaftaran</p>
            <h2 className="mt-1 text-xl font-extrabold">Data pengambilan nomor</h2>
          </div>
          <CardBody className="sm:p-8">
            {galatMuat && daftarLayanan.length === 0 && !memuatLayanan && (
              <div className="mb-4">
                <Alert tone="error">
                  Daftar layanan belum berhasil dimuat ({galatMuat}).{" "}
                  <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button>
                </Alert>
              </div>
            )}
            {gagal && <div className="mb-4"><Alert tone="error">{gagal}</Alert></div>}
            {hasil ? (
              <div role="status">
                <div className="overflow-hidden rounded-2xl border-2 border-navy-900/10 dark:border-white/15">
                  <div className="bg-navy-950 px-6 py-6 text-center text-white">
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-300">✓ Nomor berhasil dibuat</p>
                    <p className="tnum mt-2 font-mono text-7xl font-black tracking-tight">{hasil.nomor}</p>
                    <p className="tnum mt-2 font-mono text-xs text-white/60">ID tiket: {hasil.id}</p>
                  </div>
                  <div className="tiket-perforasi mx-6" />
                  <div className="grid gap-3 px-6 py-5 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-canvas px-4 py-3">
                      <p className="text-[11px] font-bold uppercase text-ink-500">Layanan</p>
                      <p className="font-bold text-ink-900">{hasil.layananNama}</p>
                    </div>
                    <div className="rounded-xl bg-canvas px-4 py-3">
                      <p className="text-[11px] font-bold uppercase text-ink-500">Perkiraan tunggu</p>
                      <p className="font-bold text-ink-900">{hasil.estimasi}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Link href={`/tiket/${hasil.nomor}`} className="inline-flex h-12 items-center justify-center rounded-xl bg-navy-900 text-[15px] font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950">
                    Lihat Tiket Saya →
                  </Link>
                  <Button variant="secondary" size="lg" onClick={() => { setHasil(null); setNama(""); }}>
                    Ambil Nomor Lain
                  </Button>
                </div>
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-[13px] text-amber-900 dark:bg-amber-300/10 dark:text-amber-100">
                  Simpan tangkapan layar nomor ini dan tunjukkan saat dipanggil di loket.
                </p>
              </div>
            ) : memuatLayanan && daftarLayanan.length === 0 ? (
              <LoadingState teks="Memuat daftar layanan…" />
            ) : (
              <form onSubmit={ambilNomor} noValidate>
                <div>
                  <Label htmlFor="layanan">Jenis layanan</Label>
                  <Select id="layanan" value={layananId} onChange={(e) => setLayananId(e.target.value)} className="h-12 text-base">
                    <option value="">— Pilih layanan —</option>
                    {daftarLayanan.map((s) => (
                      <option key={s.id} value={s.id} disabled={!s.aktif}>
                        {s.prefix} · {s.nama}{s.aktif ? "" : " (nonaktif)"}
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.layanan} />
                  {layananDipilih && (
                    <div className="mt-3 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-600">
                      <p className="font-bold text-ink-900">{layananDipilih.nama}</p>
                      <p className="mt-0.5">{layananDipilih.deskripsi}</p>
                      <p className="mt-1.5 inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-navy-900 dark:bg-white/10 dark:text-white">
                        ± {layananDipilih.estimasiMenit} mnt/orang · {antreanDepan()} antrean aktif
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-5">
                  <Label htmlFor="nama">Nama pengunjung</Label>
                  <Input id="nama" autoComplete="name" placeholder="cth. Nama lengkap Anda" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={60} className="h-12 text-base" />
                  <FieldError message={errors.nama} />
                  <p className="mt-1.5 text-xs text-ink-500">Gunakan nama asli tanpa gelar. Hindari NIK/alamat/no. HP.</p>
                </div>
                <Button type="submit" loading={loading} className="mt-6 w-full" size="lg">
                  {loading ? "Membuat nomor…" : "Ambil Nomor Sekarang →"}
                </Button>
                <p className="mt-3 text-center text-[13px] text-ink-500">
                  Sudah punya nomor? <Link href="/lacak-antrean" className="font-bold text-brand-700 hover:underline dark:text-brand-100">Lacak di sini</Link>.
                </p>
              </form>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Panel samping */}
      <aside className="space-y-5">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-navy-900 to-navy-700 px-6 py-5 text-white">
            <h2 className="font-extrabold">Daftar tunggu live</h2>
            <p className="text-[13px] text-white/65">Diperbarui otomatis dari database</p>
          </div>
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {layananAktif.map((s) => {
                const n = daftarTiket.filter((t) => t.layananId === s.id && t.status === "menunggu").length;
                const aktifCount = daftarTiket.filter((t) => t.layananId === s.id && ["menunggu", "dipanggil", "dilayani"].includes(t.status)).length;
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="tnum flex size-9 items-center justify-center rounded-lg bg-navy-900 font-mono text-sm font-black text-white dark:bg-emerald-400 dark:text-navy-950">{s.prefix}</span>
                      <div>
                        <p className="text-sm font-bold text-ink-900">{s.nama}</p>
                        <p className="text-xs text-ink-500">{aktifCount} aktif · ±{s.estimasiMenit} mnt/org</p>
                      </div>
                    </div>
                    <span className="tnum rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">{n} menunggu</span>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h2 className="font-extrabold text-navy-900 dark:text-white">Tips pengambilan</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-600">
              <li className="flex gap-2.5"><span aria-hidden className="mt-0.5 font-black text-emerald-600">✓</span> Satu orang satu nomor. Ambil ulang bila layanan berbeda.</li>
              <li className="flex gap-2.5"><span aria-hidden className="mt-0.5 font-black text-emerald-600">✓</span> Datang 10 menit sebelum estimasi panggilan.</li>
              <li className="flex gap-2.5"><span aria-hidden className="mt-0.5 font-black text-emerald-600">✓</span> Nomor tersimpan di database — terbaca di semua perangkat.</li>
            </ul>
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

export default function AmbilAntrean() {
  return (
    <PublicShell fullBleed>
      <section className="border-b border-line bg-white dark:bg-navy-950">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <SectionHeading
            eyebrow="Pendaftaran antrean"
            judul="Ambil Nomor Antrean"
            deskripsi="Pilih layanan dan isi nama. Nomor tersimpan di database sehingga terbaca admin, pelacakan, dan layar antrean dari perangkat mana pun."
          />
          <Suspense fallback={<LoadingState teks="Menyiapkan formulir…" />}>
            <FormAmbil />
          </Suspense>
        </div>
      </section>
    </PublicShell>
  );
}
