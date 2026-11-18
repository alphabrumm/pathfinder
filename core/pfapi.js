// Direkte KI-Nutzung über einen eigenen Claude-API-Key (Anthropic Messages API, direkt aus dem Browser).
// Der Key bleibt im Browser (localStorage oder nur für diese Sitzung) und geht nur an api.anthropic.com.

export const MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', note: 'beste Qualität, empfohlen', in: 4, out: 20 },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', note: 'günstiger', in: 2, out: 10 },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', note: 'sehr günstig', in: 0.1, out: 0.5, inHi: 0.5, outHi: 2.5 }
];
const STORE = 'pf-claude-api';
let session = null; // Key nur für diese Sitzung, wenn „merken“ aus ist

function read() { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } }
function write(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { } }

/** aktuelle Einstellungen: { key, model, remember, spent } */
export function settings() {
  const s = read();
  return { key: s.key || session || '', model: MODELS.some(m => m.id === s.model) ? s.model : MODELS[0].id, remember: s.key ? true : (s.remember ?? true), spent: +s.spent || 0 };
}
export function save({ key, model, remember }) {
  const s = read(); key = (key || '').trim();
  if (remember) { s.key = key; session = null; } else { delete s.key; session = key || null; }
  s.model = model; s.remember = !!remember; write(s);
}
export function forget() { const s = read(); delete s.key; write(s); session = null; }
export const hasKey = () => !!settings().key;
export const modelInfo = id => MODELS.find(m => m.id === id) || MODELS[0];

/** Kosten in US-Dollar für eine Antwort (usage aus der API) */
export function cost(model, u) {
  const m = modelInfo(model), cw = u.cache_creation_input_tokens || 0, cr = u.cache_read_input_tokens || 0, inTok = (u.input_tokens || 0) + cw + cr;
  const hi = m.inHi && inTok > 100000, pin = hi ? m.inHi : m.in;
  return ((u.input_tokens || 0) * pin + cw * pin * 1.25 + cr * pin * 0.1 + (u.output_tokens || 0) * (hi ? m.outHi : m.out)) / 1e6;
}
function addSpent(usd) { const s = read(); s.spent = (+s.spent || 0) + usd; write(s); }
export const usd = x => (x < 0.01 ? '< 0,01' : x.toFixed(2).replace('.', ',')) + ' $';

/** verständliche Fehlermeldung */
function explain(status, msg) {
  msg = String(msg || '');
  if (status === 401) return 'Der API-Key wurde nicht angenommen. Bitte in den Einstellungen prüfen.';
  if (/credit balance/i.test(msg)) return 'Das Guthaben in der Claude Console ist aufgebraucht. Unter „Billing“ kannst du nachladen.';
  if (status === 403) return 'Kein Zugriff mit diesem Key (' + msg + ').';
  if (status === 404 || /model/i.test(msg) && status === 400) return 'Das Modell ist für diesen Key nicht verfügbar – wähle in den Einstellungen ein anderes. (' + msg + ')';
  if (status === 429) return 'Zu viele Anfragen oder Limit erreicht – bitte kurz warten und nochmal versuchen.';
  if (status === 529 || status >= 500) return 'Claude ist gerade überlastet – bitte in ein paar Minuten nochmal versuchen.';
  return msg || ('Fehler ' + status);
}

/**
 * Anfrage mit Streaming. onText(gesamtText) wird laufend aufgerufen.
 * Ergebnis: { text, usage, stop, usd }
 */
export async function ask({ prompt, messages, system, maxTokens = 32000, onText, signal, key, model }) {
  const s = settings(); key = key || s.key; model = model || s.model;
  if (!key) throw new Error('Kein API-Key hinterlegt.');
  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model, max_tokens: maxTokens, stream: true, ...(system ? { system } : {}), messages: messages || [{ role: 'user', content: prompt }] })
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Keine Verbindung zu Claude (api.anthropic.com). Bist du online? Manche Schulnetze sperren die Adresse.');
  }
  if (!res.ok) { let m = ''; try { const j = await res.json(); m = j.error?.message || ''; } catch (e) { } throw new Error(explain(res.status, m)); }
  const rd = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', usage = {}, stop = '', last = 0;
  for (; ;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let i; while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      let ev; try { ev = JSON.parse(line.slice(5)); } catch (e) { continue; }
      if (ev.type === 'message_start') Object.assign(usage, ev.message?.usage || {});
      else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') { text += ev.delta.text; const t = Date.now(); if (onText && t - last > 120) { last = t; onText(text); } }
      else if (ev.type === 'message_delta') { Object.assign(usage, ev.usage || {}); stop = ev.delta?.stop_reason || stop; }
      else if (ev.type === 'error') throw new Error(explain(ev.error?.type === 'overloaded_error' ? 529 : 0, ev.error?.message));
    }
  }
  onText && onText(text);
  const c = cost(model, usage); addSpent(c);
  return { text, usage, stop, usd: c, model };
}

