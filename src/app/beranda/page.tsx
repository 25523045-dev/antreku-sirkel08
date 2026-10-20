import type { Metadata } from "next";
import { BerandaClient } from "./beranda-client";

export const metadata: Metadata = { title: "Beranda" };

export default function Beranda() {
  return <BerandaClient />;
}
