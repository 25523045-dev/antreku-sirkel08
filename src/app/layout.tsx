import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, Geist } from "next/font/google";
import "./globals.css";
import { ThemeInitScript, ThemeProvider } from "@/components/theme";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700", "800"],
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: {
    default: "AntreKu SIRKEL-08 — Antrean Digital Layanan Kampus",
    template: "%s · AntreKu SIRKEL-08",
  },
  description:
    "Prototipe sistem antrean digital untuk pendaftaran layanan dan monitoring nomor antrean. Proyek SIRKEL-08.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", figtree.variable, bricolage.variable, "font-sans", geist.variable)}
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink-900">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
