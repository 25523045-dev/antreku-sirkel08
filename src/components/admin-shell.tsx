"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { keluarSupabase, peranSaya } from "@/lib/supabase/auth";
import { Logo } from "@/components/site";
import { ThemeToggle } from "@/components/theme";
import { Ikon, LoadingState, type IkonNama } from "@/components/ui";

const NAV_UTAMA: Array<{ href: string; label: string; desc: string; exact?: boolean; ikon: IkonNama }> = [
  { href: "/admin", label: "Dashboard", desc: "Ringkasan", exact: true, ikon: "dashboard" },
  { href: "/admin/antrean", label: "Antrean", desc: "Panggil & layani", ikon: "antrean" },
  { href: "/admin/layanan", label: "Layanan", desc: "Jenis layanan", ikon: "layanan" },
  { href: "/admin/petugas", label: "Petugas", desc: "Tim & tugas", ikon: "petugas" },
  { href: "/admin/loket", label: "Loket", desc: "Meja layanan", ikon: "loket" },
];
const NAV_DATA: Array<{ href: string; label: string; desc: string; exact?: boolean; ikon: IkonNama }> = [
  { href: "/admin/riwayat", label: "Riwayat", desc: "Transaksi selesai", ikon: "riwayat" },
  { href: "/admin/laporan", label: "Laporan", desc: "Volume & ekspor", ikon: "laporan" },
  { href: "/admin/pengaturan", label: "Pengaturan", desc: "Konfigurasi", ikon: "pengaturan" },
];

