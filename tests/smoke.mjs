/* Smoke test HTTP AntreKu SIRKEL-08 — tanpa dependensi (fetch bawaan Node 18+).
 * Memeriksa status, redirect guard, dan penanda konten tiap rute.
 * BUKAN pengganti uji browser end-to-end (lihat skrip CDP di temp).
 *
 * Jalankan:  npm run test:smoke [-- http://localhost:3000]
 * Server harus sudah berjalan (npm run start).
 */
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let lulus = 0;
let gagal = 0;
const kegagalan = [];

function lapor(nama, ok, info = "") {
  if (ok) {
    lulus += 1;
    console.log(`LULUS: ${nama}`);
  } else {
    gagal += 1;
    kegagalan.push(nama);
    console.log(`GAGAL: ${nama}${info ? ` | ${info}` : ""}`);
  }
}

async function ambil(path, init = {}) {
  const res = await fetch(BASE + path, { redirect: "manual", ...init });
  const teks = res.headers.get("content-type")?.includes("text/html")
    ? await res.text()
    : "";
  return { res, teks };
}

function lokasi(res) {
  return res.headers.get("location") ?? "";
}

// 1. Gerbang / (guard Supabase: cookie demo lama diabaikan server)
{
  const { res } = await ambil("/");
  lapor("GET / tanpa sesi 307 ke /masuk", res.status === 307 && lokasi(res).endsWith("/masuk"), `${res.status} ${lokasi(res)}`);
}
for (const [nama, cookie] of [
  ["admin", "antreku_admin=1"],
  ["pengunjung", "antreku_pengunjung=1"],
  ["keduanya", "antreku_admin=1; antreku_pengunjung=1"],
]) {
  const { res } = await ambil("/", { headers: { cookie } });
  lapor(`GET / +cookie demo ${nama} tetap 307 ke /masuk`, res.status === 307 && lokasi(res).endsWith("/masuk"), `${res.status} ${lokasi(res)}`);
}

// 2. Halaman publik 200 + penanda (penanda boleh dari cangkang streaming,
// karena konten tanggal-dinamis di-stream di balik Suspense).
const publik = [
  ["/masuk", ["Masuk sebagai Admin"]],
  ["/masuk", ["Masuk sebagai Pengunjung"]],
  ["/beranda", ["Antrean digital yang tertib", "Memuat beranda"]],
  ["/ambil-antrean", ["Ambil Nomor Antrean"]],
  ["/lacak-antrean", ["Lacak Antrean"]],
  ["/display", ["AntreKu"]],
  ["/admin/login", ["Login Admin"]],
  ["/pengunjung/login", ["Login Pengunjung"]],
];
for (const [path, penandas] of publik) {
  const { res, teks } = await ambil(path);
  const kena = penandas.some((p) => teks.includes(p));
  lapor(`GET ${path} 200 + penanda`, res.status === 200 && kena, `${res.status}`);
}

// 3. Proteksi
{
  const { res } = await ambil("/admin");
  lapor("GET /admin tanpa sesi 307 ke login", res.status === 307 && lokasi(res).includes("/admin/login"), `${res.status} ${lokasi(res)}`);
}
{
  const { res } = await ambil("/pengunjung");
  lapor("GET /pengunjung tanpa sesi 307 ke login", res.status === 307 && lokasi(res).includes("/pengunjung/login"), `${res.status} ${lokasi(res)}`);
}
{
  // Cookie demo basi tidak lagi membuka akses apa pun (guard server Supabase).
  const { res } = await ambil("/admin", { headers: { cookie: "antreku_admin=1" } });
  lapor("GET /admin +cookie demo 307 ke login", res.status === 307 && lokasi(res).includes("/admin/login"), `${res.status} ${lokasi(res)}`);
}

// 4. Tiket
{
  const { res, teks } = await ambil("/tiket/A-004");
  lapor("GET /tiket/A-004 200", res.status === 200 && teks.includes("Tiket Antrean"), `${res.status}`);
}
{
  const { res } = await ambil("/tiket/ZZZ-999");
  lapor("GET /tiket/ZZZ-999 200 (status tidak-ada di klien)", res.status === 200, `${res.status}`);
}

// 5. 404
{
  const { res } = await ambil("/rute-yang-tidak-ada-123");
  lapor("GET rute tak dikenal 404", res.status === 404, `${res.status}`);
}

console.log(`\nRingkas: ${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) {
  console.log("Gagal:", kegagalan.join("; "));
  process.exit(1);
}
