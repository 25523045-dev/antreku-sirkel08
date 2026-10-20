"use client";

import { useState } from "react";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LiveBadge, LoadingState, PageHeader } from "@/components/ui";
import { useLayananLive } from "@/lib/supabase/hooks";
import { hapusLayanan, hitungPakaiLayanan, simpanLayanan, toggleLayanan } from "@/lib/supabase/queries";
import type { Service } from "@/lib/types";

type FormState = { kode: string; nama: string; deskripsi: string; estimasi: string };

const AWAL: FormState = { kode: "", nama: "", deskripsi: "", estimasi: "5" };

export default function KelolaLayanan() {
  const { data: daftar, memuat, galat, muatUlang } = useLayananLive();
  const [form, setForm] = useState<FormState>(AWAL);
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "kodeUnik", string>>>({});
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  function validasi(): boolean {
    const e: typeof errors = {};
    const kode = form.kode.trim().toUpperCase();
    if (!/^[A-Z]{2,4}$/.test(kode)) e.kode = "Kode 2–4 huruf kapital (cth. AKD).";
    else if (daftar.some((s) => s.id !== editId && s.kode.toUpperCase() === kode))
      e.kodeUnik = `Kode “${kode}” sudah digunakan. Gunakan kode lain.`;
    const prefix = kode.charAt(0);
    if (!e.kode && !e.kodeUnik && daftar.some((s) => s.id !== editId && s.prefix.toUpperCase() === prefix))
      e.kodeUnik = `Prefix “${prefix}” sudah dipakai layanan lain. Gunakan kode dengan huruf awal berbeda.`;
    if (form.nama.trim().length < 4) e.nama = "Nama layanan minimal 4 huruf.";
    const est = Number(form.estimasi);
    if (!Number.isFinite(est) || est < 1 || est > 120) e.estimasi = "Estimasi 1–120 menit per orang.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function simpan(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validasi()) return;
    const kode = form.kode.trim().toUpperCase();
    setSibuk(true);
    try {
      if (editId) {
        await simpanLayanan({ id: editId, kode, nama: form.nama.trim(), deskripsi: form.deskripsi.trim() || "—", estimasiMenit: Number(form.estimasi), aktif: daftar.find((s) => s.id === editId)?.aktif ?? true, prefix: kode.charAt(0) });
        setPesan(`Layanan “${form.nama.trim()}” berhasil diperbarui. (Tersimpan di database.)`);
      } else {
        await simpanLayanan({ kode, nama: form.nama.trim(), deskripsi: form.deskripsi.trim() || "—", estimasiMenit: Number(form.estimasi), aktif: true, prefix: kode.charAt(0) });
        setPesan(`Layanan “${form.nama.trim()}” berhasil ditambahkan. (Tersimpan di database.)`);
      }
      setForm(AWAL);
      setEditId(null);
      setErrors({});
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Penyimpanan gagal. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  function mulaiEdit(s: Service) {
    setEditId(s.id);
    setForm({ kode: s.kode, nama: s.nama, deskripsi: s.deskripsi, estimasi: String(s.estimasiMenit) });
    setPesan(null);
  }

  async function toggleAktif(id: string) {
    const target = daftar.find((s) => s.id === id);
    if (!target) return;
    try {
      await toggleLayanan(id, !target.aktif);
      setPesan(`Layanan “${target.nama}” ${target.aktif ? "dinonaktifkan" : "diaktifkan"}. (Tersimpan di database.)`);
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Perubahan gagal. Coba lagi.");
    }
  }

  async function hapus(id: string) {
    const target = daftar.find((s) => s.id === id);
    if (!target) return;
    const pakai = await hitungPakaiLayanan(id).catch(() => ({ jumlah: 1, contoh: [] }));
    if (pakai.jumlah > 0) {
      setPesan(`Layanan “${target.nama}” tidak dapat dihapus: masih dipakai tiket (${pakai.contoh.join(", ")}${pakai.contoh.length < pakai.jumlah ? ", …" : ""}). Nonaktifkan saja bila perlu.`);
      return;
    }
    if (!window.confirm(`Hapus layanan “${target.nama}” (${target.kode})? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await hapusLayanan(id);
      if (editId === id) {
        setEditId(null);
        setForm(AWAL);
        setErrors({});
      }
      setPesan(`Layanan “${target.nama}” dihapus dari database. Riwayat tiket yang sudah ada tidak ikut terhapus.`);
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Hapus gagal. Coba lagi.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Data master" judul="Manajemen Layanan" deskripsi="Tambah, edit, hapus, dan aktif/nonaktifkan jenis layanan. Kode layanan tidak boleh duplikat." badge={<LiveBadge />} />

      {pesan && <div className="mb-4"><Alert tone="success">{pesan}</Alert></div>}

      {memuat && daftar.length === 0 ? (
        <LoadingState teks="Memuat layanan…" />
      ) : galat && daftar.length === 0 ? (
        <Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert>
      ) : (
      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">{editId ? "Edit layanan" : "Tambah layanan"}</h2>
            <form onSubmit={simpan} noValidate className="mt-3">
              <div>
                <Label htmlFor="kode">Kode layanan</Label>
                <Input id="kode" placeholder="cth. AKD" value={form.kode} onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })} maxLength={4} className="tnum font-mono uppercase" />
                <FieldError message={errors.kode} />
                <FieldError message={errors.kodeUnik} />
              </div>
              <div className="mt-3">
                <Label htmlFor="nama">Nama layanan</Label>
                <Input id="nama" placeholder="cth. Administrasi Akademik" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} maxLength={60} />
                <FieldError message={errors.nama} />
              </div>
              <div className="mt-3">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Input id="deskripsi" placeholder="Lingkup layanan…" value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} maxLength={120} />
              </div>
              <div className="mt-3">
                <Label htmlFor="estimasi">Estimasi durasi (menit/orang)</Label>
                <Input id="estimasi" type="number" min={1} max={120} value={form.estimasi} onChange={(e) => setForm({ ...form, estimasi: e.target.value })} />
                <FieldError message={errors.estimasi} />
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" className="flex-1" loading={sibuk}>{editId ? "Simpan Perubahan" : "Tambah Layanan"}</Button>
                {editId && <Button type="button" variant="secondary" onClick={() => { setEditId(null); setForm(AWAL); setErrors({}); }}>Batal</Button>}
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">Daftar layanan ({daftar.length})</h2>
            <ul className="mt-3 space-y-3">
              {daftar.map((s) => (
                <li key={s.id} className="rounded-[12px] border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="tnum rounded-lg bg-navy-900 px-2.5 py-1 font-mono text-sm font-bold text-white dark:bg-emerald-400 dark:text-navy-950">{s.kode}</span>
                      <div>
                        <p className="font-bold text-navy-900 dark:text-white">{s.nama}</p>
                        <p className="text-[13px] text-ink-500">Prefix {s.prefix} · ± {s.estimasiMenit} mnt/orang</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${s.aktif ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                      {s.aktif ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-600">{s.deskripsi}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => mulaiEdit(s)}>Edit</Button>
                    <Button size="sm" variant={s.aktif ? "secondary" : "primary"} onClick={() => toggleAktif(s.id)}>
                      {s.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => hapus(s.id)}>Hapus</Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
      )}
    </>
  );
}
