import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proteksi rute berbasis sesi Supabase (Fase 1 — menggantikan cookie demo).
 * - /admin/* (kecuali /admin/login): wajib sesi + peran admin (public.profiles).
 * - /pengunjung (dasbor): wajib ada sesi (anonim pun boleh).
 * - Halaman login selalu terbuka.
 * - `/`: ada sesi admin → /admin; ada sesi lain → /pengunjung; tanpa sesi → /masuk.
 * - Bila env Supabase belum terisi: fail-closed (rute privat → login, `/` → /masuk).
 */

function envSupabase(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

async function peranPengguna(
  sb: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<"admin" | "pengunjung" | null> {
  try {
    const { data } = await sb
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const role = (data as { role?: string } | null)?.role;
    if (role === "admin") return "admin";
    if (role === "pengunjung") return "pengunjung";
    return null;
  } catch {
    return null;
  }
}

function keLogin(req: NextRequest, path: string, dari?: string) {
  const url = new URL(path, req.url);
  if (dari) url.searchParams.set("dari", dari);
  return NextResponse.redirect(url);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const env = envSupabase();

  // Tanpa env: semua rute privat dikunci, gerbang ke /masuk.
  if (!env) {
    if (pathname === "/") return NextResponse.redirect(new URL("/masuk", req.url));
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      return keLogin(req, "/admin/login", pathname);
    }
    if (pathname.startsWith("/pengunjung") && pathname !== "/pengunjung/login") {
      return keLogin(req, "/pengunjung/login");
    }
    return NextResponse.next();
  }

  const res = NextResponse.next({ request: req });
  const sb = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  let userId: string | null = null;
  try {
    const { data: { user } } = await sb.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (pathname === "/") {
    if (!userId) return NextResponse.redirect(new URL("/masuk", req.url));
    const peran = await peranPengguna(sb, userId);
    if (peran === "admin") return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.redirect(new URL("/pengunjung", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return res;
    if (!userId) return keLogin(req, "/admin/login", pathname);
    const peran = await peranPengguna(sb, userId);
    if (peran !== "admin") return keLogin(req, "/admin/login", pathname);
    return res;
  }

  if (pathname.startsWith("/pengunjung")) {
    if (pathname === "/pengunjung/login") return res;
    if (!userId) return NextResponse.redirect(new URL("/pengunjung/login", req.url));
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/pengunjung/:path*"],
};
