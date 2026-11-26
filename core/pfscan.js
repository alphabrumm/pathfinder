/* PathFinder – Handschrift fotografieren: Foto → verkleinertes Schwarz-Weiß-Bild (wie ein Scan), alles auf dem Gerät.
   Kein Netz, keine Bibliothek. Durch das Neuzeichnen im Canvas fallen Ortsdaten und Gerätedaten (EXIF) weg. */

/** Datei (Foto) → { img: data-URL, w, h, mode, kb } – mode 'bw' (Schwarz-Weiß, Standard) oder 'gray' (Graustufen, bei blasser Schrift) */
export async function scanPhoto(file, { mode = 'bw', max = 1400 } = {}) {
  const src = await loadImg(file);
  const s = Math.min(1, max / Math.max(src.width, src.height)), w = Math.max(1, Math.round(src.width * s)), h = Math.max(1, Math.round(src.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h), px = id.data, n = w * h, gray = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) gray[i] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];
  // Hintergrund (Papier, Schatten, ungleiche Beleuchtung) über ein großes Fenster schätzen – Integralbild, dann
  // Schwarz-Weiß: dunkler als 85 % der Umgebung → Strich (Verfahren nach Bradley); Graustufen: auf den Hintergrund normiert
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += gray[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
  const r = Math.max(8, Math.round(Math.max(w, h) / 24));
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), cnt = (x1 - x0) * (y1 - y0);
      const mean = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / cnt, v = gray[y * w + x], o = (y * w + x) * 4;
      let out;
      if (mode === 'gray') { out = Math.max(0, Math.min(255, 255 - (mean - v) * 2.4 * 255 / Math.max(40, mean))); if (out > 232) out = 255; }
      else out = v < mean * 0.85 && v < 200 ? 0 : 255;
      px[o] = px[o + 1] = px[o + 2] = out; px[o + 3] = 255;
    }
  }
  if (mode !== 'gray') despeckle(px, w, h);
  g.putImageData(id, 0, 0);
  const blob = await new Promise(res => c.toBlob(res, mode === 'gray' ? 'image/jpeg' : 'image/png', 0.72));
  const img = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
  return { img, w, h, mode, kb: Math.round(blob.size / 1024) };
}
/** einzelne schwarze Punkte (Papierstruktur, Rauschen) entfernen: Pixel ohne schwarze Nachbarn wird weiß */
function despeckle(px, w, h) {
  const k = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) k[i] = px[i * 4] === 0 ? 1 : 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (!k[i]) continue;
    const nb = k[i - 1] + k[i + 1] + k[i - w] + k[i + w] + k[i - w - 1] + k[i - w + 1] + k[i + w - 1] + k[i + w + 1];
    if (nb === 0) { const o = i * 4; px[o] = px[o + 1] = px[o + 2] = 255; }
  }
}
function loadImg(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); }; // Browser drehen nach der EXIF-Ausrichtung selbst
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Das Foto ließ sich nicht öffnen.')); };
    im.src = u;
  });
}

/** Zuschnitt { l, t, r, b } (Anteile 0–1) auf ein Ergebnis von scanPhoto anwenden – gleiches Format, gleiche Qualität */
export async function cropScan(res, c) {
  if (c.l <= 0.002 && c.t <= 0.002 && c.r >= 0.998 && c.b >= 0.998) return res;
  const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('Bild')); i.src = res.img; });
  const x = Math.round(c.l * im.width), y = Math.round(c.t * im.height), w = Math.max(1, Math.round((c.r - c.l) * im.width)), h = Math.max(1, Math.round((c.b - c.t) * im.height));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, x, y, w, h, 0, 0, w, h);
  const blob = await new Promise(r => cv.toBlob(r, res.mode === 'gray' ? 'image/jpeg' : 'image/png', 0.72));
  const img = await new Promise((r, j) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = j; fr.readAsDataURL(blob); });
  return { img, w, h, mode: res.mode, kb: Math.round(blob.size / 1024) };
}
