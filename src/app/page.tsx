import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, PENGUNJUNG_COOKIE } from "@/lib/sesi";

/**
 * Gerbang rute `/`.
 *
 * - Tanpa sesi (tanpa cookie penanda) → `/masuk` (pilihan Login Admin / Login Pengunjung).
 * - Cookie `antreku_admin=1` → `/admin`.
 * - Cookie `antreku_pengunjung=1` → `/pengunjung`.
 * - Kedua cookie ada (peran terpisah, bisa aktif bersamaan) → `/admin` diprioritaskan.
 *
 * Halaman beranda publik tetap tersedia di `/beranda` (tanpa proteksi).
 *
 * Pembacaan sesi (cookies) wajib berada di dalam boundary `<Suspense>` agar
 * rute ini tetap bisa di-prerender (Cache Components): cangkang statis
 * (fallback) dikirim dulu, keputusan redirect berjalan saat request.
 */
export default function RootGate() {
  return (
    <Suspense fallback={<GateFallback />}>
      <Gate />
    </Suspense>
  );
}

async function Gate(): Promise<never> {
  const store = await cookies();
  const admin = store.get(ADMIN_COOKIE)?.value === "1";
  const pengunjung = store.get(PENGUNJUNG_COOKIE)?.value === "1";

  if (admin) redirect("/admin");
  if (pengunjung) redirect("/pengunjung");
  redirect("/masuk");
}

function GateFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <p role="status" className="animate-pulse text-sm font-semibold text-ink-600">
        Mengarahkan…
      </p>
    </main>
  );
}
