"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bacaSesiPengunjung } from "@/lib/sesi";
import { peranSaya } from "@/lib/supabase/auth";
import { Alert } from "@/components/ui";

// Pemisah yang tidak mungkin muncul di nama maupun nomor tiket.
const PEMISAH = " | ";

/**
 * Banner lanjutan sesi di halaman /masuk.
 * - Admin: sesi Supabase + peran admin (server-verified via RLS profiles).
 * - Pengunjung: penanda sesi perangkat ini (nama + nomor).
 * Tidak melakukan redirect otomatis agar pengguna tetap bisa memilih peran lain
 * dan agar tidak terjadi redirect loop dengan gerbang `/`.
 */
export function StatusSesi() {
  const [admin, setAdmin] = useState<string | null>(null);
  // Penanda pengunjung dibaca sekali saat mount (sessionStorage perangkat ini).
  const [pengunjung] = useState<{ nama: string; nomor: string } | null>(() => {
    const p = bacaSesiPengunjung();
    if (!p) return null;
    const kunci = `${p.nama}${PEMISAH}${p.nomor}`;
    const idx = kunci.lastIndexOf(PEMISAH);
    return { nama: kunci.slice(0, idx), nomor: kunci.slice(idx + PEMISAH.length) };
  });

  useEffect(() => {
    let batal = false;
    peranSaya()
      .then((s) => {
        if (!batal && s?.peran === "admin") setAdmin(s.email ?? "admin");
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, []);

  if (!admin && !pengunjung) return null;

  return (
    <div className="mt-4">
      <Alert tone="success">
        <span className="block font-bold">
          Sesi aktif terdeteksi di perangkat ini
          {admin ? ` · Admin (${admin})` : ""}
          {pengunjung ? ` · Pengunjung (${pengunjung.nama} / ${pengunjung.nomor})` : ""}.
        </span>
        <span className="mt-2 flex flex-wrap gap-2">
          {admin && (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-[10px] bg-navy-900 px-4 text-sm font-bold text-white hover:bg-navy-800 dark:bg-emerald-400 dark:text-navy-950 dark:hover:bg-emerald-300"
            >
              Lanjutkan ke Dashboard Admin
            </Link>
          )}
          {pengunjung && (
            <Link
              href="/pengunjung"
              className="inline-flex h-9 items-center rounded-[10px] border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 hover:border-emerald-400 dark:border-emerald-300/30 dark:bg-emerald-400/10 dark:text-emerald-100"
            >
              Lanjutkan ke Area Pengunjung
            </Link>
          )}
        </span>
      </Alert>
    </div>
  );
}
