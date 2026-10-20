import Link from "next/link";
import type { ReactNode } from "react";
import { STATUS_LABEL } from "@/lib/format";
import type { QueueStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

/* ── Tombol ─────────────────────────────────────── */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  variant = "primary",
  size = "md",
  className,
  loading,
  disabled,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  const styles: Record<ButtonVariant, string> = {
    primary:
      "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-slate-300 shadow-card dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300 dark:disabled:bg-white/10 dark:disabled:text-white/40",
    secondary:
      "bg-white text-navy-900 border border-line hover:border-navy-900/40 disabled:text-slate-400 shadow-card dark:bg-white/5 dark:text-white dark:hover:border-white/40 dark:disabled:text-white/40",
    ghost: "text-navy-900 hover:bg-navy-900/5 disabled:text-slate-400 dark:text-white dark:hover:bg-white/10 dark:disabled:text-white/40",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300 dark:hover:bg-red-500 dark:disabled:bg-white/10 dark:disabled:text-white/40",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3.5 text-sm rounded-[8px]",
    md: "h-11 px-5 text-[15px] rounded-[12px]",
    lg: "h-13 px-7 text-base rounded-[12px] py-3.5",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
        styles[variant],
        sizes[size],
        className,
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

/* ── Ikon SVG satu gaya (outline 1.8, round) ──────── */
export type IkonNama =
  | "dashboard"
  | "antrean"
  | "layanan"
  | "petugas"
  | "loket"
  | "riwayat"
  | "laporan"
  | "pengaturan"
  | "tiket"
  | "lacak"
  | "layar"
  | "keluar"
  | "cek";

const IKON_PATH: Record<IkonNama, ReactNode> = {
  dashboard: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5ZM4 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3Zm10-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-9Z" />),
  antrean: (<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.5 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />),
  layanan: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Zm2 3h12M8 5v4" />),
  petugas: (<path strokeLinecap="round" strokeLinejoin="round" d="M15 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1m18 0v-1a4 4 0 0 0-3-3.87M13 3.13a4 4 0 0 1 0 7.75M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7 0a3 3 0 0 1-2 2.82" />),
  loket: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v6H4zM6 10v7m4-7v7m4-7v7m4-7v7M3 20h18" />),
  riwayat: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />),
  laporan: (<path strokeLinecap="round" strokeLinejoin="round" d="M5 20V10m6 10V4m6 16v-7M3 20h18" />),
  pengaturan: (<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3a7.5 7.5 0 0 0-.14-1.5l2-1.55-2-3.46-2.36.95a7.5 7.5 0 0 0-2.6-1.5L14 2h-4l-.4 2.44a7.5 7.5 0 0 0-2.6 1.5l-2.36-.95-2 3.46 2 1.55a7.5 7.5 0 0 0 0 3l-2 1.55 2 3.46 2.36-.95a7.5 7.5 0 0 0 2.6 1.5L10 22h4l.4-2.44a7.5 7.5 0 0 0 2.6-1.5l2.36.95 2-3.46-2-1.55c.1-.49.14-1 .14-1.5Z" />),
  tiket: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm13 1v2m0 4v2" />),
  lacak: (<path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />),
  layar: (<path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 15h10" />),
  keluar: (<path strokeLinecap="round" strokeLinejoin="round" d="M15 12H4m0 0 3-3m-3 3 3 3M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4m6-16h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2m-2-9 3-3m-3 3-3-3m3 3v9" />),
  cek: (<path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />),
};

export function Ikon({ nama, className }: { nama: IkonNama; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-5 shrink-0", className)} fill="none" stroke="currentColor" strokeWidth={1.8}>
      {IKON_PATH[nama]}
    </svg>
  );
}

/* ── Kartu ──────────────────────────────────────── */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-line bg-card shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5 sm:p-6", className)}>{children}</div>;
}

/* ── Badge status ───────────────────────────────── */
const STATUS_STYLE: Record<QueueStatus, string> = {
  menunggu: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-300/10 dark:text-amber-200 dark:border-amber-300/30",
  dipanggil: "bg-[#f6ecd6] text-[#6d5527] border-[#e2cda1] dark:bg-[#c6a76a]/15 dark:text-[#e6d199] dark:border-[#c6a76a]/40",
  dilayani: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-300/30",
  selesai: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-300/30",
  dilewati: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/15",
  dibatalkan: "bg-red-50 text-red-700 border-red-200 dark:bg-red-400/15 dark:text-red-200 dark:border-red-300/30",
};

export function StatusBadge({ status, pulse }: { status: QueueStatus; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        STATUS_STYLE[status],
        pulse && status === "dipanggil" && "animate-called",
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function DemoBadge() {
  return (
    <span
      title="Angka contoh untuk prototipe, bukan data operasional aktual."
      className="inline-flex items-center rounded-full border border-dashed border-brand-500/50 bg-brand-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-200"
    >
      Data demo
    </span>
  );
}

export function LiveBadge() {
  return (
    <span
      title="Data live dari database Supabase."
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-400/15 dark:text-emerald-200"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      Data live
    </span>
  );
}

/* ── Formulir ───────────────────────────────────── */
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink-900">
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-[12px] border border-line bg-white px-3.5 text-[15px] text-ink-900 placeholder:text-ink-500/70",
        "hover:border-navy-900/30 focus:border-brand-600 focus:outline-none",
        "dark:bg-white/5 dark:hover:border-white/30",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-[12px] border border-line bg-white px-3.5 text-[15px] text-ink-900",
        "hover:border-navy-900/30 focus:border-brand-600 focus:outline-none",
        "dark:bg-white/5 dark:hover:border-white/30 [&>option]:dark:bg-navy-900",
        props.className,
      )}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "border-brand-100 bg-brand-50 text-navy-900 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/25 dark:bg-emerald-400/10 dark:text-emerald-100",
    error: "border-red-200 bg-red-50 text-red-900 dark:border-red-300/25 dark:bg-red-400/10 dark:text-red-100",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[12px] border px-4 py-3 text-sm leading-relaxed", tones[tone])}>
      {children}
    </div>
  );
}

