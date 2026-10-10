const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
function toast(m) {
  $("#toast").textContent = m;
  setTimeout(() => ($("#toast").textContent = ""), 3500);
}
const get = (o, p) => p.split(".").reduce((a, k) => a && a[k], o);
const set = (o, p, v) => {
  const k = p.split("."),
    l = k.pop();
  k.reduce((a, x) => (a[x] = a[x] || {}), o)[l] = v;
};
const FIELDS = [
  ["h", "Tampilan beranda (kosong = otomatis)"],
  ["hero.ids.0", "Banner utama — kartu besar (kiri)", "product"],
  ["hero.ids.1", "Banner utama — kartu kanan bawah", "product"],
  ["hero.ids.2", "Banner utama — kartu kecil (kanan atas)", "product"],
  ["spot.id", "Pilihan Editor — produk yang ditampilkan", "product"],
  ["h", "Lokasi & deskripsi toko"],
  ["store.location", "Lokasi toko"],
  ["store.address", "Alamat lengkap"],
  ["store.mapsUrl", "Link Google Maps"],
  ["text.heroSub", "Deskripsi toko", "textarea"],
  ["h", "Tarif antar lokal (Rp, tarif tetap per zona)"],
  ["shipping.localZones.Zona 1", "Zona 1 — tarif (Rp)", "number"],
  ["shipping.localZones.Zona 2", "Zona 2 — tarif (Rp)", "number"],
  ["shipping.localZones.Zona 3", "Zona 3 — tarif (Rp)", "number"],
];
function render() {
  $("#f").innerHTML = FIELDS.map(([p, l, t]) =>
    p === "h"
      ? `<h3 class="w" style="margin:12px 0 0">${l}</h3>`
      : t === "product"
        ? `<label>${l}<select data-p="${p}"><option value="">Otomatis</option>${PL.map((x) => `<option value="${esc(x.id)}"${get(SETTINGS, p) === x.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></label>`
        : t === "textarea"
          ? `<label class="w">${l}<textarea data-p="${p}" rows="3">${esc(get(SETTINGS, p))}</textarea></label>`
          : `<label>${l}<input data-p="${p}" type="${t || "text"}" ${t === "number" ? 'min="0"' : ""} value="${esc(get(SETTINGS, p))}"></label>`,
  ).join("");
  $("#faq").innerHTML = SETTINGS.faq
    .map(
      (f) =>
        `<div class="fq"><input class="q" placeholder="Pertanyaan" value="${esc(f.q)}"><textarea class="a" rows="3" placeholder="Jawaban">${esc(f.a)}</textarea><button type="button" class="x">Hapus</button></div>`,
    )
    .join("");
}
function collect() {
  document
    .querySelectorAll("[data-p]")
    .forEach((e) =>
      set(
        SETTINGS,
        e.dataset.p,
        e.type === "number" ? Number(e.value) || 0 : e.value.trim(),
      ),
    );
  SETTINGS.faq = [...document.querySelectorAll(".fq")]
    .map((r) => ({
      q: r.querySelector(".q").value.trim(),
      a: r.querySelector(".a").value.trim(),
    }))
    .filter((f) => f.q && f.a);
}
$("#addq").onclick = () => {
  collect();
  SETTINGS.faq.push({ q: "", a: "" });
  render();
  document.querySelectorAll(".fq .q")[SETTINGS.faq.length - 1].focus();
};
$("#faq").onclick = (e) => {
  const b = e.target.closest(".x");
  if (!b) return;
  collect();
  const i = [...document.querySelectorAll(".fq")].indexOf(b.parentElement);
  document.querySelectorAll(".fq")[i].remove();
  collect();
  render();
};
$("#save").onclick = async () => {
  collect();
  const b = $("#save");
  b.disabled = true;
  try {
    const d = await fetch(STORE_CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        token: adminToken(),
        action: "saveSettings",
        settings: SETTINGS,
      }),
    }).then((r) => r.json());
    if (!d.ok) {
      if (d.error === "Unauthorized") resetToken();
      throw Error(
        d.error === "Unauthorized"
          ? "PIN salah, refresh lalu coba lagi"
          : d.error,
      );
    }
    localStorage.setItem("cm_settings", JSON.stringify(SETTINGS));
    toast("Tersimpan — langsung tampil di toko");
  } catch (x) {
    toast(x.message);
  } finally {
    b.disabled = false;
  }
};
(async () => {
  try {
    const d = await fetch(STORE_CONFIG.apiUrl + "?action=settings", {
      cache: "no-store",
    }).then((r) => r.json());
    if (d.ok && d.settings) mergeSettings(d.settings);
  } catch (_) {}
  try {
    const q = new URLSearchParams({
      action: "adminProducts",
      token: adminToken(),
    });
    const d = await fetch(STORE_CONFIG.apiUrl + "?" + q, {
      cache: "no-store",
    }).then((r) => r.json());
    if (d.ok) PL = d.products.filter((p) => p.status !== "NONAKTIF");
  } catch (_) {}
  render();
})();
