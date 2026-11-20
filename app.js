// ===== STATE & LOCALSTORAGE =====
const KEY = "lkpd6_kelompok3";
let ideas = [];          // daftar ide
let selectedId = null;   // ide final yang dipilih kelompok
let catatan = null;      // catatan pertimbangan; null = pakai teks default dari data.js
let editId = null;       // id ide yang sedang diedit
let scatterChart = null, barChart = null;
let printMode = false;   // true saat dicetak: grafik memakai warna terang agar hemat tinta
const $ = id => document.getElementById(id);

// Memuat data dari LocalStorage (kompatibel dengan data versi lama yang belum punya catatan)
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d) {
      ideas = d.ideas || [];
      selectedId = d.selectedId || null;
      catatan = typeof d.catatan === "string" ? d.catatan : null;
    }
  } catch (e) { ideas = []; }
}
// Menyimpan ke LocalStorage saja (tanpa render ulang)
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ ideas, selectedId, catatan })); } catch (e) { /* storage penuh/diblokir */ }
}
// Menyimpan lalu render ulang seluruh tampilan
function save() { persist(); renderAll(); }

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const total = x => x.f + x.i;                       // Total Score = Feasibility + Impact
const quad = x => getQuadrant(x.f, x.i);
const badge = x => `<span class="qbadge ${QUADRANTS[quad(x)].cls}">${QUADRANTS[quad(x)].label}</span>`;
const sorted = () => [...ideas].sort((a, b) => total(b) - total(a));

// Catatan yang berlaku: hasil editan kelompok, atau teks default jika belum pernah diedit
const getCatatan = () => (catatan === null ? DEFAULT_CATATAN : catatan);
const noteText = () => getCatatan().trim() || "(Belum ada catatan pertimbangan.)";

// Kandidat terbaik: kuadran Prioritas Utama dengan Total Score tertinggi (bisa lebih dari 1 jika seri)
function topCandidates() {
  const pr = ideas.filter(x => quad(x) === "prioritas");
  if (!pr.length) return [];
  const max = Math.max(...pr.map(total));
  return pr.filter(x => total(x) === max);
}
// Ide terpilih: pilihan kelompok jika masih valid, jika tidak ambil kandidat teratas
function chosen() {
  const c = topCandidates();
  return c.find(x => x.id === selectedId) || c[0] || null;
}

// ===== FORM (CREATE / UPDATE) =====
document.querySelectorAll(".score-sel").forEach(s => {
  s.innerHTML = Object.entries(SKALA).map(([k, v]) => `<option value="${k}">${k} - ${v}</option>`).join("");
  s.value = 3;
});

function showMsg(t) { $("formMsg").innerHTML = t ? `<div class="alert alert-danger py-2">${t}</div>` : ""; }

$("ideaForm").addEventListener("submit", e => {
  e.preventDefault();
  const nama = $("fNama").value.trim(), target = $("fTarget").value;
  const f = parseInt($("fF").value), i = parseInt($("fI").value);
  // Validasi: tidak kosong & skor 1–5
  if (!nama) return showMsg("Nama ide wajib diisi.");
  if (!target) return showMsg("Target pengguna wajib dipilih.");
  if (!(f >= 1 && f <= 5) || !(i >= 1 && i <= 5)) return showMsg("Skor harus di rentang 1–5.");
  showMsg("");
  if (editId) { // mode edit
    Object.assign(ideas.find(x => x.id === editId), { nama, target, f, i });
  } else {      // mode tambah
    ideas.push({ id: Date.now() + Math.random().toString(16).slice(2), nama, target, f, i });
  }
  resetForm(); save();
});

function resetForm() {
  editId = null; $("ideaForm").reset(); $("fF").value = 3; $("fI").value = 3;
  $("formTitle").textContent = "Tambah Ide Solusi"; $("btnSubmit").textContent = "Simpan Ide"; $("btnCancel").hidden = true;
}
$("btnCancel").onclick = resetForm;

