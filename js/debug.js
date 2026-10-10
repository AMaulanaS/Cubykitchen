/* Mode debug Cuby Kitchen. Aktifkan dengan menambah ?debug=1 di URL (matikan: ?debug=0). */
(function () {
  try {
    const q = new URLSearchParams(location.search).get("debug");
    if (q === "1") localStorage.setItem("cuby_debug", "1");
    if (q === "0") localStorage.removeItem("cuby_debug");
  } catch (_) {}
  const on = (() => {
    try {
      return localStorage.getItem("cuby_debug") === "1";
    } catch (_) {
      return false;
    }
  })();
  window.CUBY_STATE = window.CUBY_STATE || { products: "belum dimuat" };
  window.CUBY_LOG = [];
  const api = () =>
    (typeof STORE_CONFIG !== "undefined" && STORE_CONFIG.apiUrl) || "";
  const origFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = String(
        typeof input === "string" ? input : (input && input.url) || "",
      ),
      base = api();
    if (!base || url.indexOf(base) !== 0) return origFetch(input, init);
    const t0 = performance.now();
    let action = (url.match(/[?&]action=([^&]+)/) || [])[1] || "";
    if (!action && init && init.body) {
      try {
        action = JSON.parse(init.body).action || "";
      } catch (_) {}
    }
    const row = {
      time: new Date().toLocaleTimeString("id-ID"),
      method: (init && init.method) || "GET",
      action: action || "-",
      status: "…",
      ms: 0,
      error: "",
    };
    window.CUBY_LOG.unshift(row);
    window.CUBY_LOG.length = Math.min(window.CUBY_LOG.length, 20);
    try {
      const res = await origFetch(input, init);
      row.status = res.status;
      row.ms = Math.round(performance.now() - t0);
      const ct = res.headers.get("content-type") || "";
      if (ct.indexOf("json") < 0)
        row.error =
          "Respons bukan JSON (" +
          ct +
          ') — cek deployment Apps Script (akses harus "Anyone")';
      paint();
      return res;
    } catch (err) {
      row.status = "ERR";
      row.ms = Math.round(performance.now() - t0);
      row.error =
        String((err && err.message) || err) +
        ' — kemungkinan URL /exec salah, tidak di-deploy, atau akses bukan "Anyone"';
      paint();
      throw err;
    }
  };
  function paint() {
    if (!on) return;
    let el = document.getElementById("cubyDbg");
    if (!el) {
      el = document.createElement("div");
      el.id = "cubyDbg";
      el.style.cssText =
        "position:fixed;right:8px;bottom:8px;z-index:99999;max-width:420px;max-height:45vh;overflow:auto;background:#111;color:#e5e7eb;font:12px/1.4 monospace;padding:8px 10px;border-radius:8px;opacity:.95";
      document.body && document.body.appendChild(el);
    }
    el.innerHTML =
      "<b>DEBUG</b> · produk: " +
      window.CUBY_STATE.products +
      ' · <a style="color:#7dd3fc" href="debug.html">halaman debug</a><hr style="border:0;border-top:1px solid #444">' +
      window.CUBY_LOG.map(
        (r) =>
          '<div style="color:' +
          (r.error || r.status === "ERR" || r.status >= 400
            ? "#fca5a5"
            : "#bbf7d0") +
          '">' +
          r.time +
          " " +
          r.method +
          " " +
          r.action +
          " → " +
          r.status +
          " (" +
          r.ms +
          "ms)" +
          (r.error ? "<br>⚠ " + r.error : "") +
          "</div>",
      ).join("");
  }
  window.addEventListener("DOMContentLoaded", paint);
  window.cubyPaintDebug = paint;
  window.addEventListener("error", (e) => {
    if (on) console.error("[Cuby]", e.message, e.filename + ":" + e.lineno);
  });
  window.addEventListener("unhandledrejection", (e) => {
    if (on) console.error("[Cuby] promise ditolak:", e.reason);
  });
})();
