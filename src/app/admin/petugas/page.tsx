"use client";

import { useMemo, useState } from "react";
import { Alert, Button, Card, CardBody, FieldError, Input, Label, LiveBadge, LoadingState, PageHeader, Select } from "@/components/ui";
import { useLoketLive, usePetugasLive } from "@/lib/supabase/hooks";
import { hapusPetugas, simpanPetugas, togglePetugas } from "@/lib/supabase/queries";
import type { Staff } from "@/lib/types";

export default function KelolaPetugas() {
  const { data: daftar, memuat, galat, muatUlang } = usePetugasLive();
  const { data: daftarLoket } = useLoketLive();
  const [cari, setCari] = useState("");
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [peran, setPeran] = useState<"admin" | "petugas">("petugas");
  const [loketId, setLoketId] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ nama?: string; username?: string }>({});
  const [pesan, setPesan] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const tersaring = useMemo(() => {
    const k = cari.trim().toLowerCase();
    return daftar.filter((p) => !k || `${p.nama} ${p.username}`.toLowerCase().includes(k));
  }, [daftar, cari]);

  function resetForm() {
    setNama(""); setUsername(""); setPeran("petugas"); setLoketId("");
    setEditId(null); setErrors({});
  }

  async function simpan(ev: React.FormEvent) {
    ev.preventDefault();
    const e: typeof errors = {};
    if (nama.trim().length < 3) e.nama = "Nama minimal 3 huruf.";
    if (!/^[a-z0-9.]{3,30}$/.test(username.trim().toLowerCase())) e.username = "Username 3–30 karakter (huruf kecil, angka, titik).";
    else if (daftar.some((p) => p.id !== editId && p.username.toLowerCase() === username.trim().toLowerCase()))
      e.username = "Username sudah digunakan.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSibuk(true);
    try {
      if (editId) {
        await simpanPetugas({ id: editId, nama: nama.trim(), username: username.trim().toLowerCase(), peran, loketId: loketId || null, aktif: daftar.find((p) => p.id === editId)?.aktif ?? true });
        setPesan(`Petugas “${nama.trim()}” berhasil diperbarui. (Tersimpan di database.)`);
      } else {
        await simpanPetugas({ nama: nama.trim(), username: username.trim().toLowerCase(), peran, loketId: loketId || null, aktif: true });
        setPesan(`Petugas “${nama.trim()}” ditambahkan. (Tersimpan di database.)`);
      }
      resetForm();
      muatUlang();
    } catch (err) {
      setPesan(err instanceof Error ? err.message : "Penyimpanan gagal. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  function mulaiEdit(p: Staff) {
    setEditId(p.id);
    setNama(p.nama);
    setUsername(p.username);
    setPeran(p.peran);
    setLoketId(p.loketId ?? "");
    setErrors({});
    setPesan(null);
  }

  async function hapus(id: string) {
    const target = daftar.find((p) => p.id === id);
    if (!target) return;
    const loketPakai = daftarLoket.filter((l) => l.petugas === target.nama);
    if (loketPakai.length > 0) {
      setPesan(`Petugas “${target.nama}” tidak dapat dihapus: masih ditugaskan di ${loketPakai.map((l) => l.nama).join(", ")}. Lepaskan penugasan dengan mengubah loket petugas lebih dulu.`);
      return;
    }
    if (!window.confirm(`Hapus petugas “${target.nama}” (@${target.username})? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await hapusPetugas(id);
      if (editId === id) resetForm();
      setPesan(`Petugas “${target.nama}” dihapus dari database.`);
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Hapus gagal. Coba lagi.");
    }
  }

  async function toggle(id: string) {
    const target = daftar.find((p) => p.id === id);
    if (!target) return;
    try {
      await togglePetugas(id, !target.aktif);
      setPesan(`Petugas “${target.nama}” ${target.aktif ? "dinonaktifkan" : "diaktifkan"}. (Tersimpan di database.)`);
      muatUlang();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Perubahan gagal. Coba lagi.");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Data master" judul="Manajemen Petugas & Loket Tugas" deskripsi="Kelola daftar petugas operasional dan penugasan loket. Akun login admin dikelola di Dashboard Supabase (Authentication)." badge={<LiveBadge />} />
      {pesan && <div className="mb-4"><Alert tone="success">{pesan}</Alert></div>}

      {memuat && daftar.length === 0 ? (
        <LoadingState teks="Memuat petugas…" />
      ) : galat && daftar.length === 0 ? (
        <Alert tone="error">Data live belum berhasil dimuat ({galat}). <button type="button" onClick={muatUlang} className="font-bold underline">Coba lagi</button></Alert>
      ) : (
      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <Card>
          <CardBody>
            <h2 className="font-bold text-navy-900 dark:text-white">{editId ? "Edit petugas" : "Tambah petugas"}</h2>
            <form onSubmit={simpan} noValidate className="mt-3">
              <div>
                <Label htmlFor="nama">Nama lengkap</Label>
                <Input id="nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth. Rina Melati" maxLength={60} />
                <FieldError message={errors.nama} />
              </div>
              <div className="mt-3">
                <Label htmlFor="username">Username akun</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="cth. rina.m" maxLength={30} className="font-mono" />
                <FieldError message={errors.username} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="peran">Peran</Label>
                  <Select id="peran" value={peran} onChange={(e) => setPeran(e.target.value as "admin" | "petugas")}>
                    <option value="petugas">Petugas</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loket">Loket</Label>
                  <Select id="loket" value={loketId} onChange={(e) => setLoketId(e.target.value)}>
                    <option value="">— Tanpa loket —</option>
                    {daftarLoket.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="submit" className="flex-1" loading={sibuk}>{editId ? "Simpan Perubahan" : "Tambah Petugas"}</Button>
                {editId && <Button type="button" variant="secondary" onClick={resetForm}>Batal</Button>}
              </div>
              <p className="mt-2 text-[13px] text-ink-500">Daftar ini roster operasional — bukan kredensial login.</p>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-navy-900 dark:text-white">Daftar petugas ({daftar.length})</h2>
              <Input placeholder="Cari nama / username…" value={cari} onChange={(e) => setCari(e.target.value)} className="max-w-60" aria-label="Cari petugas" />
            </div>
            <ul className="mt-3 space-y-2.5">
              {tersaring.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-line px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-navy-900/5 font-bold text-navy-900 dark:bg-white/10 dark:text-white">{p.nama.charAt(0)}</span>
                    <div>
                      <p className="font-bold text-ink-900">{p.nama} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600 uppercase dark:bg-white/10 dark:text-slate-300">{p.peran}</span></p>
                      <p className="tnum font-mono text-[13px] text-ink-500">@{p.username} · {p.loketId ? daftarLoket.find((l) => l.id === p.loketId)?.nama ?? "loket tidak dikenal" : "tanpa loket"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.aktif ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{p.aktif ? "Aktif" : "Nonaktif"}</span>
                    <Button size="sm" variant="secondary" onClick={() => mulaiEdit(p)}>Edit</Button>
                    <Button size="sm" variant="secondary" onClick={() => toggle(p.id)}>{p.aktif ? "Nonaktifkan" : "Aktifkan"}</Button>
                    <Button size="sm" variant="danger" onClick={() => hapus(p.id)}>Hapus</Button>
                  </div>
                </li>
              ))}
              {tersaring.length === 0 && <li className="py-8 text-center text-sm text-ink-500">Tidak ada petugas yang cocok dengan pencarian.</li>}
            </ul>
          </CardBody>
        </Card>
      </div>
      )}
    </>
  );
}