// Tombol preset: memuat 10 ide dari data.js
$("btnPreset").onclick = () => {
  if (ideas.length && !confirm("Data saat ini akan diganti dengan 10 ide preset. Lanjutkan?")) return;
  ideas = PRESET_IDEAS.map((x, n) => ({ id: "p" + (n + 1), ...x }));
  selectedId = null; save();
};

// ===== AKSI TABEL (Edit / Hapus / Pilih) =====
$("tbody").addEventListener("click", e => {
  const btn = e.target.closest("button"); if (!btn) return;
  const id = btn.dataset.id, act = btn.dataset.act, x = ideas.find(v => v.id === id);
  if (act === "edit") {
    editId = id; $("fNama").value = x.nama; $("fTarget").value = x.target; $("fF").value = x.f; $("fI").value = x.i;
    $("formTitle").textContent = "Edit Ide"; $("btnSubmit").textContent = "Perbarui Ide"; $("btnCancel").hidden = false;
    $("ideaForm").scrollIntoView({ behavior: "smooth" });
  } else if (act === "del") {
    if (confirm("Hapus ide ini?")) { ideas = ideas.filter(v => v.id !== id); if (selectedId === id) selectedId = null; if (editId === id) resetForm(); save(); }
  } else if (act === "pick") { selectedId = id; save(); }
});
["search", "filterQ"].forEach(id => $(id).addEventListener("input", renderTable));

// Reset (termasuk catatan kembali ke default), Export, Cetak
$("btnReset").onclick = () => {
  if (confirm("Hapus SEMUA data?")) { ideas = []; selectedId = null; catatan = null; localStorage.removeItem(KEY); resetForm(); renderAll(); }
};
$("btnExport").onclick = () => {
  const data = { kelompok: "Kelompok 3 XI PPLG 2", ide_terpilih: chosen()?.nama || null, catatan_pertimbangan: getCatatan(), ideas };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "validasi-ide-kelompok3.json"; a.click();
};
$("btnPrint").onclick = () => window.print();

// ===== RENDER: KPI & TABEL =====
function renderKPI() {
  const c = chosen();
  $("kpiTotal").textContent = ideas.length;
  $("kpiPrio").textContent = ideas.filter(x => quad(x) === "prioritas").length;
  $("kpiAvg").textContent = ideas.length ? (ideas.reduce((s, x) => s + total(x), 0) / ideas.length).toFixed(1) : 0;
  $("kpiPick").textContent = c ? c.nama : "-";
}

function renderTable() {
  const q = $("filterQ").value, s = $("search").value.toLowerCase();
  const tops = topCandidates().map(x => x.id), tie = tops.length > 1;
  const rows = ideas.filter(x => (!q || quad(x) === q) && x.nama.toLowerCase().includes(s));
  $("tbody").innerHTML = rows.length ? rows.map((x, n) => `
    <tr><td>${n + 1}</td><td>${esc(x.nama)}</td><td>${x.target}</td><td>${x.f}</td><td>${x.i}</td>
    <td><b>${total(x)}</b></td><td>${badge(x)}</td>
    <td class="text-nowrap">
      <button class="btn btn-sm btn-outline-info" data-act="edit" data-id="${x.id}" title="Edit"><i class="bi bi-pencil"></i></button>
      <button class="btn btn-sm btn-outline-danger" data-act="del" data-id="${x.id}" title="Hapus"><i class="bi bi-trash"></i></button>
      ${tie && tops.includes(x.id) ? `<button class="btn btn-sm btn-tosca" data-act="pick" data-id="${x.id}">Jadikan Ide Terpilih</button>` : ""}
    </td></tr>`).join("") : `<tr><td colspan="8" class="text-center text-secondary py-4">Belum ada data. Tambah ide atau klik tombol preset.</td></tr>`;
}

// ===== GRAFIK (Chart.js) =====
// Tema warna grafik: gelap di layar, terang saat dicetak
function chartTheme() {
  return printMode
    ? { text: "#111827", grid: "#d1d5db", divider: "#6b7280", border: "#1f2937" }
    : { text: "#475569", grid: "#e2e8f0", divider: "#64748b", border: "#ffffff" };
}
const qColor = k => (printMode ? QUADRANTS[k].dark : QUADRANTS[k].color); // warna label kuadran

