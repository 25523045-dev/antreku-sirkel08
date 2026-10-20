import { Suspense } from "react";
import type { Metadata } from "next";
import { PublicShell } from "@/components/site";
import { Card, LoadingState } from "@/components/ui";
import { TiketClient } from "./tiket-client";

export const metadata: Metadata = { title: "Tiket Antrean" };

export default function TiketPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <PublicShell>
          <div className="mx-auto max-w-2xl">
            <Card className="mt-6"><LoadingState teks="Memuat tiket…" /></Card>
          </div>
        </PublicShell>
      }
    >
      <TiketClient params={params} />
    </Suspense>
  );
}