/* ── State ──────────────────────────────────────── */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function LoadingState({ teks = "Memuat data…" }: { teks?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-14 text-ink-600">
      <Spinner className="size-8 text-brand-600" />
      <p className="text-sm font-medium">{teks}</p>
    </div>
  );
}

export function EmptyState({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div aria-hidden className="mb-2 flex size-12 items-center justify-center rounded-full bg-navy-900/5 dark:bg-white/10">
        <svg viewBox="0 0 24 24" className="size-6 text-navy-900/60 dark:text-white/60" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-ink-900">{judul}</h3>
      {deskripsi && <p className="max-w-sm text-sm text-ink-600">{deskripsi}</p>}
      {aksi && <div className="mt-3">{aksi}</div>}
    </div>
  );
}

export function ErrorState({
  judul = "Data belum berhasil dimuat",
  deskripsi = "Terjadi gangguan saat memuat data. Silakan coba lagi.",
  onRetry,
}: {
  judul?: string;
  deskripsi?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div aria-hidden className="mb-2 flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-400/10">
        <svg viewBox="0 0 24 24" className="size-6 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-ink-900">{judul}</h3>
      <p className="max-w-sm text-sm text-ink-600">{deskripsi}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

/* ── Header halaman ─────────────────────────────── */
export function PageHeader({
  judul,
  deskripsi,
  aksi,
  badge,
  eyebrow,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  badge?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase text-brand-700 dark:border-white/15 dark:bg-white/5 dark:text-emerald-200">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {eyebrow}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{judul}</h1>
          {badge}
        </div>
        {deskripsi && <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}

/* ── Judul section publik ─────────────────────────── */
export function SectionHeading({
  eyebrow,
  judul,
  deskripsi,
  aksi,
  terang,
}: {
  eyebrow?: string;
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  terang?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={cn("text-xs font-bold tracking-[0.18em] uppercase", terang ? "text-cyan-glow" : "text-brand-600 dark:text-emerald-300")}>
            {eyebrow}
          </p>
        )}
        <h2 className={cn("mt-2 text-2xl font-extrabold tracking-tight sm:text-[32px] sm:leading-tight", terang ? "text-white" : "text-navy-900 dark:text-white")}>
          {judul}
        </h2>
        {deskripsi && <p className={cn("mt-2 text-[15px] leading-relaxed", terang ? "text-white/70" : "text-ink-600")}>{deskripsi}</p>}
      </div>
      {aksi && <div className="flex items-center gap-2">{aksi}</div>}
    </div>
  );
}

export function StatCard({
  label,
  nilai,
  sub,
  href,
  ikon,
}: {
  label: string;
  nilai: string | number;
  sub?: string;
  href?: string;
  ikon?: IkonNama;
}) {
  const isi = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        {ikon && (
          <span aria-hidden className="flex size-8 items-center justify-center rounded-[10px] bg-navy-900/5 text-navy-900 dark:bg-white/10 dark:text-white">
            <Ikon nama={ikon} className="size-4" />
          </span>
        )}
      </div>
      <p className="tnum mt-1 text-3xl font-bold tracking-tight text-navy-900 dark:text-white">{nilai}</p>
      {sub && <p className="mt-1 text-[13px] text-ink-500">{sub}</p>}
    </>
  );
  if (!href) {
    return (
      <Card>
        <CardBody>{isi}</CardBody>
      </Card>
    );
  }
  return (
    <Link
      href={href}
      aria-label={`${label}: ${nilai}. Buka halaman terkait.`}
      className="card-lift block rounded-[16px]"
    >
      <Card className="h-full transition-colors hover:border-navy-900/30 dark:hover:border-white/30">
        <CardBody>{isi}</CardBody>
      </Card>
    </Link>
  );
}

/* ── Pagination ─────────────────────────────────── */
export function Pagination({
  halaman,
  totalHalaman,
  onHalaman,
  totalItem,
}: {
  halaman: number;
  totalHalaman: number;
  onHalaman: (h: number) => void;
  totalItem?: number;
}) {
  if (totalHalaman <= 1) return null;
  return (
    <nav aria-label="Navigasi halaman" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-ink-500">
        Halaman {halaman} dari {totalHalaman}
        {typeof totalItem === "number" ? ` · ${totalItem} data` : ""}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={halaman <= 1}
          onClick={() => onHalaman(halaman - 1)}
          className="h-9 rounded-lg border border-line px-3 text-sm font-bold text-navy-900 disabled:cursor-not-allowed disabled:opacity-40 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40"
        >
          ← Prev
        </button>
        {Array.from({ length: totalHalaman }, (_, i) => i + 1)
          .filter((h) => h === 1 || h === totalHalaman || Math.abs(h - halaman) <= 1)
          .map((h, idx, arr) => (
            <span key={h} className="flex items-center gap-1.5">
              {idx > 0 && arr[idx - 1] !== h - 1 && <span aria-hidden className="text-ink-500">…</span>}
              <button
                type="button"
                onClick={() => onHalaman(h)}
                aria-current={h === halaman ? "page" : undefined}
                className={
                  h === halaman
                    ? "h-9 min-w-9 rounded-lg bg-navy-900 px-2 text-sm font-bold text-white dark:bg-emerald-400 dark:text-navy-950"
                    : "h-9 min-w-9 rounded-lg border border-line px-2 text-sm font-bold text-navy-900 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40"
                }
              >
                {h}
              </button>
            </span>
          ))}
        <button
          type="button"
          disabled={halaman >= totalHalaman}
          onClick={() => onHalaman(halaman + 1)}
          className="h-9 rounded-lg border border-line px-3 text-sm font-bold text-navy-900 disabled:cursor-not-allowed disabled:opacity-40 hover:border-navy-900/40 dark:text-white dark:hover:border-white/40"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