// Mengelompokkan ide yang koordinatnya sama persis menjadi satu titik berisi banyak nama
function groupByCoord(list) {
  const map = {};
  list.forEach(i => {
    const k = i.f + "," + i.i;
    (map[k] = map[k] || { x: i.f, y: i.i, names: [] }).names.push(i.nama);
  });
  return Object.values(map);
}

// Plugin: garis pembatas kuadran di 3.5, label 4 kuadran di sudut, dan angka jumlah ide pada titik bertumpuk
const quadPlugin = {
  id: "quadPlugin",
  beforeDatasetsDraw(ch) {
    const { ctx, chartArea: a, scales: { x, y } } = ch;
    const px = x.getPixelForValue(3.5), py = y.getPixelForValue(3.5);
    ctx.save();
    ctx.strokeStyle = chartTheme().divider; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
    ctx.setLineDash([]); ctx.font = "bold 11px 'Plus Jakarta Sans'"; ctx.globalAlpha = printMode ? 1 : .8;
    const put = (t, col, X, Y, al) => { ctx.fillStyle = col; ctx.textAlign = al; ctx.fillText(t, X, Y); };
    // Label diletakkan di sudut luar tiap kuadran agar tidak menimpa titik data
    put("POTENSI", qColor("potensi"), a.left + 8, a.top + 16, "left");
    put("⭐ PRIORITAS UTAMA", qColor("prioritas"), a.right - 8, a.top + 16, "right");
    put("TUNDA", qColor("tunda"), a.left + 8, a.bottom - 8, "left");
    put("PERTIMBANGKAN", qColor("pertimbangkan"), a.right - 8, a.bottom - 8, "right");
    ctx.restore();
  },
  afterDatasetsDraw(ch) {
    // Tulis angka (mis. 2 atau 3) di tengah titik yang mewakili lebih dari 1 ide
    const ctx = ch.ctx;
    ctx.save(); ctx.font = "bold 11px 'Plus Jakarta Sans'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#0f172a";
    ch.data.datasets.forEach((ds, di) => {
      if (!ch.isDatasetVisible(di)) return;
      ch.getDatasetMeta(di).data.forEach((pt, idx) => {
        const n = ds.data[idx].names.length;
        if (n > 1) ctx.fillText(n, pt.x, pt.y + 1);
      });
    });
    ctx.restore();
  }
};

