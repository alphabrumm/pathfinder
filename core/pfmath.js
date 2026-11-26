/* PathFinder – kleine LaTeX-Darstellung ohne Bibliothek (offline): Text mit Formeln in $…$, $$…$$, \(…\) oder \[…\]
   → sicheres HTML. Kann das, was Musterlösungen in der Schule brauchen: Brüche, Wurzeln, Hoch-/Tiefstellung, griechische
   Buchstaben, Operatoren, Pfeile, \text{…}, \vec{…}. Unbekanntes bleibt als Text stehen. */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const SYM = {
  cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', approx: '≈', neq: '≠', ne: '≠', leq: '≤', le: '≤', geq: '≥', ge: '≥', equiv: '≡', sim: '∼', propto: '∼',
  to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', iff: '⇔', implies: '⇒', uparrow: '↑', downarrow: '↓',
  infty: '∞', degree: '°', circ: '°', partial: '∂', nabla: '∇', sum: '∑', prod: '∏', int: '∫', cdots: '⋯', ldots: '…', dots: '…', perp: '⊥', parallel: '∥', angle: '∠',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ',
  nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  '%': '%', '{': '{', '}': '}', '$': '$', '&': '&amp;', '#': '#', ',': ' ', ';': ' ', ':': ' ', '!': '', quad: ' ', qquad: '  ', ' ': ' ',
  left: '', right: '', big: '', Big: '', displaystyle: '', lim: 'lim', sin: 'sin', cos: 'cos', tan: 'tan', ln: 'ln', log: 'log', exp: 'exp', max: 'max', min: 'min',
};
/** eine Formel (ohne $) → HTML */
export function tex(src) {
  let i = 0; const s = String(src);
  const group = () => { // {…} oder ein einzelnes Zeichen/Kommando
    while (s[i] === ' ') i++;
    if (s[i] === '{') { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; } const g = s.slice(i + 1, j); i = j + 1; return tex(g); }
    if (s[i] === '\\') { const m = s.slice(i).match(/^\\([A-Za-z]+|.)/); i += m[0].length; return cmd(m[1]); }
    return atom(s[i++] ?? '');
  };
  const raw = () => { while (s[i] === ' ') i++; if (s[i] !== '{') return s[i++] ?? ''; let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; } const g = s.slice(i + 1, j); i = j + 1; return g; };
  const atom = c => /[A-Za-z]/.test(c) ? `<i>${c}</i>` : c === '-' ? '−' : c === '*' ? '·' : /[=<>+]/.test(c) ? ` ${esc(c)} ` : esc(c);
  const cmd = n => {
    if (n === 'frac' || n === 'dfrac' || n === 'tfrac') { const a = group(), b = group(); return `<span class="pfm-frac"><span>${a}</span><span>${b}</span></span>`; }
    if (n === 'sqrt') { const a = group(); return `√<span class="pfm-sqrt">${a}</span>`; }
    if (n === 'text' || n === 'mathrm' || n === 'textrm' || n === 'operatorname') return `<span class="pfm-up">${esc(raw())}</span>`;
    if (n === 'mathbf' || n === 'textbf') return `<b>${group()}</b>`;
    if (n === 'vec') return `<span class="pfm-vec">${group()}</span>`;
    if (n === 'overline' || n === 'bar') return `<span class="pfm-bar">${group()}</span>`;
    if (n === 'unit' || n === 'si') return ` <span class="pfm-up">${esc(raw())}</span>`;
    return n in SYM ? SYM[n] : esc('\\' + n);
  };
  let out = '';
  while (i < s.length) {
    const c = s[i];
    if (c === '^' || c === '_') { i++; out += `<${c === '^' ? 'sup' : 'sub'}>${group()}</${c === '^' ? 'sup' : 'sub'}>`; }
    else if (c === '{' || c === '\\') out += group();
    else if (c === '}' || c === ' ' || c === '\n') i++; // Leerzeichen zählen in Formeln nicht (wie in LaTeX)
    else if (/\d/.test(c)) { const m = s.slice(i).match(/^\d+(?:[.,]\d+)?/)[0]; out += m; i += m.length; }
    else { out += atom(c); i++; }
  }
  return out;
}
/** Text mit Formeln → HTML (Zeilenumbrüche bleiben, alles andere wird maskiert) */
export function renderMath(text) {
  const t = String(text || ''); let out = '', last = 0;
  const re = /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;
  for (const m of t.matchAll(re)) {
    out += esc(t.slice(last, m.index)).replace(/\n/g, '<br>');
    const disp = m[1] != null || m[2] != null;
    out += `<span class="pfm${disp ? ' pfm-d' : ''}">${tex(m[1] ?? m[2] ?? m[3] ?? m[4])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(t.slice(last)).replace(/\n/g, '<br>');
}
/** CSS für die Formeln (einmal einbinden) */
export const MATH_CSS = `.pfm{font-family:'Cambria Math','STIX Two Math','Times New Roman',serif;font-size:1.08em;white-space:nowrap}
.pfm-d{display:block;text-align:center;margin:.4em 0}
.pfm-frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;margin:0 .15em}
.pfm-frac>span{padding:0 .2em;line-height:1.15}.pfm-frac>span+span{border-top:1px solid currentColor}
.pfm-sqrt{border-top:1px solid currentColor;padding:0 .1em}.pfm-up{font-style:normal}.pfm i{font-style:italic}
.pfm-vec{display:inline-block;position:relative}.pfm-vec::before{content:'→';position:absolute;left:0;right:0;top:-.85em;font-size:.7em;text-align:center}
.pfm-bar{text-decoration:overline}.pfm sup,.pfm sub{font-size:.72em}`;
