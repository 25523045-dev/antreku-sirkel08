"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Tema = "terang" | "gelap";

const STORAGE_KEY = "antreku:tema";
const EVENT_TEMA = "antreku:tema-berubah";

const TemaContext = createContext<{ tema: Tema; alihTema: () => void }>({
  tema: "terang",
  alihTema: () => {},
});

function terapkanTema(tema: Tema) {
  const root = document.documentElement;
  root.classList.toggle("dark", tema === "gelap");
  root.style.colorScheme = tema === "gelap" ? "dark" : "light";
}

/** Baca tema efektif (client-only). Prioritas: localStorage → prefers-color-scheme → terang. */
function bacaTema(): Tema {
  if (typeof document !== "undefined" && document.documentElement.classList.contains("dark")) {
    return "gelap";
  }
  try {
    if (typeof window !== "undefined") {
      const tersimpan = window.localStorage.getItem(STORAGE_KEY);
      if (tersimpan === "gelap" || tersimpan === "terang") return tersimpan;
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "gelap";
    }
  } catch {
    /* penyimpanan tidak tersedia — fallback ke prefers-color-scheme */
    try {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "gelap";
      }
    } catch {
      /* matchMedia tidak tersedia */
    }
  }
  return "terang";
}

function langgananTema(notify: () => void) {
  window.addEventListener(EVENT_TEMA, notify);
  window.addEventListener("storage", notify);
  let mql: MediaQueryList | null = null;
  let onOsChange: (() => void) | null = null;
  try {
    mql = window.matchMedia("(prefers-color-scheme: dark)");
    onOsChange = () => {
      // Hanya ikuti OS bila pengguna belum meng-override via toggle.
      try {
        if (window.localStorage.getItem(STORAGE_KEY) == null) {
          terapkanTema(mql!.matches ? "gelap" : "terang");
          notify();
        }
      } catch {
        /* abaikan */
      }
    };
    mql.addEventListener("change", onOsChange);
  } catch {
    /* matchMedia tidak tersedia */
  }
  return () => {
    window.removeEventListener(EVENT_TEMA, notify);
    window.removeEventListener("storage", notify);
    try {
      if (mql && onOsChange) mql.removeEventListener("change", onOsChange);
    } catch {
      /* abaikan */
    }
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // getServerSnapshot "terang" + class anti-FOUC = tanpa kedip & tanpa warning hidrasi.
  const tema = useSyncExternalStore(langgananTema, bacaTema, () => "terang" as Tema);

  const alihTema = useCallback(() => {
    const berikut: Tema = bacaTema() === "terang" ? "gelap" : "terang";
    terapkanTema(berikut);
    try {
      window.localStorage.setItem(STORAGE_KEY, berikut);
    } catch {
      /* penyimpanan tidak tersedia — tema tetap berlaku sesi ini */
    }
    window.dispatchEvent(new Event(EVENT_TEMA));
  }, []);

  return <TemaContext.Provider value={{ tema, alihTema }}>{children}</TemaContext.Provider>;
}

export function useTema() {
  return useContext(TemaContext);
}

/**
 * Skrip inline di <head>: memasang class .dark SEBELUM paint pertama
 * agar tidak berkedip dari tema yang salah. Urutan: localStorage →
 * prefers-color-scheme. Tidak membaca apa pun saat SSR.
 */
export function ThemeInitScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='gelap'||(t!=='terang'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
      }}
    />
  );
}

/** Tombol matahari/bulan. Pakai di header publik, topbar admin, login, display. */
export function ThemeToggle({ ringkas }: { ringkas?: boolean }) {
  const { tema, alihTema } = useTema();
  const gelap = tema === "gelap";
  const label = gelap ? "Alih ke mode terang" : "Alih ke mode gelap";

  return (
    <button
      type="button"
      onClick={alihTema}
      aria-label={label}
      title={label}
      aria-pressed={gelap}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-navy-900 transition-colors hover:border-navy-900/40 dark:border-white/15 dark:bg-white/5 dark:text-amber-200 dark:hover:border-white/40"
    >
      <span aria-hidden className="relative block size-5">
        {/* Ikon bulan (tampil saat terang) / matahari (tampil saat gelap) */}
        {gelap ? (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <circle cx="12" cy="12" r="4.2" />
            <path strokeLinecap="round" d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
          </svg>
        )}
      </span>
      {!ringkas && <span className="sr-only">{label}</span>}
    </button>
  );
}