function renderCharts() {
  const t = chartTheme();
  Chart.defaults.color = t.text;
  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.font.size = printMode ? 10 : 12;
  const anim = printMode ? false : { duration: 400 }; // tanpa animasi saat cetak agar langsung tergambar penuh

  // Hancurkan chart lama sebelum membuat yang baru (hindari bug canvas)
  if (scatterChart) scatterChart.destroy();
  if (barChart) barChart.destroy();

  // Grafik 1: Scatter Feasibility (X) vs Impact (Y), satu dataset per kuadran, titik sama digabung
  scatterChart = new Chart($("chartScatter"), {
    type: "scatter",
    data: { datasets: Object.entries(QUADRANTS).map(([k, v]) => ({
      label: v.label, backgroundColor: v.color, borderColor: t.border, borderWidth: 1.5,
      // Titik yang berisi lebih banyak ide digambar sedikit lebih besar
      pointRadius: c => 8 + 2 * ((c.raw?.names.length || 1) - 1),
      pointHoverRadius: c => 11 + 2 * ((c.raw?.names.length || 1) - 1),
      data: groupByCoord(ideas.filter(i => quad(i) === k))
    })) },
    options: {
      maintainAspectRatio: false, animation: anim,
      interaction: { mode: "point", intersect: true },
      layout: { padding: { right: 8, top: 4 } },
      scales: {
        // Sumbu 0–6 dengan langkah 1 supaya angka tidak dempet
        x: { min: 0, max: 6, ticks: { stepSize: 1 }, title: { display: true, text: "Feasibility" }, grid: { color: t.grid } },
        y: { min: 0, max: 6, ticks: { stepSize: 1 }, title: { display: true, text: "Impact" }, grid: { color: t.grid } }
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 12 } },
        tooltip: { callbacks: {
          // Judul = koordinat, isi = SEMUA nama ide pada koordinat tersebut
          title: items => { const r = items[0].raw; return `Feasibility ${r.x} · Impact ${r.y} (${r.names.length} ide)`; },
          label: c => c.raw.names.map(n => "• " + n)
        } }
      }
    },
    plugins: [quadPlugin]
  });

  // Catatan di bawah grafik matriks: jumlah ide vs jumlah titik koordinat unik
  const pts = new Set(ideas.map(i => i.f + "," + i.i)).size;
  $("chartNote").textContent = (ideas.length && pts < ideas.length)
    ? `Catatan: ${ideas.length} ide terpetakan pada ${pts} titik koordinat karena beberapa ide memiliki skor Feasibility & Impact yang sama (arahkan kursor ke titik untuk melihat seluruh daftar ide).`
    : "Catatan: arahkan kursor ke titik untuk melihat nama ide beserta skornya.";

  // Grafik 2: Bar horizontal Total Score, urut tertinggi → terendah, warna sesuai kuadran
  const s = sorted(), maxLen = printMode ? 22 : 28;
  barChart = new Chart($("chartBar"), {
    type: "bar",
    data: { labels: s.map(x => x.nama.length > maxLen ? x.nama.slice(0, maxLen - 2) + "…" : x.nama),
      datasets: [{ label: "Total Score", data: s.map(total), backgroundColor: s.map(x => QUADRANTS[quad(x)].color),
        borderColor: t.border, borderWidth: printMode ? 1 : 0, borderRadius: 6 }] },
    options: { indexAxis: "y", maintainAspectRatio: false, animation: anim,
      scales: {
        x: { min: 0, max: 10, ticks: { stepSize: 1 }, grid: { color: t.grid } },
        y: { ticks: { font: { size: printMode ? 9 : 10 }, autoSkip: false }, grid: { display: false } }
      },
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: c => s[c[0].dataIndex].nama } } } }
  });
}

// Saat cetak: ganti ke tema terang lalu sesuaikan ukuran chart dengan layout cetak
window.addEventListener("beforeprint", () => {
  printMode = true; renderCharts();
  [scatterChart, barChart].forEach(c => c && c.resize());
});
// Setelah cetak/batal: kembalikan tema gelap
window.addEventListener("afterprint", () => { printMode = false; renderCharts(); });

// ===== PANEL IDE PRIORITAS UTAMA TERPILIH + CATATAN PERTIMBANGAN =====
// Memperbarui tampilan catatan di kartu highlight & kesimpulan (tanpa menyentuh textarea agar kursor tidak loncat)
function refreshNote() {
  const p = $("pickNote"); if (p) p.textContent = noteText();
  renderReport();
}

