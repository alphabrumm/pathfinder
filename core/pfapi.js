// Direkte KI-Nutzung über einen eigenen Claude-API-Key (Anthropic Messages API, direkt aus dem Browser).
// Der Key bleibt im Browser (localStorage oder nur für diese Sitzung) und geht nur an api.anthropic.com.

export const MODELS = [
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', note: 'empfohlen', in: 2, out: 10 },
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', note: 'beste Qualität', in: 4, out: 20 },
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
  const m = modelInfo(model), inTok = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  const hi = m.inHi && inTok > 100000;
  return (inTok * (hi ? m.inHi : m.in) + (u.output_tokens || 0) * (hi ? m.outHi : m.out)) / 1e6;
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