/** kurzer Test des Keys */
export async function test(key, model) {
  const r = await ask({ prompt: 'Antworte nur mit: OK', maxTokens: 10, key, model });
  return r;
}

/** XML einer Moodle-Fragensammlung aus der Antwort holen */
export function extractXml(t) {
  const m = t.match(/<\?xml[\s\S]*<\/quiz>/i) || t.match(/<quiz[\s\S]*<\/quiz>/i);
  return m ? m[0] : t;
}

/* ---------- Arbeitsmaterial (Arbeitsblätter usw.) als Inhalt für Claude ---------- */
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const IMG = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
const xmlText = x => x.replace(/<w:tab\/>/g, '\t').replace(/<\/w:p>|<w:br\/>|<\/a:p>/g, '\n').replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
/** Bild verkleinern (lange Seite höchstens max Pixel) und als JPEG – auch für Formate, die Claude nicht direkt nimmt (z. B. HEIC vom iPad) */
async function shrink(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const r = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * r), h = Math.round(im.naturalHeight * r);
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  } finally { URL.revokeObjectURL(url); }
}
/**
 * Dateien → Inhaltsblöcke für die Messages-API.
 * PDF als Dokument, Bilder als Bild (verkleinert), Word/PowerPoint/Text als Text.
 * Ergebnis: [{ name, size, ok, note, blocks }]
 */
export async function materialOf(files, unzip) {
  const out = [];
  for (const f of files) {
    const ext = (f.name.split('.').pop() || '').toLowerCase(), item = { name: f.name, size: f.size, ok: false, note: '', blocks: [] };
    try {
      if (ext === 'pdf') {
        if (f.size > 25e6) throw new Error('zu groß (höchstens 25 MB)');
        item.blocks.push({ type: 'document', title: f.name, source: { type: 'base64', media_type: 'application/pdf', data: b64(new Uint8Array(await f.arrayBuffer())) } });
        item.note = 'PDF';
      } else if (IMG[ext] || /^image\//.test(f.type) || ['heic', 'heif'].includes(ext)) {
        const data = await shrink(f).catch(() => null);
        if (!data) throw new Error('Bild ließ sich nicht lesen');
        item.blocks.push({ type: 'text', text: `Bild „${f.name}“:` }, { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
        item.note = 'Bild';
      } else if (ext === 'docx' || ext === 'pptx' || ext === 'odt' || ext === 'odp') {
        const parts = await unzip(await f.arrayBuffer()), td = new TextDecoder();
        let text = '';
        if (ext === 'docx') text = xmlText(td.decode(parts.find(p => p.name === 'word/document.xml')?.data || new Uint8Array()));
        else if (ext === 'pptx') text = parts.filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p.name)).sort((a, b) => +a.name.match(/\d+/)[0] - +b.name.match(/\d+/)[0])
          .map((p, i) => `Folie ${i + 1}:\n` + xmlText(td.decode(p.data).replace(/<\/a:t>/g, '</a:t> '))).join('\n\n');
        else text = xmlText(td.decode(parts.find(p => p.name === 'content.xml')?.data || new Uint8Array()).replace(/<\/text:(p|h)>/g, '\n'));
        if (!text.trim()) throw new Error('kein Text gefunden');
        item.blocks.push({ type: 'text', text: `Datei „${f.name}“ (Text, Bilder darin nicht enthalten):\n<<<\n${text.slice(0, 200000)}\n>>>` });
        item.note = 'Text aus ' + ext.toUpperCase();
      } else if (['txt', 'md', 'csv', 'tex', 'html', 'htm'].includes(ext)) {
        const text = new TextDecoder().decode(new Uint8Array(await f.arrayBuffer()));
        item.blocks.push({ type: 'text', text: `Datei „${f.name}“:\n<<<\n${text.slice(0, 200000)}\n>>>` });
        item.note = 'Text';
      } else throw new Error('Dateityp wird nicht unterstützt – bitte als PDF, Bild, Word, PowerPoint oder Text');
      item.ok = true;
    } catch (e) { item.note = e.message || 'ließ sich nicht lesen'; }
    out.push(item);
  }
  return out;
}
