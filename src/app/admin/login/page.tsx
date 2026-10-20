"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { masukAdmin, peranSaya } from "@/lib/supabase/auth";
import { LoadingState, Spinner } from "@/components/ui";

/**
 * Login Admin — satu kanvas emerald menyatu di kedua panel.
 * Kiri: papan antrean loket (simulasi panggilan otomatis).
 * Kanan: kartu login berbingkai emas berputar.
 */

const LOKET = [
  { nama: "Administrasi Akademik" },
  { nama: "Layanan Keuangan" },
  { nama: "Kemahasiswaan" },
] as const;

const MARQUEE = [
  { label: "INFO", teks: "Jam layanan 08.00 – 15.00 WIB" },
  { label: "TIPS", teks: "Siapkan KTM sebelum dipanggil" },
  { label: "INFO", teks: "Ambil nomor dari ponsel, tanpa antre di loket" },
  { label: "TIPS", teks: "Pantau panggilan dari layar antrean" },
] as const;

function naikNomor(nomor: string): string {
  const [huruf, angka] = nomor.split("-");
  const v = Number.parseInt(angka ?? "0", 10);
  const next = Number.isNaN(v) ? 1 : v + 1;
  return `${huruf ?? "A"}-${String(next).padStart(3, "0")}`;
}

function IkonMata({ terbuka }: { terbuka: boolean }) {
  return terbuka ? (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16M9.9 5.9A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.3 3.9M6 7.5A16.4 16.4 0 0 0 2.5 12S6 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6" />
    </svg>
  );
}

export default function LoginAdmin() {
  return (
    <Suspense fallback={<LoadingState teks="Menyiapkan halaman login…" />}>
      <FormLoginAdmin />
    </Suspense>
  );
}

