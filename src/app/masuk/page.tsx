import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/components/site";
import { Alert, Ikon } from "@/components/ui";
import { StatusSesi } from "./status-sesi";

export const metadata: Metadata = { title: "Pilih Akses Masuk" };

export default function PilihAkses() {
  return (
    <PublicShell fullBleed>
      {/* Header halaman */}
      <section className="hero-navy relative overflow-hidden text-white">
        <div aria-hidden className="hero-grid absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-10 text-center sm:px-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-glow">Akses AntreKu</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Masuk sebagai siapa?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
            Hak akses Admin dan Pengunjung terpisah dan tidak saling menimpa. Pilih peran yang sesuai.
          </p>
          <div className="mx-auto mt-6 max-w-3xl text-left">
            <StatusSesi />
          </div>
        </div>
      </section>

      {/* Dua kartu besar */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-2 grid gap-6 py-12 md:grid-cols-2">
          {/* Admin */}
          <article className="card-lift overflow-hidden rounded-3xl border border-line bg-card shadow-lift">
            <div className="bg-navy-950 px-7 pt-7 pb-6 text-white">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <Ikon nama="petugas" className="size-7" />
              </span>
              <p className="mt-5 text-[11px] font-bold tracking-[0.18em] uppercase text-cyan-glow">Petugas & Pengelola</p>
              <h2 className="mt-1 text-2xl font-extrabold">Masuk sebagai Admin</h2>
            </div>
            <div className="px-7 py-6">
              <ul className="space-y-2.5 text-sm text-ink-600">
                {["Kelola antrean & panggil nomor", "Kelola layanan, petugas & loket", "Riwayat, laporan & ekspor CSV"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                      <Ikon nama="cek" className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/login"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 text-[15px] font-bold text-white hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950"
              >
                Ke Login Admin →
              </Link>
              <p className="tnum mt-3 rounded-xl bg-canvas px-3 py-2 text-center text-xs text-ink-600">
                Auth Supabase · khusus akun admin terdaftar
              </p>
            </div>
          </article>

          {/* Pengunjung */}
          <article className="card-lift overflow-hidden rounded-3xl border-2 border-navy-900/10 bg-card shadow-lift dark:border-white/15">
            <div className="bg-gradient-to-br from-brand-600 to-navy-900 px-7 pt-7 pb-6 text-white">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Ikon nama="tiket" className="size-7" />
              </span>
              <p className="mt-5 text-[11px] font-bold tracking-[0.18em] uppercase text-white/70">Masyarakat & Penerima Layanan</p>
              <h2 className="mt-1 text-2xl font-extrabold">Masuk sebagai Pengunjung</h2>
            </div>
            <div className="px-7 py-6">
              <ul className="space-y-2.5 text-sm text-ink-600">
                {["Ambil nomor antrean dinamis", "Lihat tiket digital Anda", "Lacak status & posisi live"].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                      <Ikon nama="cek" className="size-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pengunjung/login"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-navy-900 text-[15px] font-bold text-navy-900 hover:bg-navy-900 hover:text-white dark:border-white/30 dark:text-white dark:hover:bg-white dark:hover:text-navy-900"
              >
                Ke Login Pengunjung →
              </Link>
              <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-center text-xs text-ink-600">
                Masuk dengan nama + nomor tiket · tanpa hak admin
              </p>
            </div>
          </article>
        </div>

        {/* Tanpa login */}
        <div className="pb-4 text-center">
          <h2 className="font-extrabold text-navy-900 dark:text-white">Hanya ingin melihat informasi?</h2>
          <p className="mt-1 text-sm text-ink-600">Beranda, ambil antrean, lacak, dan layar antrean terbuka tanpa login.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 pb-10">
            {[
              { href: "/beranda", label: "Beranda Publik" },
              { href: "/ambil-antrean", label: "Ambil Tanpa Login" },
              { href: "/display", label: "Layar Antrean" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-5 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:bg-white/5 dark:text-white">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mx-auto max-w-3xl pb-12 text-left">
            <Alert tone="warning">
              <strong>Keamanan sesi:</strong> autentikasi memakai Supabase Auth (sesi HttpOnly). Admin wajib akun terdaftar; pengunjung memakai sesi anonim per perangkat. Jangan gunakan data pribadi sensitif.
            </Alert>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
