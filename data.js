// Dataset preset 10 ide Kelompok 3 (hasil LKPD 5)
const PRESET_IDEAS = [
  { nama: "Transparent Fee & Net Profit Calculator", target: "Penjual", f: 5, i: 5 },
  { nama: "Transparent Checkout Breakdown", target: "Pembeli", f: 5, i: 5 },
  { nama: "Smart Packaging Proof / Bukti Kemasan Aman", target: "Penjual", f: 5, i: 4 },
  { nama: "Auto-Sync Stock & Variant Guard", target: "Penjual", f: 4, i: 4 },
  { nama: "Live Package Condition Tracking", target: "Pembeli", f: 4, i: 4 },
  { nama: "Policy & Traffic Radar Alert", target: "Penjual", f: 4, i: 3 },
  { nama: "Pre-Checkout Cek Ongkir Luar Jawa Akurat", target: "Pembeli", f: 4, i: 3 },
  { nama: "Real-Time Variant Stock Badge", target: "Pembeli", f: 4, i: 3 },
  { nama: "1-Click Smart Return & Instant Resi", target: "Pembeli", f: 2, i: 4 },
  { nama: "Fast-Fund Escrow / Dana Talangan Kilat", target: "Penjual", f: 2, i: 5 }
];

// Deskripsi aturan tiap kuadran (untuk kartu ringkasan)
const QDESC = { prioritas:"Feasibility tinggi · Impact tinggi", potensi:"Feasibility rendah · Impact tinggi", pertimbangkan:"Feasibility tinggi · Impact rendah", tunda:"Feasibility rendah · Impact rendah" };

// Konfigurasi 4 kuadran: label, warna layar (color), warna cetak yang lebih gelap (dark), kelas CSS
const QUADRANTS = {
  prioritas:     { label: "⭐ PRIORITAS UTAMA", color: "#14b8a6", dark: "#0f766e", cls: "q-prioritas" },
  potensi:       { label: "POTENSI",            color: "#ec4899", dark: "#be185d", cls: "q-potensi" },
  pertimbangkan: { label: "PERTIMBANGKAN",      color: "#f59e0b", dark: "#b45309", cls: "q-pertimbangkan" },
  tunda:         { label: "TUNDA",              color: "#94a3b8", dark: "#475569", cls: "q-tunda" }
};

const SKALA = { 1: "Sangat Rendah", 2: "Rendah", 3: "Sedang", 4: "Tinggi", 5: "Sangat Tinggi" };
const BATAS_TINGGI = 4; // nilai 4–5 = Tinggi, 1–3 = Rendah

// Catatan pertimbangan default (berbasis User Persona LKPD 4), bisa diedit di aplikasi
const DEFAULT_CATATAN = "Dipilih karena selaras dengan User Persona utama kelompok (Muhamad Rafi Fauzhan, penjual sepatu wanita online) yang paling terdampak kenaikan biaya admin marketplace 20–30% dan PPh, sehingga berdampak langsung menjaga margin keuntungan usaha.";

// Menentukan kuadran berdasarkan aturan LKPD 6
function getQuadrant(f, i) {
  const fT = f >= BATAS_TINGGI, iT = i >= BATAS_TINGGI;
  if (fT && iT) return "prioritas";
  if (!fT && iT) return "potensi";
  if (fT && !iT) return "pertimbangkan";
  return "tunda";
}