const JUDUL: Record<string, { judul: string; deskripsi: string }> = {
  "/admin": { judul: "Dashboard", deskripsi: "Ringkasan operasional hari ini" },
  "/admin/antrean": { judul: "Manajemen Antrean", deskripsi: "Panggil, layani, selesaikan" },
  "/admin/layanan": { judul: "Manajemen Layanan", deskripsi: "Jenis layanan & estimasi" },
  "/admin/petugas": { judul: "Manajemen Petugas", deskripsi: "Tim dan penugasan loket" },
  "/admin/loket": { judul: "Manajemen Loket", deskripsi: "Status buka/tutup & penugasan" },
  "/admin/riwayat": { judul: "Riwayat Antrean", deskripsi: "Transaksi yang telah diproses" },
  "/admin/laporan": { judul: "Laporan Operasional", deskripsi: "Volume & komposisi status" },
  "/admin/pengaturan": { judul: "Pengaturan", deskripsi: "Identitas & preferensi operasional" },
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function ItemNav({ href, label, desc, ikon, aktif, onClick }: { href: string; label: string; desc: string; ikon: IkonNama; aktif: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={aktif ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors",
        aktif ? "bg-white text-navy-900 shadow-card" : "text-white/70 hover:bg-white/10 hover:text-white",
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-2 left-0 w-1 rounded-full", aktif ? "bg-cyan-glow" : "bg-transparent")} />
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", aktif ? "bg-navy-900 text-white" : "bg-white/10 text-white/80 group-hover:bg-white/15")}>
        <Ikon nama={ikon} className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold">{label}</span>
        <span className={cn("block text-xs", aktif ? "text-ink-500" : "text-white/50")}>{desc}</span>
      </span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [sah, setSah] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("admin");

  useEffect(() => {
    if (pathname === "/admin/login") return;
    let batal = false;
    const periksa = () => {
      peranSaya()
        .then((s) => {
          if (batal) return;
          if (!s || s.peran !== "admin") {
            setSah(false);
            router.replace(`/admin/login?dari=${encodeURIComponent(pathname)}`);
            return;
          }
          setEmail(s.email ?? "admin");
          setSah(true);
        })
        .catch(() => {
          if (batal) return;
          setSah(false);
          router.replace(`/admin/login?dari=${encodeURIComponent(pathname)}`);
        });
    };
    periksa();
    window.addEventListener("pageshow", periksa);
    return () => {
      batal = true;
      window.removeEventListener("pageshow", periksa);
    };
  }, [pathname, router]);

  const keluar = useCallback(() => {
    void keluarSupabase();
    router.replace("/admin/login");
  }, [router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const terkunci = sah !== true;
  const meta = JUDUL[pathname] ?? { judul: "Admin", deskripsi: "Panel pengelolaan AntreKu" };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col bg-navy-950 text-white lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Logo terang />
            <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-white/65">
              Terhubung ke Supabase · otorisasi <strong className="text-white">RLS + peran admin</strong>.
            </p>
        </div>
        <nav aria-label="Navigasi admin" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          <div>
            <p className="px-3.5 pb-2 text-[11px] font-bold tracking-[0.18em] uppercase text-white/40">Operasional</p>
            <div className="space-y-1">
              {NAV_UTAMA.map((item) => (
                <ItemNav key={item.href} {...item} aktif={isActive(pathname, item.href, item.exact)} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3.5 pb-2 text-[11px] font-bold tracking-[0.18em] uppercase text-white/40">Data & Sistem</p>
            <div className="space-y-1">
              {NAV_DATA.map((item) => (
                <ItemNav key={item.href} {...item} aktif={isActive(pathname, item.href)} />
              ))}
            </div>
          </div>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3.5 py-3">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-glow to-emerald-400 font-black text-navy-950">A</span>
            <div className="min-w-0 flex-1 text-xs leading-tight">
              <p className="truncate font-bold text-white">Admin Utama</p>
              <p className="truncate text-white/55">{email} · WIB</p>
            </div>
            <button type="button" onClick={keluar} title="Keluar dari sesi admin" aria-label="Keluar dari sesi admin" className="flex size-9 items-center justify-center rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white">
              <Ikon nama="keluar" className="size-4" />
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-bold">
            <Link href="/beranda" className="rounded-lg border border-white/15 px-3 py-2.5 text-center text-white hover:bg-white/10">
              Situs publik
            </Link>
            <button type="button" onClick={keluar} className="cursor-pointer rounded-lg bg-white px-3 py-2.5 text-center text-navy-900 hover:bg-brand-100">
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Kolom utama */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-xl dark:bg-navy-950/90">
          <div className="flex min-h-[76px] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
            <button
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              aria-expanded={terbuka}
              aria-label="Buka/tutup menu navigasi"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-line text-navy-900 dark:text-white lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-ink-500">AntreKu Admin · Asia/Jakarta · WIB</p>
              <h1 className="truncate text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl dark:text-white">{meta.judul}</h1>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden rounded-full border border-emerald-300/40 bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase text-emerald-200 md:inline">
                Data live
              </span>
              <ThemeToggle />
              <span aria-hidden className="hidden size-10 items-center justify-center rounded-full bg-navy-900 font-bold text-white sm:flex dark:bg-emerald-400 dark:text-navy-950">A</span>
            </div>
          </div>
          {terbuka && (
            <nav aria-label="Navigasi admin seluler" className="grid gap-2 border-t border-line bg-white p-4 sm:grid-cols-2 lg:hidden dark:bg-navy-950">
              {[...NAV_UTAMA, ...NAV_DATA].map((item) => {
                const aktif = isActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setTerbuka(false)}
                    aria-current={aktif ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm font-bold",
                      aktif ? "border-navy-900 bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950" : "border-line text-navy-900 dark:text-white",
                    )}
                  >
                    <Ikon nama={item.ikon} className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button type="button" onClick={keluar} className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-bold text-red-700 sm:col-span-2 dark:border-red-300/30 dark:bg-red-400/10 dark:text-red-200">
                Keluar dari sesi admin
              </button>
            </nav>
          )}
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-center text-xs text-ink-500 sm:px-8">
          AntreKu SIRKEL-08 · Panel admin · {meta.deskripsi} · Asia/Jakarta
        </footer>
      </div>
      {terkunci && (
        <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/95 backdrop-blur-[2px] dark:bg-navy-950/95">
          <div className="w-full max-w-sm px-4">
            <LoadingState teks={sah === false ? "Mengalihkan ke halaman login…" : "Memeriksa sesi admin…"} />
          </div>
        </div>
      )}
    </div>
  );
}
