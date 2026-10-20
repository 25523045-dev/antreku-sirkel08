"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { bacaSesiPengunjung, mulaiSesiPengunjung } from "@/lib/sesi";
import { pastikanSesiPengunjung } from "@/lib/supabase/auth";
import { usePapanLive, useTiketSayaLive } from "@/lib/supabase/hooks";
import { Logo } from "@/components/site";
import { ThemeToggle } from "@/components/theme";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LoadingState } from "@/components/ui";

/**
 * Login pengunjung: nama + nomor tiket.
 * Nomor dicocokkan ke papan publik hari ini atau tiket milik sesi ini.
 * Sesi anonim Supabase disiapkan diam-diam agar kepemilikan tiket (RLS owner)
 * dan pengambilan nomor dapat diverifikasi server.
 */
function nomorDikenal(nomor: string, papan: string[], milik: string[]): boolean {
  const kunci = nomor.trim().toUpperCase();
  return papan.some((n) => n.toUpperCase() === kunci) || milik.some((n) => n.toUpperCase() === kunci);
}

export default function LoginPengunjung() {
  return (
    <Suspense fallback={<LoadingState teks="Menyiapkan halaman login…" />}>
      <FormLoginPengunjung />
    </Suspense>
  );
}

function FormLoginPengunjung() {
  const router = useRouter();
  const { data: papan } = usePapanLive();
  const { data: milikSaya } = useTiketSayaLive();
  const [nama, setNama] = useState("");
  const [nomor, setNomor] = useState("");
  const [errors, setErrors] = useState<{ nama?: string; nomor?: string }>({});
  const [gagal, setGagal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bacaSesiPengunjung()) router.replace("/pengunjung");
  }, [router]);

  // Siapkan sesi anonim lebih awal (gagal diam-diam di sini, gagal keras saat submit).
  useEffect(() => {
    pastikanSesiPengunjung().catch(() => {});
  }, []);

  async function masuk(ev: React.FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (nama.trim().length < 3) e.nama = "Isi nama minimal 3 huruf.";
    if (nomor.trim().length < 3) e.nomor = "Isi nomor tiket, contoh: A-004.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setGagal(null);
    try {
      await pastikanSesiPengunjung();
      if (!nomorDikenal(nomor, papan.map((t) => t.nomor), milikSaya.map((t) => t.nomor))) {
        setGagal(`Nomor “${nomor.trim().toUpperCase()}” tidak dikenal. Ambil nomor dulu di halaman Ambil Antrean, atau gunakan contoh: A-004, B-002, C-001.`);
        return;
      }
      mulaiSesiPengunjung(nama.trim(), nomor.trim().toUpperCase());
      router.push("/pengunjung");
    } catch (err) {
      setGagal(err instanceof Error ? err.message : "Gagal menyiapkan sesi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card>
          <CardBody className="sm:p-8">
            <Logo />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-900 dark:text-white">Login Pengunjung</h1>
            <p className="mt-1 text-sm text-ink-600">Masuk dengan nama dan nomor tiket untuk mengelola antrean Anda.</p>
            <div className="mt-3">
              <Alert tone="info">
                Belum punya nomor? <Link href="/ambil-antrean" className="font-bold underline">Ambil nomor dulu</Link> — lalu kembali dan masuk dengan nomor tersebut.
              </Alert>
            </div>
            {gagal && <div className="mt-3"><Alert tone="error">{gagal}</Alert></div>}
            <form onSubmit={masuk} noValidate className="mt-5">
              <div>
                <Label htmlFor="nama">Nama pengunjung</Label>
                <Input id="nama" autoComplete="name" placeholder="cth. Nadia Rahma" value={nama} onChange={(e) => setNama(e.target.value)} maxLength={60} />
                <FieldError message={errors.nama} />
              </div>
              <div className="mt-4">
                <Label htmlFor="nomor">Nomor tiket</Label>
                <Input id="nomor" placeholder="cth. A-004" value={nomor} onChange={(e) => setNomor(e.target.value.toUpperCase())} maxLength={12} className="tnum font-mono uppercase" />
                <FieldError message={errors.nomor} />
              </div>
              <Button type="submit" loading={loading} className="mt-6 w-full" size="lg">
                {loading ? "Memeriksa…" : "Masuk sebagai Pengunjung"}
              </Button>
            </form>
            <div className="mt-5 flex items-center justify-between text-sm font-semibold">
              <Link href="/masuk" className="text-ink-600 hover:text-navy-900 dark:hover:text-white">← Pilih akses lain</Link>
              <Link href="/admin/login" className="text-brand-700 hover:underline dark:text-brand-100">Masuk sebagai Admin</Link>
            </div>
          </CardBody>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-500">AntreKu SIRKEL-08 · Sesi aman Supabase · Asia/Jakarta</p>
      </div>
    </div>
  );
}