function FormLoginAdmin() {
  const router = useRouter();
  const params = useSearchParams();
  const dari = params.get("dari");
  const tujuan = dari && dari.startsWith("/admin") ? dari : "/admin/antrean";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [lihatPassword, setLihatPassword] = useState(false);
  const [pesan, setPesan] = useState<{ nada: "error" | "sukses"; teks: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const refPassword = useRef<HTMLInputElement>(null);

  // Simulasi papan antrean: loket aktif bergilir + nomor tiap loket + sisa menunggu.
  const [loketAktif, setLoketAktif] = useState(0);
  const [nomorLoket, setNomorLoket] = useState<string[]>(["A-005", "B-011", "C-007"]);
  const [menunggu, setMenunggu] = useState(14);
  const aktifRef = useRef(0);

  // Sudah login sebagai admin → langsung ke tujuan (lapis kedua setelah proxy).
  useEffect(() => {
    let batal = false;
    peranSaya()
      .then((s) => {
        if (!batal && s?.peran === "admin") router.replace(tujuan);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [router, tujuan]);

  // Papan maju tiap 3,2 dtk; mati bila prefers-reduced-motion (tampil statis).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const next = (aktifRef.current + 1) % LOKET.length;
      aktifRef.current = next;
      setLoketAktif(next);
      setNomorLoket((prev) => prev.map((n, i) => (i === next ? naikNomor(n) : n)));
      setMenunggu((prev) => (prev <= 3 ? 14 : prev - 1));
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  async function masuk(ev: React.FormEvent) {
    ev.preventDefault();
    if (username.trim().length === 0) {
      setPesan({ nada: "error", teks: "Isi email admin terlebih dahulu." });
      return;
    }
    if (username.trim().length < 3 || !username.includes("@")) {
      setPesan({ nada: "error", teks: "Isi email admin yang valid." });
      return;
    }
    if (password.length === 0) {
      setPesan({ nada: "error", teks: "Isi password terlebih dahulu." });
      return;
    }
    if (password.length < 6) {
      setPesan({ nada: "error", teks: "Isi password minimal 6 karakter." });
      return;
    }
    setLoading(true);
    setPesan(null);
    try {
      await masukAdmin(username.trim(), password);
      setPesan({ nada: "sukses", teks: "Berhasil masuk, mengalihkan ke dashboard…" });
      window.setTimeout(() => router.push(tujuan), 500);
    } catch (e) {
      setPesan({ nada: "error", teks: e instanceof Error ? e.message : "Gagal masuk. Coba lagi." });
    } finally {
      setLoading(false);
    }
  }

  const nomor = nomorLoket[loketAktif] ?? "—";
  const layananAktif = LOKET[loketAktif]?.nama ?? "";

  return (
    <div className="login-root relative min-h-svh bg-[#06261f] text-[#effaf4]">
      {/* Glow + pola titik menyatu di kedua panel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute bottom-[-180px] left-[-180px] size-[640px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.5), transparent)" }}
        />
        <div
          className="absolute top-[-160px] right-[-160px] size-[600px] rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(217,180,90,0.34), transparent)" }}
        />
        <div
          className="absolute top-1/2 right-[8%] size-[500px] -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(closest-side, rgba(16,185,129,0.18), transparent)" }}
        />
        <div className="login-dots absolute inset-0" />
      </div>

      <div className="relative grid min-h-svh min-[900px]:grid-cols-[1.1fr_1fr]">
        {/* ═══ PANEL KIRI — papan antrean ═══ */}
        <section
          aria-label="Papan antrean loket"
          className="relative flex min-w-0 flex-col overflow-hidden border-b-[0.5px] border-[rgba(217,180,90,0.22)] min-[900px]:min-h-svh min-[900px]:border-r-[0.5px] min-[900px]:border-b-0"
        >
          {/* Lingkaran konsentris dekoratif di belakang kartu hero (terpotong di tepi panel) */}
          <div aria-hidden className="pointer-events-none absolute top-[110px] -left-[170px] size-[520px]">
            <svg viewBox="0 0 520 520" className="size-full" fill="none">
              <circle cx="260" cy="260" r="250" stroke="#d9b45a" strokeOpacity="0.22" strokeWidth="1.5" />
              <circle cx="260" cy="260" r="180" stroke="#d9b45a" strokeOpacity="0.15" strokeWidth="1.5" />
              <circle cx="260" cy="260" r="110" stroke="#d9b45a" strokeOpacity="0.1" strokeWidth="1.5" />
            </svg>
          </div>
          {/* Watermark nomor raksasa di belakang panel kiri bagian bawah */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-8 left-4 font-mono text-[18rem] leading-none font-bold text-[#effaf4] opacity-[0.025] select-none"
            style={{ transform: "rotate(-8deg)" }}
          >
            A-012
          </div>
          <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-10 sm:px-10 min-[900px]:py-8 min-[1200px]:max-w-2xl min-[1200px]:px-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-12 items-center justify-center rounded-[10px] bg-[#d9b45a] text-[#06261f]"
              >
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm13 1v2m0 4v2" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-xl font-extrabold tracking-tight text-[#effaf4]">AntreKu</span>
                <span className="block text-[11px] font-bold tracking-[0.22em] text-[#9fc8b8]">SIRKEL-08</span>
              </span>
            </div>

            <p className="mt-7 text-[11px] font-semibold tracking-[0.2em] text-[#d9b45a]">
              UNIVERSITAS ISLAM INDONESIA
            </p>
            <h1 className="mt-2 max-w-[20rem] text-[2rem] leading-[1.05] font-extrabold tracking-tight text-[#effaf4] sm:text-[2.3rem] min-[900px]:max-w-[34rem] min-[900px]:text-[3rem] min-[1200px]:text-[3.75rem] min-[1500px]:text-[4.25rem]">
              Antrean lebih mudah, <span className="text-[#ecd085]">layanan lebih cepat.</span>
            </h1>

            <p className="sr-only">Papan antrean demo</p>

            {/* Papan: disembunyikan dari pembaca layar karena angkanya berganti otomatis */}
            <div aria-hidden="true">
              {/* Kartu hero SEDANG DIPANGGIL */}
              <div className="relative mt-7 rounded-[18px] bg-gradient-to-br from-[rgba(217,180,90,0.7)] to-[rgba(217,180,90,0.08)] p-px">
                <div className="relative overflow-hidden rounded-[17px] bg-[#08332a] px-4 py-[14px] sm:px-4 sm:py-4 min-[1200px]:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold tracking-[0.16em] text-[#9fc8b8] min-[1200px]:text-xs">
                      SEDANG DIPANGGIL
                    </p>
                    <p className="flex items-center gap-2 text-xs font-semibold text-[#b9d6ca] min-[1200px]:text-[12px]">
                      <span className="login-blink size-2 rounded-full bg-[#34d399]" />
                      Langsung
                    </p>
                  </div>

                  <div className="relative mt-2 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <p
                        key={nomor}
                        className="login-pop font-mono text-[50px] leading-none font-bold tracking-[-0.02em] text-[#ecd085] tabular-nums min-[1200px]:text-[88px]"
                      >
                        {nomor}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] font-bold tracking-[0.16em] text-[#8fb5a7] min-[1200px]:text-xs">MENUJU</p>
                      <p className="mt-0.5 text-[20px] font-bold text-[#effaf4] min-[1200px]:text-[28px]">
                        Loket {loketAktif + 1}
                      </p>
                    </div>
                    {/* Cincin sinyal: absolute, terpusat di kanan nomor, terpotong rapi oleh overflow-hidden kartu */}
                    <span aria-hidden className="login-ping-wrap top-1/2 left-[62%]">
                      <span className="login-ping" />
                      <span className="login-ping [animation-delay:1.3s]" />
                    </span>
                  </div>

                  <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/10 min-[1200px]:h-1">
                    <div key={nomor} className="login-progress h-full rounded-full" />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 text-[13px]">
                    <p className="min-w-0 truncate font-semibold text-[#b9d6ca]">{layananAktif}</p>
                    <p className="shrink-0 text-[#9fc8b8]">
                      Menunggu <span className="font-bold text-[#ecd085] tabular-nums">{menunggu}</span> antrean
                    </p>
                  </div>
                </div>
              </div>

              {/* Daftar loket */}
              <ul className="mt-4 space-y-2">
                {LOKET.map((l, i) => {
                  const aktif = i === loketAktif;
                  return (
                    <li
                      key={aktif ? `aktif-${loketAktif}-${nomorLoket[i]}` : `idle-${l.nama}`}
                      className={`flex items-center justify-between gap-3 rounded-[14px] px-3.5 py-3 transition-[background-color,box-shadow] duration-[400ms] min-[1200px]:px-4 min-[1200px]:py-3.5 ${
                        aktif
                          ? "login-flash bg-[rgba(217,180,90,0.15)] shadow-[inset_3px_0_0_0_#d9b45a]"
                          : "bg-white/[0.04]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold tracking-[0.14em] text-[#9fc8b8] min-[1200px]:text-xs">
                          LOKET {i + 1}
                        </p>
                        <p className="truncate text-sm font-semibold text-[#effaf4] min-[1200px]:text-[15px]">{l.nama}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span
                          className={
                            aktif
                              ? "rounded-full bg-[#d9b45a] px-2.5 py-1 text-[11px] font-bold text-[#07342b] min-[1200px]:text-xs"
                              : "rounded-full border border-[#34d399]/50 px-2.5 py-1 text-[11px] font-semibold text-[#34d399] min-[1200px]:text-xs"
                          }
                        >
                          {aktif ? "Memanggil" : "Melayani"}
                        </span>
                        <span
                          className={`font-mono font-bold text-[#effaf4] tabular-nums ${
                            aktif
                              ? "text-sm min-[1200px]:text-[28px]"
                              : "text-sm min-[1200px]:text-[18px]"
                          }`}
                        >
                          {nomorLoket[i] ?? "—"}
                        </span>
                      </div>
                    </li>
                  );
                })}
                {/* Baris ke-4: statis, tidak ikut simulasi */}
                <li className="flex items-center justify-between gap-3 rounded-[14px] bg-white/[0.04] px-3.5 py-3 opacity-50 min-[1200px]:px-4 min-[1200px]:py-3.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-[#9fc8b8] min-[1200px]:text-xs">
                      LOKET 4
                    </p>
                    <p className="truncate text-sm font-semibold text-[#effaf4] min-[1200px]:text-[15px]">Layanan Umum</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-[#8fb5a7] min-[1200px]:text-xs">
                      Nonaktif
                    </span>
                    <span className="font-mono text-sm font-bold text-[#effaf4] tabular-nums min-[1200px]:text-[18px]">
                      —
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Marquee info layanan */}
          <div className="login-marquee relative mt-8 w-full">
            <div className="login-marquee-track py-3 text-[13px] whitespace-nowrap min-[1200px]:text-xs">
              <div className="flex shrink-0 items-center gap-8 pr-8">
                {MARQUEE.map((m) => (
                  <span key={m.teks} className="flex items-center gap-2">
                    <span className="font-medium text-[#d9b45a]">{m.label}</span>
                    <span className="text-[#b9d6ca]">{m.teks}</span>
                  </span>
                ))}
              </div>
              <div aria-hidden="true" className="flex shrink-0 items-center gap-8 pr-8">
                {MARQUEE.map((m) => (
                  <span key={m.teks} className="flex items-center gap-2">
                    <span className="font-medium text-[#d9b45a]">{m.label}</span>
                    <span className="text-[#b9d6ca]">{m.teks}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ PANEL KANAN — kartu login ═══ */}
        <section aria-label="Login admin" className="relative flex min-w-0 flex-col min-[900px]:min-h-svh">
          <div className="flex items-center justify-start px-4 pt-4 sm:px-8">
            <Link
              href="/beranda"
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-[#9fc8b8] transition-colors hover:text-[#d9b45a]"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
              </svg>
              Beranda
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 min-[900px]:py-8">
            <div className="login-spin-frame w-full max-w-[340px] overflow-hidden rounded-[22px] p-[2px] shadow-[0_0_80px_rgba(217,180,90,0.18)] min-[1200px]:max-w-[440px]">
              <div className="relative z-[1] rounded-[21px] bg-[#07302a] p-5 min-[1200px]:p-9">
                <p className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(217,180,90,0.45)] bg-[rgba(217,180,90,0.10)] px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#ecd085]">
                  <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
                  </svg>
                  PORTAL PETUGAS
                </p>
                <h2 className="mt-3 text-[1.6rem] leading-tight font-extrabold tracking-tight text-[#effaf4] min-[1200px]:mt-4 min-[1200px]:text-[2.1rem]">
                  Selamat datang <span className="text-[#34d399]">kembali</span>
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#9fc8b8] min-[1200px]:mt-2 min-[1200px]:text-[15px]">
                  Masuk untuk memanggil nomor, melayani, dan memantau antrean loket.
                </p>

                <div aria-live="polite" className="mt-4 min-[1200px]:mt-5">
                  {pesan && (
                    <p
                      role={pesan.nada === "error" ? "alert" : "status"}
                      className={
                        pesan.nada === "error"
                          ? "rounded-[14px] border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200"
                          : "rounded-[14px] border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200"
                      }
                    >
                      {pesan.teks}
                    </p>
                  )}
                </div>

                <form onSubmit={masuk} noValidate className="mt-4 min-[1200px]:mt-5">
                  <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-[#effaf4] min-[1200px]:mb-2 min-[1200px]:text-[14px]">
                      Email admin
                    </label>
                    <div className="group relative">
                      <svg viewBox="0 0 24 24" aria-hidden className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#8fb5a7] transition-colors group-focus-within:text-[#d9b45a]" fill="currentColor">
                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z" />
                      </svg>
                      <input
                        id="username"
                        type="email"
                        autoComplete="username"
                        placeholder="cth. admin@kampus.ac.id"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="h-[52px] w-full rounded-[14px] border-[1.5px] border-white/14 bg-white/5 pr-4 pl-12 text-[15px] text-[#effaf4] placeholder:text-[#8fb5a7]/60 transition focus:border-[#d9b45a] focus:ring-4 focus:ring-[#d9b45a]/20 focus:outline-none min-[1200px]:h-14"
                      />
                    </div>
                  </div>
                  <div className="mt-4 min-[1200px]:mt-5">
                    <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#effaf4] min-[1200px]:mb-2 min-[1200px]:text-[14px]">
                      Password
                    </label>
                    <div className="group relative">
                      <svg viewBox="0 0 24 24" aria-hidden className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#8fb5a7] transition-colors group-focus-within:text-[#d9b45a]" fill="currentColor">
                        <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
                      </svg>
                      <input
                        id="password"
                        ref={refPassword}
                        type={lihatPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-[52px] w-full rounded-[14px] border-[1.5px] border-white/14 bg-white/5 pr-12 pl-12 text-[15px] text-[#effaf4] placeholder:text-[#8fb5a7]/60 transition focus:border-[#d9b45a] focus:ring-4 focus:ring-[#d9b45a]/20 focus:outline-none min-[1200px]:h-14"
                      />
                      <button
                        type="button"
                        onClick={() => setLihatPassword((v) => !v)}
                        aria-label={lihatPassword ? "Sembunyikan password" : "Tampilkan password"}
                        aria-pressed={lihatPassword}
                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-[#8fb5a7] transition-colors hover:text-[#ecd085]"
                      >
                        <IkonMata terbuka={lihatPassword} />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="login-btn-shine group mt-6 flex h-[54px] w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#d9b45a,#ecd085)] pr-2 pl-5 text-[15px] font-medium text-[#06261f] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#d9b45a]/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70 min-[1200px]:mt-[30px] min-[1200px]:h-[58px] min-[1200px]:text-base"
                  >
                    <span className="relative z-[2] flex items-center gap-2">
                      {loading && <Spinner className="size-4" />}
                      {loading ? "Memeriksa…" : "Masuk ke dashboard"}
                    </span>
                    <span
                      aria-hidden
                      className="relative z-[2] flex size-10 items-center justify-center rounded-[11px] bg-[#06261f] text-[#ecd085] transition-transform duration-200 group-hover:translate-x-[3px] min-[1200px]:size-11"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </span>
                  </button>
                </form>

                <p className="mt-4 flex items-center gap-2 text-[13px] text-[#9fc8b8] min-[1200px]:mt-5">
                  <svg viewBox="0 0 24 24" aria-hidden className="size-4 shrink-0 text-[#d9b45a]" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                  </svg>
                  Akses khusus petugas loket
                </p>
                <p className="mt-2 text-[13px] text-[#8fb5a7]">
                  Bukan petugas?{" "}
                  <Link
                    href="/pengunjung/login"
                    className="font-semibold text-[#34d399] underline underline-offset-4 transition-colors hover:text-[#ecd085]"
                  >
                    Masuk sebagai pengunjung
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <footer className="px-4 pb-5 text-center text-xs text-[#8fb5a7] sm:px-8">
            AntreKu SIRKEL-08 · Universitas Islam Indonesia
          </footer>
        </section>
      </div>
    </div>
  );
}
