"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/cn";

export function Logo({ terang, href = "/beranda" }: { terang?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="AntreKu — beranda">
      <span
        aria-hidden
        className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-900 text-white shadow-pop dark:from-emerald-400 dark:to-emerald-500 dark:text-navy-950"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
          <path strokeLinecap="round" d="M13 7v2m0 3v2m0 3v1" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className={cn("block text-lg font-extrabold tracking-tight", terang ? "text-white" : "text-navy-900 dark:text-white")}>
          AntreKu
        </span>
        <span className={cn("block text-[11px] font-bold tracking-[0.18em] uppercase", terang ? "text-cyan-glow/80" : "text-brand-600 dark:text-emerald-300")}>
          Sirkel-08
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/beranda", label: "Beranda" },
  { href: "/ambil-antrean", label: "Ambil Antrean" },
  { href: "/lacak-antrean", label: "Lacak" },
  { href: "/display", label: "Layar Antrean" },
  { href: "/masuk", label: "Masuk" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl dark:bg-navy-950/85">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <Suspense fallback={<NavFallback />}>
          <NavUtama />
        </Suspense>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/ambil-antrean"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-sm font-bold text-white shadow-card transition-colors hover:bg-navy-700 dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300"
          >
            Ambil Nomor
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
      <Suspense fallback={null}>
        <NavSeluler />
      </Suspense>
    </header>
  );
}

function NavFallback() {
  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 rounded-full border border-line bg-canvas px-1.5 py-1.5 text-sm font-semibold text-ink-600 lg:flex">
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 transition-colors hover:bg-white hover:text-navy-900 dark:hover:bg-white/10 dark:hover:text-white">
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

function NavUtama() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="hidden items-center gap-1 rounded-full border border-line bg-canvas px-1.5 py-1.5 text-sm font-semibold text-ink-600 lg:flex">
      {NAV.map((n) => {
        const aktif = pathname === n.href || (n.href !== "/beranda" && pathname.startsWith(n.href + "/"));
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 transition-colors",
              aktif
                ? "bg-navy-900 text-white shadow-card dark:bg-emerald-400 dark:text-navy-950"
                : "hover:bg-white hover:text-navy-900 dark:hover:bg-white/10 dark:hover:text-white",
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavSeluler() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi seluler" className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2.5 text-sm font-semibold text-ink-600 lg:hidden">
      {NAV.map((n) => {
        const aktif = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={aktif ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 whitespace-nowrap",
              aktif ? "bg-navy-900 text-white dark:bg-emerald-400 dark:text-navy-950" : "hover:bg-slate-100 dark:hover:bg-white/10",
            )}
          >
            {n.label}
          </Link>
        );
      })}
      <Link href="/admin/login" className="rounded-lg px-3 py-1.5 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-white/10">
        Admin
      </Link>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo terang />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">
            Sistem antrean digital untuk layanan kampus — ambil nomor dari ponsel, pantau posisi, dan datang saat dipanggil. Zona waktu Asia/Jakarta.
          </p>
          <p className="mt-3 inline-flex items-center rounded-full border border-dashed border-white/25 px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-white/60">
            Prototipe demo · SIRKEL-08
          </p>
        </div>
        <nav aria-label="Layanan footer" className="text-sm">
          <p className="font-bold tracking-wide text-white/90 uppercase text-xs">Pengunjung</p>
          <ul className="mt-3 space-y-2.5 font-semibold text-white/65">
            <li><Link href="/ambil-antrean" className="hover:text-white">Ambil Antrean</Link></li>
            <li><Link href="/lacak-antrean" className="hover:text-white">Lacak Antrean</Link></li>
            <li><Link href="/display" className="hover:text-white">Layar Antrean</Link></li>
            <li><Link href="/beranda" className="hover:text-white">Beranda</Link></li>
          </ul>
        </nav>
        <nav aria-label="Akses footer" className="text-sm">
          <p className="font-bold tracking-wide text-white/90 uppercase text-xs">Akses</p>
          <ul className="mt-3 space-y-2.5 font-semibold text-white/65">
            <li><Link href="/masuk" className="hover:text-white">Pilih Akses Masuk</Link></li>
            <li><Link href="/pengunjung/login" className="hover:text-white">Login Pengunjung</Link></li>
            <li><Link href="/admin/login" className="hover:text-white">Login Admin</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/50 sm:px-6">
          <p>AntreKu · SIRKEL-08 · Pusat Layanan Kampus</p>
          <p>Demo — jangan gunakan data pribadi sungguhan</p>
        </div>
      </div>
    </footer>
  );
}

/** Shell full-bleed: hero boleh melebar penuh, konten dalam max-w-7xl per section. */
export function PublicShell({ children, fullBleed }: { children: ReactNode; fullBleed?: boolean }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-canvas">
      <PublicHeader />
      <main className={fullBleed ? "w-full flex-1" : "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10"}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