function renderPick() {
  const c = chosen(), tops = topCandidates(), el = $("pickPanel");
  if (!c) { el.innerHTML = `<h5>🎯 1 Ide Prioritas Utama Terpilih</h5><p class="text-secondary mb-0">Belum ada ide di kuadran Prioritas Utama.</p>`; return; }
  const prio = ideas.filter(x => quad(x) === "prioritas").length;
  // Dropdown muncul hanya jika ada skor seri tertinggi
  const dd = tops.length > 1 ? `<div class="mb-3"><label class="form-label small">Ada ${tops.length} ide seri skor ${total(c)}. Tetapkan keputusan final:</label>
    <select class="form-select" id="pickSel">${tops.map(x => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.nama)} (${x.target})</option>`).join("")}</select></div>` : "";
  el.innerHTML = `<h5 class="mb-3">🎯 1 Ide Prioritas Utama Terpilih</h5>${dd}
    <div class="mb-3">
      <label class="form-label small" for="catatanInput">Catatan Pertimbangan Kelompok <span class="text-secondary">(boleh diedit, tersimpan otomatis)</span></label>
      <textarea id="catatanInput" class="form-control" rows="3"></textarea>
      <button type="button" class="btn btn-link btn-sm px-0" id="btnDefaultNote"><i class="bi bi-arrow-counterclockwise"></i> Pulihkan teks default (User Persona LKPD 4)</button>
    </div>
    <div class="pick-card"><h4 class="accent">${esc(c.nama)}</h4>
    <p class="mb-2">Target: <b>${c.target}</b> · Feasibility <b>${c.f}</b> (${SKALA[c.f]}) · Impact <b>${c.i}</b> (${SKALA[c.i]}) · Total <b>${total(c)}/10</b> · ${badge(c)}</p>
    <p class="mb-0 text-secondary">Alasan berdasarkan data: ide ini mudah direalisasikan (Feasibility ${c.f}) sekaligus berdampak besar (Impact ${c.i}), sehingga masuk kuadran Prioritas Utama dengan skor tertinggi dari ${ideas.length} ide (${prio} ide berstatus prioritas)${tops.length > 1 ? `; skor seri dengan ${tops.length - 1} ide lain sehingga diputuskan kelompok` : ""}.</p>
    <div class="note-box"><b>Catatan pertimbangan kelompok:</b> <span id="pickNote" class="note-text"></span></div></div>`;

  // Isi textarea lewat .value (aman dari karakter khusus) lalu pasang event
  const ta = $("catatanInput");
  ta.value = getCatatan();
  $("pickNote").textContent = noteText();
  ta.oninput = () => { catatan = ta.value; persist(); refreshNote(); };            // simpan tiap ketikan
  $("btnDefaultNote").onclick = () => { catatan = null; ta.value = DEFAULT_CATATAN; persist(); refreshNote(); };
  const sel = $("pickSel"); if (sel) sel.onchange = () => { selectedId = sel.value; save(); };
}

// ===== LAPORAN: tabel peringkat & kesimpulan =====
function renderReport() {
  $("reportBody").innerHTML = sorted().map((x, n) => `<tr><td>${n + 1}</td><td>${esc(x.nama)}</td><td>${x.target}</td><td>${x.f}</td><td>${x.i}</td><td><b>${total(x)}</b></td><td>${badge(x)}</td></tr>`).join("")
    || `<tr><td colspan="7" class="text-center text-secondary">Belum ada data.</td></tr>`;
  const c = chosen();
  $("conclusion").innerHTML = c
    ? `<b>Kesimpulan:</b> Dari ${ideas.length} ide yang divalidasi dengan matriks Feasibility vs Impact, ide terpilih Kelompok 3 adalah <b>${esc(c.nama)}</b> (${c.target}) dengan Total Score ${total(c)}/10 (Feasibility ${c.f}, Impact ${c.i}) di kuadran ${QUADRANTS[quad(c)].label}. Ide ini paling layak dikembangkan.
       <div class="mt-2"><b>Catatan pertimbangan kelompok:</b> <span class="note-text">${esc(noteText())}</span></div>`
    : `<b>Kesimpulan:</b> Belum ada ide di kuadran Prioritas Utama.`;
}

function renderAll() { renderQuadCards(); renderKPI(); renderTable(); renderCharts(); renderPick(); renderReport(); }

// Mulai aplikasi
load(); renderAll();

// ===== TAMPILAN BARU: kartu kuadran, sidebar, scrollspy =====
function renderQuadCards() {
  $("quadCards").innerHTML = Object.entries(QUADRANTS).map(([k, v]) => {
    const n = ideas.filter(x => quad(x) === k).length;
    return `<div class="col-6 col-xl-3"><div class="qcard" style="--qc:${v.color}"><span class="qcount">${n}</span><b>${v.label}</b><small>${QDESC[k]}</small></div></div>`;
  }).join("");
  $("navCount").textContent = ideas.length;
}
const sidebar = $("sidebar");
$("btnMenu").onclick = () => sidebar.classList.toggle("open");
document.querySelectorAll(".nav-link-x").forEach(a => a.addEventListener("click", () => sidebar.classList.remove("open")));
const links = [...document.querySelectorAll(".nav-link-x")];
document.querySelectorAll("main section[id], main header[id]").forEach(sec => {
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + sec.id)); }), { rootMargin: "-30% 0px -60% 0px" }).observe(sec);
});
renderQuadCards();