/* DS588 Advanced Programming for Data Science — page chrome, notebook cells, in-browser Python kernel, quizzes */
(function () {
  'use strict';

  const PAGES = [
    { id: 'home', href: 'index.html', short: 'Home', title: 'Course home' },
    { id: 'l1', href: 'lecture1.html', short: 'L1', title: 'Introduction: Python & Performance' },
    { id: 'l2', href: 'lecture2.html', short: 'L2', title: 'Object-Oriented Programming' },
    { id: 'l3', href: 'lecture3.html', short: 'L3', title: 'Decorators, Metaclasses & Generators' },
    { id: 'ref', href: 'reference.html', short: 'Cheat sheet', title: 'Cheat sheet' }
  ];
  window.DS_PAGES = PAGES;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('ds588:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ds588:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };
  window.DS_STORE = store;
  const saved = store.get('theme', null);
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  const isDark = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  window.DS_ESC = esc;

  /* ---------- chrome ---------- */
  function chrome() {
    const id = document.body.dataset.page || 'home';
    const bar = document.createElement('nav');
    bar.className = 'topbar';
    bar.innerHTML = `<a class="brand" href="index.html"><span class="prompt">&gt;&gt;&gt;</span><span class="t">Advanced Programming for Data Science</span><span class="code">DS588</span></a>
      <div class="links">${PAGES.map(p => `<a href="${p.href}" class="${p.id === id ? 'active' : ''}">${p.short}</a>`).join('')}</div>
      <button class="theme-btn" type="button" aria-label="Switch light or dark theme" title="Light / dark">◐</button>`;
    document.body.prepend(bar);
    const prog = document.createElement('div'); prog.className = 'progress'; document.body.prepend(prog);
    $('.theme-btn', bar).addEventListener('click', () => { const n = isDark() ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', n); store.set('theme', n); });
    addEventListener('scroll', () => { const h = document.documentElement; prog.style.width = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100) + '%'; }, { passive: true });

    const i = PAGES.findIndex(p => p.id === id), nav = $('#lec-nav');
    if (nav && i > 0) {
      const prev = PAGES[i - 1], next = PAGES[i + 1];
      nav.className = 'lec-nav';
      nav.innerHTML = (prev ? `<a href="${prev.href}"><span>← previous</span>${prev.title}</a>` : '') + (next ? `<a class="next" href="${next.href}"><span>next →</span>${next.title}</a>` : '');
    }
    const f = document.createElement('footer'); f.className = 'site';
    f.innerHTML = 'DS588 · Advanced Programming for Data Science — interactive study notes built from the lecture slides and notebooks.<br>Static outputs come from running the lecture notebooks in Python; every cell can also be re-run live in your browser.';
    document.body.appendChild(f);
    const v = store.get('visited', {}); v[id] = true; store.set('visited', v);
  }

  function toc() {
    const t = $('.toc'); if (!t) return;
    const secs = $$('.content > .section[id]');
    t.innerHTML = '<h4>on this page</h4>' + secs.map((s, k) => { const n = $('.sec-num', s); return `<a href="#${s.id}" data-id="${s.id}"><span class="n">${n ? n.textContent : k + 1}</span><span>${$('h2', s).textContent}</span></a>`; }).join('');
    const links = $$('a', t);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.dataset.id === e.target.id)); }), { rootMargin: '-20% 0px -70% 0px' });
    secs.forEach(s => io.observe(s));
  }

  /* ---------- Python highlighting ---------- */
  const KW = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
  const BI = new Set('print len range type isinstance hasattr getattr setattr super object int str float list dict set tuple sum min max sorted enumerate zip map filter next iter open repr id dir vars property staticmethod classmethod abs round any all bool'.split(' '));
  function hl(src) {
    let o = '', i = 0; const n = src.length; let prevWord = '';
    while (i < n) {
      const c = src[i];
      if (c === '#') { let j = src.indexOf('\n', i); if (j < 0) j = n; o += `<span class="c">${esc(src.slice(i, j))}</span>`; i = j; continue; }
      const sm = /^([rRbBfF]{0,2})("""|'''|"|')/.exec(src.slice(i, i + 5));
      if (sm && (sm[1] === '' || /[A-Za-z]/.test(sm[1]))) {
        const q = sm[2], st = i; let j = i + sm[0].length;
        while (j < n && !src.startsWith(q, j)) { if (src[j] === '\\') j++; if (q.length === 1 && src[j] === '\n') break; j++; }
        j = Math.min(n, j + q.length);
        o += `<span class="s">${esc(src.slice(st, j))}</span>`; i = j; prevWord = ''; continue;
      }
      if (c === '@' && (i === 0 || src[i - 1] === '\n' || /\s/.test(src[i - 1]))) { const m = /^@[\w.]+/.exec(src.slice(i)); if (m) { o += `<span class="d">${esc(m[0])}</span>`; i += m[0].length; continue; } }
      if (/[0-9]/.test(c) && !/[\w]/.test(src[i - 1] || '')) { const m = /^[0-9][0-9_]*\.?[0-9_]*(e[+-]?\d+)?j?/i.exec(src.slice(i)); o += `<span class="n">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if (/[A-Za-z_]/.test(c)) {
        const w = /^[A-Za-z_]\w*/.exec(src.slice(i))[0];
        let cls = '';
        if (KW.has(w)) cls = 'k';
        else if (prevWord === 'def' || prevWord === 'class') cls = 'f';
        else if (w === 'self' || w === 'cls') cls = 'sf';
        else if (BI.has(w) && src[i + w.length] === '(') cls = 'b';
        else if (/^__\w+__$/.test(w)) cls = 'b';
        o += cls ? `<span class="${cls}">${w}</span>` : w;
        prevWord = w; i += w.length; continue;
      }
      if (!/\s/.test(c)) prevWord = '';
      o += esc(c); i++;
    }
    return o;
  }
  window.DS_HL = hl;

  /* ---------- in-browser Python kernel (Pyodide) ---------- */
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  const BOOT = `
import ast, io, sys, contextlib, traceback
_ns = {"__name__": "__main__"}
def _show(v):
    if isinstance(v, type):
        m = v.__module__
        return v.__qualname__ if m == "builtins" else f"{m}.{v.__qualname__}"
    return repr(v)
def _run_cell(src):
    out = io.StringIO()
    shown, err = None, None
    try:
        tree = ast.parse(src, "<cell>", "exec")
        last = None
        if tree.body and isinstance(tree.body[-1], ast.Expr):
            last = ast.Expression(tree.body.pop().value)
        with contextlib.redirect_stdout(out):
            exec(compile(tree, "<cell>", "exec"), _ns)
            if last is not None:
                val = eval(compile(last, "<cell>", "eval"), _ns)
                if val is not None:
                    shown = _show(val)
    except SyntaxError as e:
        err = f"SyntaxError: {e.msg} (line {e.lineno})"
    except BaseException as e:
        err = f"{type(e).__name__}: {e}"
    return out.getvalue(), shown, err
def _reset():
    _ns.clear(); _ns["__name__"] = "__main__"
`;
  const Kernel = {
    py: null, loading: null, count: 0, queue: Promise.resolve(), pill: null,
    status(s, msg) {
      if (!this.pill) return;
      $('.dot', this.pill).className = 'dot ' + s;
      $('.lbl', this.pill).textContent = msg;
    },
    build() {
      const p = document.createElement('div'); p.className = 'kernel';
      p.innerHTML = '<span class="dot"></span><span class="lbl">Python: not started</span><button type="button" title="Clear all variables, like Jupyter\'s Restart kernel">restart</button>';
      document.body.appendChild(p); this.pill = p;
      $('button', p).addEventListener('click', () => this.restart());
    },
    async ensure() {
      if (this.loading) return this.loading;
      this.loading = (async () => {
        this.status('busy', 'Python: loading (first time ~10 MB)…');
        if (!window.loadPyodide) await new Promise((res, rej) => { const s = document.createElement('script'); s.src = PYODIDE + 'pyodide.js'; s.onload = res; s.onerror = () => rej(new Error('could not download Python (check your internet connection)')); document.head.appendChild(s); });
        this.py = await window.loadPyodide({ indexURL: PYODIDE });
        this.py.runPython(BOOT);
        this.status('idle', 'Python 3.12: ready');
      })().catch(e => { this.loading = null; this.status('err', 'Python: failed to load'); throw e; });
      return this.loading;
    },
    run(src) {
      const job = this.queue.then(async () => {
        await this.ensure();
        this.status('busy', 'Python: running…');
        if (/^\s*(import|from)\s+(numpy|pandas|matplotlib|scipy)/m.test(src)) {
          this.status('busy', 'Python: downloading packages…');
          await this.py.loadPackagesFromImports(src);
        }
        const r = this.py.globals.get('_run_cell')(src);
        const [out, shown, err] = r.toJs(); r.destroy();
        this.status('idle', 'Python 3.12: ready');
        return { out, shown, err, n: ++this.count };
      });
      this.queue = job.catch(() => {});
      return job;
    },
    async restart() {
      if (!this.py) return;
      this.py.runPython('_reset()'); this.count = 0;
      $$('.cell').forEach(c => { const g = $('.gut', c); if (g) g.textContent = 'In [ ]:'; });
      this.status('idle', 'Python 3.12: restarted');
    }
  };
  window.DS_KERNEL = Kernel;

  /* ---------- notebook cells ---------- */
  function cells() {
    const all = $$('.cell');
    all.forEach((cell, idx) => {
      const pre = $('pre.py', cell);
      const src = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
      const o = $('pre.o', cell);
      const outTxt = o ? o.textContent.replace(/^\n/, '').replace(/\s+$/, '') : null;
      const outKind = o ? (o.classList.contains('err') ? 'err' : (o.dataset.out === 'expr' ? 'expr' : 'print')) : null;
      cell.dataset.src = src;
      cell.innerHTML = `<div class="gut">In [ ]:</div><div class="box"><div class="bar"><span class="clab">${esc(cell.dataset.label || '')}</span>
        <button class="cbtn" data-a="edit" type="button" title="Edit the code">✎ edit</button>
        <button class="cbtn" data-a="above" type="button" title="Run every cell above this one, then this one">⏫ run all above</button>
        <button class="cbtn run" data-a="run" type="button" title="Run this cell (real Python)">▶ run</button></div>
        <pre>${hl(src)}</pre></div><div class="out"></div>`;
      const outEl = $('.out', cell);
      const show = (txt, kind, n, live) => {
        if (txt === null || txt === '') { outEl.innerHTML = ''; return; }
        const g = kind === 'expr' ? `Out[${n}]:` : '';
        outEl.innerHTML = `<div class="gut">${g}</div><pre class="${kind === 'err' ? 'err' : ''}">${esc(txt)}${live ? '<span class="live">● live</span>' : ''}</pre>`;
      };
      if (outTxt !== null) show(outTxt, outKind, idx + 1, false);
      const gut = $('.gut', cell);
      const runIt = async () => {
        const code = cell.classList.contains('editing') ? $('textarea', cell).value : cell.dataset.src;
        gut.textContent = 'In [*]:';
        try {
          const r = await Kernel.run(code);
          gut.textContent = `In [${r.n}]:`;
          let txt = r.out.replace(/\s+$/, ''), kind = 'print';
          if (r.err) { txt = (txt ? txt + '\n' : '') + r.err; kind = 'err'; if (/NameError/.test(r.err)) txt += '\n\n(Tip: this cell uses something defined above — press "⏫ run all above".)'; }
          else if (r.shown !== undefined && r.shown !== null) { if (txt) { outEl.innerHTML = ''; txt += '\n' + r.shown; } else { kind = 'expr'; txt = r.shown; } }
          show(txt, kind, r.n, true);
        } catch (e) { gut.textContent = 'In [ ]:'; show('Could not start Python in the browser: ' + e.message, 'err', 0, false); }
      };
      cell._run = runIt;
      $('[data-a="run"]', cell).addEventListener('click', runIt);
      $('[data-a="above"]', cell).addEventListener('click', async () => { for (const c of all.slice(0, idx + 1)) await c._run(); });
      $('[data-a="edit"]', cell).addEventListener('click', e => {
        const box = $('.box', cell);
        if (cell.classList.toggle('editing')) {
          const ta = document.createElement('textarea'); ta.spellcheck = false; ta.value = cell.dataset.src;
          ta.rows = Math.min(30, ta.value.split('\n').length + 1);
          ta.addEventListener('keydown', ev => {
            if (ev.key === 'Enter' && (ev.shiftKey || ev.ctrlKey)) { ev.preventDefault(); runIt(); }
            if (ev.key === 'Tab') { ev.preventDefault(); ta.setRangeText('    ', ta.selectionStart, ta.selectionEnd, 'end'); }
          });
          $('pre', box).replaceWith(ta); ta.focus(); e.target.textContent = '✓ done';
        } else {
          const ta = $('textarea', box); cell.dataset.src = ta.value;
          const p = document.createElement('pre'); p.innerHTML = hl(ta.value); ta.replaceWith(p); e.target.textContent = '✎ edit';
        }
      });
    });
    if (all.length) Kernel.build();
  }

  /* ---------- quizzes ---------- */
  function quizzes() {
    $$('.quiz').forEach(qz => {
      const id = qz.dataset.id, qs = $$('.q', qz), sc = $('.quiz-score', qz);
      let done = 0, right = 0;
      const upd = () => { sc.textContent = done ? `${right} / ${qs.length}` : `${qs.length} questions`; if (done === qs.length) { const b = store.get('quiz', {}); b[id] = { right, total: qs.length }; store.set('quiz', b); } };
      qs.forEach(q => {
        const a = +q.dataset.a, opts = $$('.q-opt', q), fb = $('.q-fb', q), why = fb ? fb.innerHTML : '';
        opts.forEach((b, i) => b.addEventListener('click', () => {
          opts.forEach(x => (x.disabled = true)); opts[a].classList.add('right'); if (i !== a) b.classList.add('wrong');
          done++; if (i === a) right++;
          if (fb) { fb.innerHTML = (i === a ? '<b class="ok">Correct.</b> ' : '<b class="no">Not quite.</b> ') + why; fb.classList.add('show'); }
          upd();
        }));
      });
      const r = $('.quiz-reset', qz);
      if (r) r.addEventListener('click', () => { done = right = 0; qs.forEach(q => { $$('.q-opt', q).forEach(b => { b.disabled = false; b.classList.remove('right', 'wrong'); }); const f = $('.q-fb', q); if (f) f.classList.remove('show'); }); upd(); });
      upd();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    chrome(); toc(); cells(); quizzes();
    $$('pre.hl-py').forEach(p => { p.innerHTML = hl(p.textContent.replace(/^\n/, '').replace(/\s+$/, '')); });
    document.dispatchEvent(new Event('ds:ready'));
  });
})();
