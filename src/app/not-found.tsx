import Link from "next/link";
import { PublicShell } from "@/components/site";
import { Card, CardBody } from "@/components/ui";

export default function TidakDitemukan() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-xl">
        <Card>
          <CardBody className="py-12 text-center">
            <p className="tnum font-mono text-6xl font-black text-navy-900 dark:text-white">404</p>
            <h1 className="mt-3 text-xl font-extrabold text-navy-900 dark:text-white">Halaman tidak ditemukan</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
              Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan. Periksa kembali tautan atau kembali ke halaman utama.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href="/beranda"
                className="inline-flex h-11 items-center rounded-[12px] bg-navy-900 px-5 text-sm font-bold text-white hover:bg-navy-800 dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300"
              >
                Kembali ke Beranda
              </Link>
              <Link
                href="/masuk"
                className="inline-flex h-11 items-center rounded-[12px] border border-line px-5 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40"
              >
                Pilih Akses Masuk
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </PublicShell>
  );
}
