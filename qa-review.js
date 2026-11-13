(() => {
  'use strict';

  const VERSION = '3.0.0';
  const SCRIPT_URL = 'https://honest-family.github.io/qa-review-kit/qa-review.js';
  const me = document.currentScript;
  const boot = (me && me.dataset && me.dataset.boot) || '';

  if (window.qaReview && window.qaReview.version) {
    if (boot === 'resume' && window.qaReview.resume) {
      if (/[#?&]qa(-review)?=/.test(`${location.hash}&${location.search}`) && window.qaReview.fromHash) window.qaReview.fromHash();
      else window.qaReview.resume();
    }
    return;
  }

  const attempt = (fn, fallback) => {
    try {
      return fn();
    } catch (e) {
      return fallback;
    }
  };

  if (attempt(() => window.top !== window && Boolean(window.top.qaReview && window.top.qaReview.isShell && window.top.qaReview.isShell()), false)) {
    window.qaReview = { version: VERSION, inner: true };
    return;
  }

  const KEY = 'qa-review:';
  const LAST = 'qa-review-last';
  const NAME = 'qa-review-name';
  const ON = 'qa-review-on';
  const TIP = 'qa-review-tip2';
  const HASH = 'qa-review=';
  const PARAM = 'qa';
  const ITEM_PARAM = 'qa-item';
  const SIDE = 412;
  const SPLIT_MIN = 1280;
  // 3.0.0 (2026-11-13) — 박스 하나에 고객 요청 하나씩. 위·아래 두 카드, ①확인 ②AI 수정 ③고객 링크 단계 표시, '새 창에서 이어서 검수'를 없앴다.
  // 요청마다 [맞아요] 아니면 [고칠 게 있어요] 하나만 누르면 되고, 다른 주소(운영↔개발기) 확인은 같은 창이 옮겨 간다.
  const STATUS = { todo: '확인 전', needs: '고칠 것', done: '확인 완료' };
  const SAID = {
    waiting: '대시보드에 접수됐어요. 곧 고치기 시작해요',
    running: 'AI가 고치는 중이에요',
    question: 'AI가 물어볼 게 있어요. 대시보드 이슈를 봐 주세요',
    done: 'AI가 일을 끝냈어요',
    failed: 'AI 작업이 멈췄어요. 대시보드 이슈를 봐 주세요',
    blocked: 'AI가 착수하지 못했어요. 대시보드 이슈를 봐 주세요',
  };
  const STATE_PARAM = 'qa-st';
  const EXTRA = '__extra';
  const END = '__end';
  // 2.1.0 (2026-11-13) — 검수판을 대시보드에 붙였다: 체크 저장 · [AI에게 넘기기]가 이슈 추가요청으로 바로 등록 · 모두 검수완료면 고객 링크
  const SEND = '__send';
  const DEFAULT_API = 'https://api.dashboard.honest-family.com/api';
  const ACTIVE = { waiting: 1, running: 1, question: 1 };
  const KIND = {
    a: '링크', button: '버튼', input: '입력칸', textarea: '입력칸', select: '선택칸', label: '글자', summary: '펼침 단추',
    img: '그림', svg: '그림', canvas: '그림', video: '영상', h1: '제목', h2: '제목', h3: '제목', h4: '제목', h5: '제목', h6: '제목',
    p: '글', li: '글', td: '표 칸', th: '표 칸', dt: '글', dd: '글', span: '글자', strong: '글자', b: '글자', em: '글자',
  };
  const CLICKABLE = 'a,button,[role="button"],label,summary';
  const MEANINGFUL = 'input,select,textarea,img,video,svg,canvas,h1,h2,h3,h4,h5,h6,p,li,td,th,dt,dd,figure,blockquote';
  const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1 };
  const STOP_EVENTS = ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress', 'input', 'focusin', 'focusout', 'contextmenu'];
  const ICON = {
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/></svg>',
    reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    split: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M14.5 4v16"/></svg>',
  };

  const local = {
    get: (key) => attempt(() => JSON.parse(localStorage.getItem(key)), null),
    set: (key, value) => attempt(() => {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }, false),
    text: (key) => attempt(() => localStorage.getItem(key) || '', ''),
    put: (key, value) => attempt(() => (value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value)), null),
  };
  const session = {
    text: (key) => attempt(() => sessionStorage.getItem(key) || '', ''),
    put: (key, value) => attempt(() => (value == null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, value)), null),
  };

  const toList = (value) => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = (time) => {
    const d = new Date(time);
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const when = (time) => {
    const sec = (Date.now() - time) / 1000;
    if (sec < 60) return '방금';
    if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
    return stamp(time);
  };
  const esc = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const absUrl = (url, base) => attempt(() => new URL(url, base || location.href).href, '');
  const sameOrigin = (url) => attempt(() => new URL(url, location.href).origin === location.origin, false);
  const pageKey = (url) => attempt(() => {
    const u = new URL(url, location.href);
    return u.origin + (u.pathname.replace(/\/+$/, '') || '/') + u.search;
  }, String(url || ''));
  const shortUrl = (url) => attempt(() => {
    const u = new URL(url, location.href);
    const rest = u.pathname + u.search + u.hash;
    if (rest === '/' || rest === '') return u.host;
    return u.origin === location.origin ? rest : u.host + rest;
  }, String(url || ''));
  const link = (url, mono) => `<a class="ln${mono ? ' mono' : ''}" href="${esc(url)}" data-href="${esc(url)}" title="${esc(url)}">${esc(shortUrl(url))}</a>`;
  const URLS = /(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]])/g;
  const linkify = (value) => String(value == null ? '' : value).split(URLS).map((part, i) => (i % 2 ? link(part, false) : esc(part))).join('');
  const INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\[([^\]\n]{1,60})\](?!\()|'([^'\n]{1,160}?)'|(https?:\/\/[^\s<>"'`]+[^\s<>"'`.,;:!?)\]])/g;
  const inline = (value) => {
    const s = String(value == null ? '' : value);
    const re = new RegExp(INLINE.source, 'g');
    let out = '';
    let last = 0;
    let m = re.exec(s);
    while (m) {
      out += esc(s.slice(last, m.index));
      if (m[1] != null) out += /^https?:\/\//.test(m[1]) ? link(m[1], true) : `<code>${esc(m[1])}</code>`;
      else if (m[2] != null) out += `<strong>${esc(m[2])}</strong>`;
      else if (m[3] != null) out += `<span class="kb">${esc(m[3])}</span>`;
      else if (m[4] != null) out += `<span class="q">'${esc(m[4])}'</span>`;
      else out += link(m[5], false);
      last = re.lastIndex;
      m = re.exec(s);
    }
    return out + esc(s.slice(last));
  };
  const oneLine = (value) => String(value == null ? '' : value).replace(/\s*\n\s*/g, ' / ').trim();

  const viewOf = (el) => el.ownerDocument.defaultView;
  const styleOf = (el) => viewOf(el).getComputedStyle(el);
  const isTransformed = (st) => ['transform', 'translate', 'scale', 'rotate', 'filter', 'perspective'].some((p) => st[p] && st[p] !== 'none');
  const clippers = (el) => {
    const found = [];
    const body = el.ownerDocument.body;
    let position = styleOf(el).position;
    for (let parent = el.parentElement; parent && parent !== body; parent = parent.parentElement) {
      const st = styleOf(parent);
      const containing = position === 'fixed' ? isTransformed(st) : position !== 'absolute' || st.position !== 'static' || isTransformed(st);
      if (!containing) continue;
      if ((st.overflowX !== 'visible' || st.overflowY !== 'visible') && st.display !== 'inline' && st.display !== 'contents') found.push({ parent, st });
      position = st.position;
    }
    return found;
  };
  const intersect = (a, b) => {
    const r = { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
    return r.left < r.right && r.top < r.bottom ? r : null;
  };
  const clipBox = (el) => clippers(el).reduce((clip, { parent, st }) => {
    const box = parent.getBoundingClientRect();
    const left = box.left + parent.clientLeft;
    const top = box.top + parent.clientTop;
    return {
      left: st.overflowX === 'visible' ? clip.left : Math.max(clip.left, left),
      right: st.overflowX === 'visible' ? clip.right : Math.min(clip.right, left + parent.clientWidth),
      top: st.overflowY === 'visible' ? clip.top : Math.max(clip.top, top),
      bottom: st.overflowY === 'visible' ? clip.bottom : Math.min(clip.bottom, top + parent.clientHeight),
    };
  }, { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity });
  const hiddenByClip = (el, rect) => {
    const list = clippers(el);
    for (let i = 0; i < list.length; i += 1) {
      const { parent, st } = list[i];
      if (['auto', 'scroll'].includes(st.overflowY) || ['auto', 'scroll'].includes(st.overflowX)) return false;
      if ((['hidden', 'clip'].includes(st.overflowX) || ['hidden', 'clip'].includes(st.overflowY)) && !intersect(rect, parent.getBoundingClientRect())) return true;
    }
    return false;
  };
  const isShown = (el) => {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    return !hiddenByClip(el, rect);
  };
  const squash = (value) => String(value == null ? '' : value).replace(/\s+/g, '');
  const textOf = (el) => (el.innerText != null ? el.innerText : el.textContent) || '';
  const labelOf = (el) => [textOf(el), el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('title'), el.getAttribute('alt'), el.tagName === 'INPUT' || el.tagName === 'BUTTON' ? el.value : '']
    .filter(Boolean).join(' ');
  const findMark = (doc, mark, ctx) => {
    if (!doc || !doc.body || !mark) return { el: null, matches: 0 };
    const nth = Number(mark.nth) || 0;
    const want = squash(mark.text);
    if (mark.selector) {
      let list = attempt(() => Array.from(doc.querySelectorAll(mark.selector)), null);
      if (!list) return { el: null, matches: 0, invalid: true };
      if (want) list = list.filter((el) => squash(labelOf(el)).includes(want));
      const shown = list.filter(isShown);
      return { el: shown[nth] || null, matches: shown.length };
    }
    if (!want) return { el: null, matches: 0 };
    const memo = ctx || {};
    if (memo.text == null) memo.text = squash(doc.body.textContent);
    const inText = memo.text.includes(want);
    const candidates = inText ? Array.from(doc.body.querySelectorAll('*')).filter((el) => !SKIP[el.tagName] && squash(el.textContent).includes(want)) : [];
    let shown = candidates.filter((el, i) => !(candidates[i + 1] && el.contains(candidates[i + 1])) && squash(textOf(el)).includes(want) && isShown(el));
    if (!shown.length) {
      shown = Array.from(doc.body.querySelectorAll('input,textarea,select,img,[aria-label],[placeholder],[title]'))
        .filter((el) => squash([el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('title'), el.getAttribute('alt')].join(' ')).includes(want) && isShown(el));
    }
    return { el: shown[nth] || null, matches: shown.length };
  };
  const BOXY = { INPUT: 1, TEXTAREA: 1, SELECT: 1, BUTTON: 1, IMG: 1, SVG: 1, VIDEO: 1, CANVAS: 1, IFRAME: 1, SUMMARY: 1, PROGRESS: 1 };
  const contentRect = (el) => {
    const r = el.getBoundingClientRect();
    if (BOXY[el.tagName.toUpperCase()] || el.getAttribute('role') === 'button' || !el.firstChild) return r;
    if (String(attempt(() => styleOf(el).display, '')).startsWith('inline')) return r;
    const range = attempt(() => {
      const x = el.ownerDocument.createRange();
      x.selectNodeContents(el);
      return x;
    }, null);
    const c = range ? range.getBoundingClientRect() : null;
    if (!c || c.width < 2 || c.height < 2 || (c.width > r.width - 10 && c.height > r.height - 10)) return r;
    const inner = intersect(c, r);
    return inner ? Object.assign(inner, { width: inner.right - inner.left, height: inner.bottom - inner.top }) : r;
  };
  const textAt = (doc, x, y) => {
    let node = null;
    if (doc.caretRangeFromPoint) {
      const range = attempt(() => doc.caretRangeFromPoint(x, y), null);
      node = range && range.startContainer;
    } else if (doc.caretPositionFromPoint) {
      const pos = attempt(() => doc.caretPositionFromPoint(x, y), null);
      node = pos && pos.offsetNode;
    }
    if (!node || node.nodeType !== 3 || !node.textContent.trim()) return false;
    const r = doc.createRange();
    r.selectNodeContents(node);
    return Array.from(r.getClientRects()).some((c) => x >= c.left && x <= c.right && y >= c.top && y <= c.bottom);
  };
  const selectorFor = (el) => {
    const doc = el.ownerDocument;
    const unique = (node) => node.id && attempt(() => doc.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1, false);
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== doc.body && node !== doc.documentElement && parts.length < 8) {
      if (unique(node)) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        return parts.join(' > ');
      }
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    if (node === doc.body) parts.unshift('body');
    return parts.join(' > ');
  };

  const fromBase64Url = (s) => {
    const t = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  };
  const toBase64Url = (bytes) => {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const SPEC_BASE = attempt(() => new URL('specs/', (me && me.src) || SCRIPT_URL).href, 'https://honest-family.github.io/qa-review-kit/specs/');
  const fetchSealed = async (name, key) => {
    if (!/^[a-z0-9-]{3,80}$/.test(name)) throw new Error('bad name');
    const res = await fetch(`${SPEC_BASE}${name}.bin`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`spec ${res.status}`);
    const blob = new Uint8Array(await res.arrayBuffer());
    const cryptoKey = await crypto.subtle.importKey('raw', fromBase64Url(key), 'AES-GCM', false, ['decrypt']);
    const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.slice(0, 12) }, cryptoKey, blob.slice(12)));
    return through(plain, new DecompressionStream('deflate-raw'));
  };
  const decodeSpec = async (payload) => {
    const dot = payload.indexOf('.');
    const kind = payload.slice(0, dot);
    const rest = payload.slice(dot + 1);
    let raw;
    if (kind === '2') {
      const cut = rest.lastIndexOf('.');
      raw = await fetchSealed(rest.slice(0, cut), rest.slice(cut + 1));
    } else {
      const bytes = fromBase64Url(rest);
      raw = kind === '0' ? bytes : await through(bytes, new DecompressionStream('deflate-raw'));
    }
    return JSON.parse(new TextDecoder().decode(raw));
  };
  const encodeSpec = async (spec) => {
    const bytes = new TextEncoder().encode(JSON.stringify(spec));
    if (typeof CompressionStream === 'undefined') return `0.${toBase64Url(bytes)}`;
    return `1.${toBase64Url(await through(bytes, new CompressionStream('deflate-raw')))}`;
  };

  const hashStr = (value) => {
    const s = String(value == null ? '' : value);
    let h = 5381;
    for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  };
  const originOf = (url) => attempt(() => new URL(url, location.href).origin, '');
  const hostOf = (url) => attempt(() => new URL(url, location.href).host, '');
  const isDevHost = (host) => /(^|[.-])(dev|stg|staging|test|qa)([.-]|$)/i.test(host) || /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  // 다른 주소 화면을 부르는 이름 — 운영에서 보면 개발기, 개발기에서 보면 운영, 그 밖엔 주소 그대로
  const placeName = (url) => {
    const host = hostOf(url);
    if (!host) return '다른';
    if (isDevHost(host) && !isDevHost(location.host)) return '개발기';
    if (!isDevHost(host) && isDevHost(location.host)) return '운영';
    return host;
  };
  const normalizeLog = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const seen = {};
    const entries = toList(raw.entries)
      .map((e) => (typeof e === 'string' ? { title: e } : Object.assign({}, e)))
      .map((e) => ({
        id: String(e.id || '').replace(/[^\w-]/g, '').slice(0, 40),
        title: String(e.title || '').trim(),
        lines: toList(e.lines).map(String).filter((x) => x.trim()),
        links: toList(e.links).filter((l) => l && /^https?:\/\//i.test(String(l.url || ''))).map((l) => ({ url: String(l.url), label: String(l.label || '바로가기') })),
        items: toList(e.items).map(String),
        revision: Number(e.revision) || 1,
        reply: String(e.reply || ''),
      }))
      .filter((e) => e.title)
      .map((e) => {
        // 요청 한 장의 이름 — AI가 붙인 id, 없으면 요청 글로 만든다(같은 글이면 회차가 바뀌어도 같은 장)
        let id = e.id || `t-${hashStr(e.title)}`;
        seen[id] = (seen[id] || 0) + 1;
        if (seen[id] > 1) id += `-${seen[id]}`;
        return Object.assign(e, { id });
      });
    if (!entries.length) return null;
    return {
      product: String(raw.product || ''),
      title: String(raw.title || '업데이트 일지'),
      version: String(raw.version || ''),
      date: String(raw.date || ''),
      entries,
      remain: toList(raw.remain).map(String).filter((x) => x.trim()),
      revision: Number(raw.revision) || 1,
      reply: String(raw.reply || ''),
    };
  };
  // 3.0.0 — 검수 단위는 '고객 요청'이다. 업데이트 일지의 요청(log.entries) 하나가 박스 한 장이고,
  // 그 요청에 묶인 검수항목(entries[].items)이 그 장의 '이렇게 확인하세요'가 된다. 못 한 요청(log.remain)도 한 장씩,
  // 어디에도 묶이지 않은 검수항목은 '그 밖에 확인할 것' 한 장에 모은다. 일지가 없는 옛 검수판은 검수항목 하나가 한 장이다.
  // 맨 끝 장은 고객에게 보낼 글(일지가 없으면 마무리)이다.
  const buildUnits = (spec) => {
    const byId = new Map(spec.items.map((it) => [it.id, it]));
    const used = new Set();
    const units = [];
    const unit = (o) => Object.assign({ lines: [], links: [], checks: [], rev: 1, reply: '', sig: '' }, o);
    // 장의 회차 — 요청 회차에 묶인 검수항목들이 오른 만큼 더한다(어느 하나라도 오르면 장도 오른다)
    const revOf = (base, checks) => base + checks.reduce((n, it) => n + Math.max(0, it.revision - 1), 0);
    if (spec.log) {
      spec.log.entries.forEach((e) => {
        const checks = e.items.map((id) => byId.get(id)).filter((it) => it && it.kind !== 'send' && !used.has(it.id));
        checks.forEach((it) => used.add(it.id));
        units.push(unit({
          id: e.id, key: `u:${e.id}`, kind: 'req', title: e.title, lines: e.lines, links: e.links, checks,
          rev: revOf(e.revision, checks), reply: e.reply, sig: hashStr(JSON.stringify([e.title, e.lines])),
        }));
      });
      const rest = spec.items.filter((it) => it.kind !== 'send' && !used.has(it.id));
      if (rest.length) units.push(unit({ id: EXTRA, key: `u:${EXTRA}`, kind: 'extra', title: '그 밖에 확인할 것', checks: rest, rev: revOf(1, rest) }));
      const seen = {};
      spec.log.remain.forEach((text) => {
        let id = `m-${hashStr(text)}`;
        seen[id] = (seen[id] || 0) + 1;
        if (seen[id] > 1) id += `-${seen[id]}`;
        units.push(unit({ id, key: `u:${id}`, kind: 'remain', title: text }));
      });
    } else {
      spec.items.forEach((it) => {
        if (it.kind !== 'send') units.push(unit({ id: `i-${it.id}`, key: it.id, kind: 'check', title: it.title, checks: [it], rev: it.revision, reply: String(it.reply || '') }));
      });
    }
    const send = spec.items.find((it) => it.kind === 'send');
    if (send) {
      const text = spec.log ? [spec.log.entries.map((e) => [e.title, e.lines]), spec.log.remain] : [];
      units.push(unit({ id: SEND, key: SEND, kind: 'send', title: '고객에게 보낼 글', rev: send.revision, reply: String(send.reply || ''), sig: hashStr(JSON.stringify([spec.message, text])) }));
    } else {
      units.push(unit({ id: END, key: END, kind: 'end', title: '마무리' }));
    }
    // 한 장 안의 확인은 앞 장이 끝난 주소의 것부터 — 운영·개발기를 오가는 횟수를 줄인다(같은 주소끼리는 적힌 순서 그대로).
    // 검수판만으로 정해지니 어느 주소에서 열어도 순서가 같다.
    let at = originOf(spec.site);
    units.forEach((u) => {
      if (u.checks.length > 1) {
        const stay = (it) => !it.url || it.outside || originOf(it.url) === at;
        u.checks = u.checks.filter(stay).concat(u.checks.filter((it) => !stay(it)));
      }
      const last = u.checks.slice().reverse().find((it) => it.url && !it.outside);
      if (last) at = originOf(last.url);
    });
    return units;
  };
  const normalize = (raw) => {
    const spec = Object.assign({}, raw);
    spec.id = String(spec.id || 'review');
    spec.round = Number(spec.round) || 1;
    spec.title = String(spec.title || '검수');
    spec.site = absUrl(spec.site || location.origin) || location.origin;
    spec.original = toList(spec.original).map((o, i) => (typeof o === 'string' ? { no: String(i + 1), text: o } : Object.assign({ no: String(i + 1) }, o)));
    spec.actions = toList(spec.actions).map((a) => (typeof a === 'string' ? { items: [a] } : Object.assign({}, a, { items: toList(a.items), refs: toList(a.refs) })));
    spec.prep = toList(spec.prep);
    spec.offscreen = toList(spec.offscreen);
    spec.regression = toList(spec.regression);
    spec.hide = toList(spec.hide);
    spec.message = String(spec.message || '').trim();
    spec.board = spec.board && spec.board.key ? { key: String(spec.board.key), api: String(spec.board.api || DEFAULT_API).replace(/\/+$/, '') } : null;
    spec.log = normalizeLog(spec.log);
    spec.items = toList(spec.items).map((item, i) => {
      const steps = toList(item.steps).map((step) => {
        const s = typeof step === 'string' ? { text: step } : Object.assign({}, step);
        s.marks = toList(s.mark || s.marks).map((m) => (typeof m === 'string' ? { text: m } : Object.assign({}, m)));
        return s;
      });
      return Object.assign({}, item, {
        id: String(item.id || `item-${i + 1}`),
        no: String(item.no || i + 1),
        title: String(item.title || `항목 ${i + 1}`),
        url: item.url ? absUrl(item.url, spec.site) : '',
        steps,
        revision: Number(item.revision) || 1,
      });
    });
    if (spec.log && !spec.items.some((it) => it.kind === 'send')) {
      // 고객에게 보낼 글(업데이트 일지·보낼 말)도 마지막에 확인받는다 — 여기 남긴 말이 오면 AI가 글을 고친다
      spec.items.push({
        id: SEND, no: String(spec.items.length + 1), kind: 'send', title: '고객에게 보낼 업데이트 일지·메시지',
        url: '', steps: [], revision: Number(spec.log.revision) || 1, reply: spec.log.reply || '',
      });
    }
    spec.units = buildUnits(spec);
    return spec;
  };
  const merge = (spec, old) => {
    const prev = (old && old.items) || {};
    const state = {
      cur: (old && old.cur) || '',
      chk: Math.max(0, Number(old && old.chk) || 0),
      fold: Boolean(old && old.fold === true),
      view: (old && old.view) || 'pc',
      lastUrl: (old && old.lastUrl) || '',
      items: {},
    };
    const note = (id, text) => ({ id, sys: true, by: 'AI', at: Date.now(), round: spec.round, text });
    const again = `${spec.round}회차에 고쳤어요. 다시 확인해 주세요`;
    spec.items.forEach((item) => {
      const p = prev[item.id];
      if (!p) {
        state.items[item.id] = { status: item.done ? 'done' : 'todo', rev: item.revision, comments: [], at: 0 };
        return;
      }
      const s = Object.assign({ comments: [] }, p);
      delete s.gone;
      if (item.revision > (s.rev || 1)) {
        const n = note(`sys-${item.id}-${item.revision}`, item.reply || again);
        if ((s.status !== 'todo' || item.reply) && !s.comments.some((cm) => cm.id === n.id)) s.comments = s.comments.concat([n]);
        s.status = 'todo';
        s.rev = item.revision;
      } else if (item.done && s.status === 'todo') {
        s.status = 'done';
      }
      state.items[item.id] = s;
    });
    // 고객 요청 한 장 — AI가 고친 장(회차가 오른 장)과 고객에게 나갈 글이 바뀐 장은 다시 '확인 전'으로
    spec.units.forEach((u) => {
      if (u.kind === 'check' || u.kind === 'end') return;
      if (u.kind === 'send') {
        const s = state.items[u.key];
        if (!s || !u.sig) return;
        if (s.sig && s.sig !== u.sig && s.status !== 'todo') {
          const n = note(`sys-${u.key}-${u.sig}`, '고객에게 보낼 글이 바뀌었어요. 다시 확인해 주세요');
          if (!s.comments.some((cm) => cm.id === n.id)) s.comments = s.comments.concat([n]);
          s.status = 'todo';
        }
        s.sig = u.sig;
        return;
      }
      const p = prev[u.key];
      if (!p) {
        state.items[u.key] = { status: 'todo', rev: u.rev, sig: u.sig, comments: [], at: 0 };
        return;
      }
      const s = Object.assign({ comments: [] }, p);
      delete s.gone;
      const bumped = u.rev > (s.rev || 1);
      const rewritten = !bumped && Boolean(u.sig && s.sig && s.sig !== u.sig);
      if (bumped || rewritten) {
        const was = unitStatus(u, Object.assign({}, state.items, { [u.key]: s }));
        const replies = u.checks.filter((it) => it.reply && it.revision > ((prev[it.id] && prev[it.id].rev) || 1)).map((it) => String(it.reply));
        const text = bumped ? (u.reply || replies.join(' / ') || again) : '고객 일지에 나갈 글이 바뀌었어요. 다시 확인해 주세요';
        const n = note(`sys-${u.key}-${bumped ? u.rev : u.sig}`, text);
        if ((bumped || was !== 'todo') && !s.comments.some((cm) => cm.id === n.id)) s.comments = s.comments.concat([n]);
        s.status = 'todo';
      }
      s.rev = Math.max(u.rev, s.rev || 1);
      if (u.sig) s.sig = u.sig;
      state.items[u.key] = s;
    });
    Object.keys(prev).forEach((id) => {
      if (!state.items[id]) state.items[id] = Object.assign({}, prev[id], { gone: true });
    });
    return state;
  };
  // 서버(대시보드)에 저장된 체크와 이 브라우저 체크 합치기 — 회차가 높은 쪽, 같으면 나중에 누른 쪽. 댓글은 모두 모으고 지운 것은 뺀다.
  const virgin = (e) => !e || (!(e.at > 0) && !(e.comments && e.comments.length) && !(e.del && e.del.length));
  const sortComments = (list) => list.slice().sort((a, b) => ((a.round || 0) - (b.round || 0)) || ((b.sys ? 1 : 0) - (a.sys ? 1 : 0)) || ((a.at || 0) - (b.at || 0)));
  const pickEntry = (a, b) => {
    if (virgin(b)) return a || b;
    if (virgin(a)) return Object.assign({}, b);
    const ra = a.rev || 1;
    const rb = b.rev || 1;
    const win = ra !== rb ? (ra > rb ? a : b) : ((a.at || 0) >= (b.at || 0) ? a : b);
    const del = Array.from(new Set([].concat(a.del || [], b.del || [])));
    const byId = new Map();
    [].concat(a.comments || [], b.comments || []).forEach((c) => {
      if (c && c.id && !byId.has(c.id)) byId.set(c.id, c);
    });
    const comments = sortComments(Array.from(byId.values()).filter((c) => !del.includes(c.id)));
    const out = Object.assign({}, win, { comments });
    if (del.length) out.del = del;
    else delete out.del;
    return out;
  };
  const freshComments = (entry) => {
    const list = (entry && entry.comments) || [];
    let from = 0;
    list.forEach((c, i) => {
      if (c.sys) from = i + 1;
    });
    return list.slice(from).filter((c) => !c.sys);
  };
  // 한 장의 상태 — 장에 직접 남긴 기록이 있으면 그것, 없으면(2.x에서 검수항목마다 체크한 것) 묶인 검수항목들로 정한다
  const unitStatus = (u, items) => {
    const e = items[u.key];
    if (u.kind === 'req' || u.kind === 'extra') {
      if (e && !virgin(e)) return e.status || 'todo';
      if (!u.checks.length) return 'todo';
      const list = u.checks.map((it) => (items[it.id] && items[it.id].status) || 'todo');
      if (list.includes('needs')) return 'needs';
      return list.every((x) => x === 'done') ? 'done' : 'todo';
    }
    return (e && e.status) || 'todo';
  };
  // 이 주소(지금 창)에서 확인하는 검수항목인지 — 빨간 표시는 이런 항목에만 붙는다
  const onSite = (it) => Boolean(it && it.url) && !it.outside && sameOrigin(it.url);
  const byTime = (a, b) => ((a.c.round || 0) - (b.c.round || 0)) || ((b.c.sys ? 1 : 0) - (a.c.sys ? 1 : 0)) || ((a.c.at || 0) - (b.c.at || 0));
  // 한 장에 달린 말 — 장에 남긴 말과 AI가 고쳤다는 말, 그리고 2.x에서 그 장의 검수항목에 남긴 사람 말
  const threadOf = (u, items) => {
    const own = ((items[u.key] && items[u.key].comments) || []).map((c) => ({ c, owner: u.key }));
    if (u.kind !== 'req' && u.kind !== 'extra') return own;
    const old = [];
    u.checks.forEach((it) => ((items[it.id] && items[it.id].comments) || []).forEach((c) => {
      if (!c.sys) old.push({ c, owner: it.id });
    }));
    return own.concat(old).sort(byTime);
  };
  const lastSysAt = (e) => ((e && e.comments) || []).reduce((t, c) => (c.sys ? Math.max(t, c.at || 0) : t), 0);
  // 아직 안 고친 말 — 그 장에 'AI가 고쳤어요'가 붙은 뒤에 남긴 것만
  const freshOf = (u, items) => {
    const out = freshComments(items[u.key]).map((c) => ({ c, owner: u.key }));
    if (u.kind === 'req' || u.kind === 'extra') {
      const since = lastSysAt(items[u.key]);
      u.checks.forEach((it) => freshComments(items[it.id]).forEach((c) => {
        if ((c.at || 0) > since) out.push({ c, owner: it.id });
      }));
    }
    return out.sort(byTime);
  };
  const unitCounts = (spec, items, withSend) => {
    const c = { todo: 0, needs: 0, done: 0, all: 0 };
    spec.units.forEach((u) => {
      if (u.kind === 'end' || (u.kind === 'send' && !withSend)) return;
      c[unitStatus(u, items)] += 1;
      c.all += 1;
    });
    c.left = c.todo + c.needs;
    return c;
  };
  const buildExport = (spec, state, name) => {
    const items = state.items;
    const units = spec.units.filter((u) => u.kind !== 'end');
    const group = { needs: [], done: [], todo: [] };
    units.forEach((u) => group[unitStatus(u, items)].push(u));
    const no = (u) => `${units.indexOf(u) + 1})`;
    const label = (u) => (u.kind === 'send' ? '고객에게 보낼 글(업데이트 일지·보낼 말)' : u.kind === 'remain' ? `[이번엔 못 함] ${oneLine(u.title)}` : oneLine(u.title));
    const about = (u, x) => {
      const id = x.owner !== u.key ? x.owner : x.c.check;
      return id ? spec.items.find((it) => it.id === id) || null : null;
    };
    // 머리 줄의 수는 고객 요청만 센다. 고객에게 보낼 글은 마지막에 따로 보는 것이라 '아직 안 본 것'에도 넣지 않는다(남긴 말이 있으면 '고칠 것'에 나온다)
    const reqs = units.filter((u) => u.kind !== 'send');
    const count = (st) => reqs.filter((u) => group[st].includes(u)).length;
    const out = [
      `[검수판 결과] ${spec.title}${spec.round > 1 ? ` · ${spec.round}회차` : ''}`,
      `검수자 ${name || '이름 없음'} · ${stamp(Date.now())}`,
      `주소 ${spec.site}`,
      `${spec.log ? '고객 요청' : '검수'} ${reqs.length}개 · 확인 완료 ${count('done')} · 고칠 것 ${count('needs')} · 아직 안 봄 ${count('todo')}`,
    ];
    if (group.needs.length) {
      out.push('', '■ 고칠 것: 남긴 말대로 고쳐 주세요');
      group.needs.forEach((u) => {
        out.push(`${no(u)} ${label(u)}`);
        freshOf(u, items).forEach((x) => {
          const it = about(u, x);
          out.push(`   - ${x.c.by} · ${stamp(x.c.at)}${it ? ` [확인: ${oneLine(it.title)}${it.url ? ` ${it.url}` : ''}]` : ''}: ${oneLine(x.c.text)}`);
          if (x.c.pin) out.push(`     위치: ${x.c.pin.path} · ${x.c.pin.desc}${x.c.pin.selector ? ` · ${x.c.pin.selector}` : ''}`);
        });
      });
    }
    if (group.done.length) {
      out.push('', '■ 확인 완료: 일지에서 빼지 말고 그대로 두면 다음 회차에도 확인 완료로 남아요');
      group.done.forEach((u) => {
        const notes = freshOf(u, items);
        out.push(`${no(u)} ${label(u)}${notes.length ? ` (참고: ${notes.map((x) => oneLine(x.c.text)).join(' | ')})` : ''}`);
      });
    }
    const unseen = group.todo.filter((u) => u.kind !== 'send');
    if (unseen.length) {
      out.push('', '■ 아직 안 본 것: 손대지 말고 그대로 두세요');
      unseen.forEach((u) => out.push(`${no(u)} ${label(u)}`));
    }
    const ids = (list) => list.map((u) => u.id);
    const itemIds = (list) => [].concat(...list.map((u) => (u.kind === 'send' ? [SEND] : u.checks.map((it) => it.id))));
    out.push('', `검수판상태 ${JSON.stringify({
      id: spec.id, round: spec.round,
      units: { done: ids(group.done), needs: ids(group.needs), todo: ids(group.todo) },
      done: itemIds(group.done), needs: itemIds(group.needs), todo: itemIds(group.todo),
    })}`);
    return out.join('\n');
  };

  const CSS_TEXT = `
:host{all:initial}
.root{position:fixed;inset:0;pointer-events:none;font-family:"Pretendard Variable",Pretendard,-apple-system,BlinkMacSystemFont,system-ui,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;font-size:14px;line-height:1.55;letter-spacing:-.01em;color:#111827;word-break:keep-all;overflow-wrap:anywhere;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%}
.root *,.root *::before,.root *::after{box-sizing:border-box}
[hidden]{display:none!important}
button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;text-align:inherit;-webkit-tap-highlight-color:transparent}
button:focus-visible,a:focus-visible,textarea:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #dc2626;outline-offset:2px}
svg{display:block}
.ib svg,.btn svg,.pin svg,.dot svg,.tiny svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.marks{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.mk{position:absolute;border:2.5px solid #dc2626;border-radius:7px;box-shadow:0 0 0 2px #fff}
.mb{position:absolute;background:#dc2626;color:#fff;font-size:12px;font-weight:800;line-height:20px;height:20px;padding:0 8px;border-radius:999px;white-space:nowrap;box-shadow:0 0 0 2px #fff}
.mb.cm{background:#d97706}
.mk.cm{border-style:dashed;border-color:#d97706}
.mk.flash{animation:qf .6s ease-in-out 3}
@keyframes qf{50%{box-shadow:0 0 0 2px #fff,0 0 0 10px rgba(220,38,38,.35)}}
.card{position:absolute;pointer-events:auto;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -18px rgba(15,23,42,.5),0 0 0 1px rgba(15,23,42,.07);animation:qin .22s cubic-bezier(.2,.8,.2,1)}
@keyframes qin{from{opacity:0;transform:translateY(6px)}}
.box{right:12px;bottom:12px;width:388px;max-height:calc(100vh - 24px);border:1px solid #dc2626}
.box.left{right:auto;left:12px}
.box.side:not(.fold){top:12px}
.hd{flex:none;display:flex;align-items:center;gap:6px;padding:8px 8px 8px 12px;background:#dc2626;color:#fff;cursor:pointer;user-select:none}
.brand{flex:none;background:#fff;color:#dc2626;font-size:11.5px;font-weight:800;border-radius:999px;padding:0 8px;line-height:20px}
.hd .t{flex:1;min-width:0;font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd .rd,.hd .cnt{flex:none;font-size:11.5px;font-weight:800;background:rgba(255,255,255,.22);border-radius:999px;padding:0 8px;line-height:20px;white-space:nowrap}
.hd .cnt{background:#fff;color:#b91c1c}
.ib{flex:none;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
.ib svg{width:16px;height:16px}
.hd .ib:hover{background:rgba(255,255,255,.18)}
.hd .ib.on{background:#fff;color:#dc2626}
.fold-ic{transition:transform .2s}
.box.fold .fold-ic{transform:rotate(180deg)}
.strip{flex:none;display:flex;align-items:center;gap:7px;padding:7px 12px;background:#fef2f2;color:#991b1b;font-size:12.5px;font-weight:700;border-bottom:1px solid #fde2e2}
.strip.ok{background:#f0fdf4;color:#166534;border-color:#dcfce7}
.strip span{flex:1;min-width:0}
.strip .live,.say.live::before{flex:none;display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;animation:qp 1.2s ease-in-out infinite}
.say.live::before{content:"";margin-right:6px;vertical-align:1px}
@keyframes qp{50%{opacity:.25}}
.lnk{flex:none;color:#2563eb;font-weight:800}
.lnk:hover{text-decoration:underline}
.prog{flex:none;display:flex;gap:3px;padding:9px 12px 1px}
.seg{flex:1;min-width:5px;height:14px;display:flex;align-items:center}
.seg i{display:block;width:100%;height:5px;border-radius:3px;background:#e5e7eb}
.seg:hover i{background:#cbd2dc}
.seg.done i{background:#16a34a}
.seg.needs i{background:#f59e0b}
.seg.cur i{height:8px;box-shadow:0 0 0 2px #fff,0 0 0 3.5px #111827}
.body{flex:1;min-height:0;overflow:auto;padding:10px 14px 12px;overscroll-behavior:contain}
.body.fadeout{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 22px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 22px),transparent)}
.box.fold .prog,.box.fold .body{display:none}
.uh{display:flex;align-items:center;gap:7px;margin:0 0 6px}
.tag{font-size:12.5px;font-weight:800;color:#dc2626}
.tag.rest{color:#6b7280}
.pill{font-size:11.5px;font-weight:800;border-radius:999px;padding:0 8px;line-height:20px;white-space:nowrap;background:#f3f4f6;color:#4b5563}
.pill.needs{background:#fffbeb;color:#b45309}
.pill.done{background:#f0fdf4;color:#15803d}
.ask{margin:0 0 12px;font-size:16px;font-weight:800;line-height:1.45;color:#111827}
blockquote.ask{padding:1px 0 1px 11px;border-left:3px solid #dc2626}
.sec{margin:0 0 12px}
.sec h5,.sec summary{display:flex;align-items:baseline;flex-wrap:wrap;gap:2px 7px;margin:0 0 6px;font-size:12.5px;font-weight:800;color:#374151}
.sec summary{cursor:pointer;display:list-item}
.mu{color:#6b7280;font-size:12px;font-weight:600}
ul{margin:0;padding-left:18px}
li{margin:3px 0;font-size:13px;line-height:1.55}
.did li{font-size:13.5px;color:#1f2937}
.golinks{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:4px;font-size:12.5px;font-weight:700}
.note{font-size:12.5px;color:#4b5563;background:#f9fafb;border-radius:10px;padding:8px 10px;margin:0 0 12px;line-height:1.55}
.chk{border:1px solid #e5e7eb;border-radius:12px;padding:10px 11px 8px;background:#fff}
.ct{display:block;font-size:14px;font-weight:800;line-height:1.45;margin:0 0 3px}
.where{display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;font-size:12px;color:#6b7280;margin:0 0 8px}
.where .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;word-break:break-all}
.place{font-weight:800;color:#dc2626}
.tiny{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:#6b7280}
.tiny:hover{color:#111827}
.tiny svg{width:13px;height:13px;stroke-width:2.2}
.goto{margin:0 0 8px}
.sit{font-size:12.5px;color:#4b5563;margin:0 0 8px;line-height:1.55}
.steps{list-style:none;margin:0 0 4px;padding:0;display:flex;flex-direction:column;gap:5px}
.st{display:flex;gap:9px;align-items:flex-start;cursor:pointer;border-radius:10px;padding:4px 5px 4px 2px;margin:0}
.st:hover{background:#f6f7f9}
.st .n{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid #dc2626;color:#dc2626;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-top:1px;background:#fff}
.st.on .n{background:#dc2626;color:#fff}
.st .n.nomark{border-color:#cfd4dc;color:#6b7280}
.st .tx{flex:1;min-width:0;font-size:13.5px;line-height:1.6}
.cpy{margin-top:5px;border:1px solid #e5e7eb;border-radius:9px;background:#fafafa;overflow:hidden}
.cpy pre{margin:0;padding:7px 9px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;color:#374151;max-height:120px;overflow:auto}
.cpy button{display:block;width:100%;padding:6px;border-top:1px solid #e5e7eb;font-size:12.5px;font-weight:800;color:#dc2626;text-align:center;background:#fff}
.kb{display:inline-block;border:1px solid #cbd2dc;border-bottom-width:2px;border-radius:6px;padding:0 6px;font-size:12.5px;font-weight:700;line-height:1.5;background:#fff;color:#111827}
.q{font-weight:700;color:#111827}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:#f3f4f6;border-radius:5px;padding:1px 5px;color:#374151}
a.ln{color:#2563eb;text-decoration:none;word-break:break-all;cursor:pointer}
a.ln:hover{text-decoration:underline}
a.ln.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
.ai{border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px;margin:6px 0 2px;font-size:12.5px}
.ai summary{cursor:pointer;font-weight:800}
.ai.ok summary{color:#15803d}
.ai.bad summary{color:#b91c1c}
.ai.na summary{color:#6b7280}
.ai ul{margin-top:5px}
details.prep{margin:0 0 10px;background:#f9fafb;border:1px solid #eef0f4;border-radius:10px;padding:7px 10px}
details.prep summary{cursor:pointer;font-size:12.5px;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
details.prep summary b{color:#111827;margin-right:6px}
details.prep[open] summary{white-space:normal}
details.prep ul{margin-top:6px}
.th{border-top:1px solid #eef0f4;padding-top:10px;margin-top:12px}
.thh{font-size:12px;font-weight:800;color:#6b7280;margin-bottom:6px}
.msg{background:#fffbeb;border-radius:10px;padding:7px 10px;margin-bottom:6px}
.msg.sys{background:#f0fdf4}
.mh{display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280}
.mh b{color:#111827;font-weight:800}
.msg.sys .mh b{color:#15803d}
.mh .del{margin-left:auto;width:22px;height:22px;border-radius:6px;color:#a1a1aa;font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center}
.mh .del:hover{background:#fde68a;color:#92400e}
.mt{font-size:13.5px;white-space:pre-wrap;margin-top:2px;line-height:1.55}
.about{display:block;margin-top:2px;font-size:11.5px;color:#9ca3af}
.pin{margin-top:5px;font-size:12px;font-weight:700;color:#b45309;display:inline-flex;gap:4px;align-items:center}
.pin svg{width:13px;height:13px}
.cp{margin-top:12px}
.cp textarea{display:block;width:100%;min-height:72px;max-height:200px;resize:vertical;border:1.5px solid #dc2626;border-radius:10px;padding:8px 10px;font:inherit;font-size:13.5px;line-height:1.5;background:#fff;color:#111827;outline:none;box-shadow:0 0 0 3px rgba(220,38,38,.1)}
.cpr{display:flex;align-items:center;gap:6px;margin-top:6px}
.cpr .sp{flex:1}
.draftpin{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:#b45309;font-weight:700}
.draftpin svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2}
.draftpin button{color:#9ca3af;font-weight:700;margin-left:auto}
.me{font-size:12px;color:#6b7280;white-space:nowrap}
.me button{color:#dc2626;font-weight:800;margin-left:4px}
.ft{flex:none;border-top:1px solid #eef0f4;background:#fff;padding:9px 10px 10px}
.say{margin:0 2px 8px;font-size:13px;font-weight:700;color:#111827;line-height:1.5}
.acts{display:flex;gap:6px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:38px;border-radius:10px;font-size:13.5px;font-weight:800;padding:0 12px;white-space:nowrap}
.btn svg{width:15px;height:15px;stroke-width:2.4}
.btn.sm{height:32px;font-size:12.5px;padding:0 10px}
.acts .btn{height:44px;font-size:14px;min-width:0}
.acts .back{flex:none;width:44px;padding:0;font-size:20px;font-weight:700}
.acts .a{flex:1}
.acts .b{flex:1.5}
.btn.ghost{background:#f3f4f6;color:#374151}
.btn.ghost:hover{background:#e9ebef}
.btn.dark{background:#111827;color:#fff}
.btn.dark:hover{background:#000}
.btn.ok{background:#16a34a;color:#fff}
.btn.ok:hover{background:#15803d}
.btn.red{background:#dc2626;color:#fff}
.btn.red:hover{background:#b91c1c}
.btn.outline{background:#fff;color:#111827;box-shadow:inset 0 0 0 1.5px #d1d5db}
.btn.outline:hover{background:#f9fafb}
.btn:disabled{opacity:.35;cursor:default}
.tally{display:flex;gap:6px;margin:0 0 12px}
.tally span{flex:1;text-align:center;border-radius:10px;padding:7px 4px;font-size:12px;font-weight:700;background:#f3f4f6;color:#4b5563}
.tally b{display:block;font-size:18px;font-weight:800;color:#111827;line-height:1.3}
.tally .t-done{background:#f0fdf4;color:#166534}
.tally .t-done b{color:#15803d}
.tally .t-needs{background:#fffbeb;color:#92400e}
.tally .t-needs b{color:#b45309}
.rows{display:flex;flex-direction:column;gap:2px}
.row{display:flex;align-items:flex-start;gap:9px;padding:7px 8px;border-radius:10px;width:100%}
.row:hover{background:#f6f7f9}
.row .rt{flex:1;min-width:0;font-size:13px;line-height:1.45}
.row .rm{display:block;font-size:12px;color:#6b7280;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dot{flex:none;width:18px;height:18px;border-radius:50%;margin-top:1px;border:2px solid #cfd4dc;display:inline-flex;align-items:center;justify-content:center;color:#fff;background:#fff}
.dot.needs{background:#d97706;border-color:#d97706}
.dot.done{background:#16a34a;border-color:#16a34a}
.dot svg{width:10px;height:10px;stroke-width:3.4}
.dot.needs::after{content:"!";font-size:11px;font-weight:900;line-height:1}
.empty{color:#6b7280;font-size:13px;margin:10px 2px}
.msgp{background:#f6f7f9;border-radius:10px;padding:9px 11px;font-size:13px;line-height:1.62;white-space:pre-wrap;margin:0 0 8px;color:#1f2937}
.lgp{border:1px solid #e5e8eb;border-radius:12px;padding:10px 12px;background:#fff}
.lgp .lh{font-size:12px;font-weight:800;color:#6b7280;margin:0 0 6px}
.lgp .le+.le{margin-top:9px;padding-top:9px;border-top:1px solid #f2f4f6}
.lgp .le b{display:block;font-size:13.5px;font-weight:800;color:#191f28;line-height:1.45}
.lgp .le ul{margin-top:3px}
.lgp .le a.ln{display:inline-block;margin-top:3px;font-size:12px;font-weight:700;color:#3182f6}
.lgp .le.rest b{color:#6b7280;font-size:12.5px}
.share{background:#f0fdf4;color:#166534;border-radius:10px;padding:9px 11px;margin:0 0 12px;font-size:13px;font-weight:800;line-height:1.5}
.share .mu{display:block;font-weight:500;color:#4b5563;margin-top:2px}
.pick{position:absolute;inset:0;pointer-events:auto;cursor:crosshair;background:rgba(15,23,42,.03)}
.pickbox{position:absolute;border:2px dashed #d97706;background:rgba(217,119,6,.08);border-radius:6px;pointer-events:none}
.picktag{position:absolute;background:#d97706;color:#fff;font-size:12px;font-weight:800;border-radius:999px;padding:0 9px;line-height:21px;white-space:nowrap;pointer-events:none}
.pickhint{position:absolute;left:50%;top:14px;transform:translateX(-50%);background:#111827;color:#fff;border-radius:999px;padding:8px 15px;font-size:13px;font-weight:700;pointer-events:none;white-space:nowrap;box-shadow:0 10px 30px -10px rgba(0,0,0,.5)}
.toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%) translateY(8px);opacity:0;background:#111827;color:#fff;border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:600;white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis;transition:opacity .2s,transform .2s;pointer-events:none;z-index:6}
.toast.on{opacity:1;transform:translateX(-50%)}
.mbg{position:absolute;inset:0;z-index:5;background:rgba(15,23,42,.45);pointer-events:auto;display:flex;align-items:flex-start;justify-content:center;padding:12vh 12px 12px}
.modal{width:min(460px,100%);background:#fff;border-radius:16px;padding:18px;box-shadow:0 22px 50px -14px rgba(15,23,42,.45)}
.modal h3{margin:0 0 6px;font-size:16px;font-weight:800}
.modal p{margin:0 0 12px;font-size:13px;color:#4b5563;line-height:1.55}
.modal input,.modal textarea{display:block;width:100%;border:1px solid #d6dcea;border-radius:10px;padding:9px 11px;font:inherit;font-size:14px;outline:none;background:#fff;color:#111827}
.modal textarea{height:300px;font-size:13px;line-height:1.6;resize:vertical;white-space:pre-wrap}
.modal textarea.short{height:170px}
.modal input:focus,.modal textarea:focus{border-color:#dc2626}
.mr{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;margin-top:12px}
.mr .btn{height:40px;padding:0 16px;font-size:13.5px}
@media (max-width:640px){
.box,.box.left{left:0;right:0;bottom:0;width:auto;max-height:64vh;border-radius:16px 16px 0 0;padding-bottom:env(safe-area-inset-bottom)}
.hd .ib[data-act="mobile"],.hd .ib[data-act="split"]{display:none}
.toast{bottom:auto;top:62px}
.ask{font-size:15px}
}
@media (prefers-reduced-motion:reduce){.card,.mk.flash,.strip .live,.say.live::before{animation:none}.toast,.fold-ic{transition:none}}
`;

  class Shell {
    constructor(onLoad, url) {
      const stage = document.createElement('div');
      stage.id = 'qa-review-stage';
      stage.style.cssText = 'position:fixed;inset:0;z-index:2147482990;background:#e9ecf1;visibility:visible;margin:0;padding:0';
      const frame = document.createElement('iframe');
      frame.id = 'qa-review-frame';
      frame.title = '검수 화면';
      frame.setAttribute('allow', 'clipboard-read; clipboard-write; fullscreen; payment');
      frame.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:#fff;visibility:visible;display:block';
      frame.addEventListener('load', onLoad);
      frame.src = url;
      stage.appendChild(frame);
      this.before = { body: document.body ? document.body.style.visibility : '', overflow: document.documentElement.style.overflow };
      if (document.body) document.body.style.visibility = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.appendChild(stage);
      this.stage = stage;
      this.frame = frame;
      this.mobile = false;
    }

    win() {
      return attempt(() => {
        const w = this.frame.contentWindow;
        return w && w.document ? w : null;
      }, null);
    }

    doc() {
      const w = this.win();
      return w ? attempt(() => w.document, null) : null;
    }

    href() {
      const w = this.win();
      return w ? attempt(() => w.location.href, '') : '';
    }

    go(url) {
      this.frame.src = url;
    }

    rect() {
      return this.frame.getBoundingClientRect();
    }

    setLayout(mode) {
      this.mode = mode;
      const s = this.frame.style;
      if (mode === 'split') {
        s.left = '0';
        s.width = `calc(100% - ${SIDE}px)`;
        s.boxShadow = '0 0 0 1px rgba(15,23,42,.1)';
      } else if (mode === 'mobile') {
        s.width = '390px';
        s.left = innerWidth >= SPLIT_MIN ? `calc((100% - ${SIDE}px) / 2 - 195px)` : 'calc(50% - 195px)';
        s.boxShadow = '0 0 0 1px rgba(15,23,42,.12),0 30px 70px -24px rgba(15,23,42,.55)';
      } else {
        s.left = '0';
        s.width = '100%';
        s.boxShadow = 'none';
      }
    }

    destroy() {
      this.stage.remove();
      if (document.body) document.body.style.visibility = this.before.body;
      document.documentElement.style.overflow = this.before.overflow;
    }
  }

  let app = null;

  const flash = (message) => {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS_TEXT}</style><div class="root"><div class="toast on" role="status">${esc(message)}</div></div>`;
    document.documentElement.appendChild(host);
    setTimeout(() => host.remove(), 3600);
  };

  class App {
    constructor() {
      this.spec = null;
      this.raw = null;
      this.state = null;
      this.shell = null;
      this.targets = [];
      this.targetsFor = '';
      this.docSeen = null;
      this.timer = 0;
      this.raf = 0;
      this.draft = '';
      this.draftPin = null;
      this.composing = false;
      this.focusDraft = false;
      this.picking = false;
      this.pickEl = null;
      this.itemSince = 0;
      this.scrolled = false;
      this.placed = 0;
      this.markRects = [];
      this.modalDone = null;
      this.loadingSince = 0;
      this.board = null;
      this.synced = false;
      this.stale = false;
      this.pushedSig = '';
      this.src = '';
      this.onVisible = () => {
        if (document.hidden) return;
        this.polledAt = 0;
        this.poll();
      };
      this.onScroll = () => this.schedule();
      this.onStorage = (e) => {
        if (!this.spec || e.key !== KEY + this.spec.id || !e.newValue) return;
        const saved = attempt(() => JSON.parse(e.newValue), null);
        if (!saved || !saved.state || !saved.state.items) return;
        this.state.items = merge(this.spec, saved.state).items;
        this.renderAll();
      };
      this.onResize = () => {
        this.applyView();
        this.schedule();
      };
      this.onKey = (e) => this.key(e);
      this.onFrameLoad = () => {
        this.loadingSince = 0;
        this.tick();
      };
      this.build();
    }

    build() {
      const host = document.createElement('div');
      host.id = 'qa-review-host';
      host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;margin:0;padding:0;visibility:visible';
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style>${CSS_TEXT}</style>
<div class="root">
  <div class="marks"></div>
  <section class="card box" role="dialog" aria-label="검수">
    <header class="hd" data-act="fold">
      <span class="brand">검수</span><span class="t"></span><span class="rd" hidden></span><span class="cnt"></span>
      <button class="ib" type="button" data-act="split" title="화면 위에 겹쳐 보기" aria-label="나란히 보기 또는 겹쳐 보기">${ICON.split}</button>
      <button class="ib" type="button" data-act="mobile" title="휴대폰 폭(390px)으로 보기" aria-label="휴대폰 폭으로 보기">${ICON.phone}</button>
      <button class="ib fold-ic" type="button" data-act="fold" title="접기·펼치기" aria-label="접기 또는 펼치기">${ICON.chevron}</button>
      <button class="ib" type="button" data-act="close" title="검수 닫기" aria-label="검수 닫기">${ICON.close}</button>
    </header>
    <div class="strip" hidden></div>
    <nav class="prog" aria-label="고객 요청 진행"></nav>
    <div class="body"></div>
    <footer class="ft"><p class="say"></p><div class="acts"></div></footer>
  </section>
  <div class="pick" hidden><div class="pickbox" hidden></div><div class="picktag" hidden></div><div class="pickhint">고칠 곳을 누르세요 · Esc 취소</div></div>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="mbg" hidden><div class="modal" role="dialog" aria-modal="true"></div></div>
</div>`;
      const $ = (sel) => shadow.querySelector(sel);
      this.host = host;
      this.shadow = shadow;
      this.ui = {
        root: $('.root'), marks: $('.marks'), box: $('.box'), title: $('.hd .t'), round: $('.hd .rd'), cnt: $('.hd .cnt'),
        split: $('[data-act="split"]'), mobile: $('[data-act="mobile"]'), strip: $('.strip'), prog: $('.prog'), body: $('.body'),
        say: $('.say'), acts: $('.acts'), pick: $('.pick'), pickbox: $('.pickbox'), picktag: $('.picktag'), toast: $('.toast'), mbg: $('.mbg'), modal: $('.modal'),
      };
      STOP_EVENTS.forEach((type) => this.ui.root.addEventListener(type, (e) => e.stopPropagation()));
      this.ui.root.addEventListener('click', (e) => this.click(e));
      this.ui.root.addEventListener('input', (e) => {
        if (e.target.dataset && e.target.dataset.role === 'draft') this.draft = e.target.value;
      });
      this.ui.root.addEventListener('keydown', (e) => {
        if (e.target.dataset && e.target.dataset.role === 'draft' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.comment();
        }
        if (e.key === 'Escape') this.key(e);
      });
      this.ui.body.addEventListener('scroll', () => this.fade(this.ui.body), { passive: true });
      this.ui.root.addEventListener('toggle', (e) => {
        if (e.target.classList && e.target.classList.contains('prep')) this.prepOpen = e.target.open;
        this.fade(this.ui.body);
      }, true);
      this.ui.pick.addEventListener('mousemove', (e) => this.pickMove(e));
      this.ui.pick.addEventListener('click', (e) => this.pickClick(e));
    }

    mount() {
      if (!this.host.isConnected) document.documentElement.appendChild(this.host);
      document.addEventListener('keydown', this.onKey, true);
      addEventListener('resize', this.onResize);
      addEventListener('scroll', this.onScroll, true);
      addEventListener('storage', this.onStorage);
      if (!this.timer) this.timer = setInterval(() => this.tick(), 700);
      if (!this.drawTimer) this.drawTimer = setInterval(() => this.draw(), 120);
      if (!this.pollTimer) this.pollTimer = setInterval(() => this.poll(), 4000);
      document.addEventListener('visibilitychange', this.onVisible);
    }

    load(raw, opts) {
      const spec = normalize(raw);
      const saved = local.get(KEY + spec.id);
      const sameBoard = Boolean(this.spec && this.spec.board && spec.board && this.spec.board.key === spec.board.key);
      this.raw = raw;
      this.spec = spec;
      let old = saved && saved.state;
      const carried = opts.carried;
      if (carried && carried.i && typeof carried.i === 'object') {
        // 다른 주소에서 같은 창으로 넘어왔다 — 넘겨받은 체크·말을 이 주소에 남아 있던 기록과 합친다
        const mine = (old && old.items) || {};
        const combined = {};
        new Set(Object.keys(mine).concat(Object.keys(carried.i))).forEach((key) => {
          combined[key] = pickEntry(mine[key], carried.i[key]);
        });
        old = Object.assign({}, old, { items: combined });
        if (carried.v) old.view = carried.v;
        if (typeof carried.f === 'boolean') old.fold = carried.f;
        if (carried.n && !this.name()) local.put(NAME, String(carried.n).slice(0, 40));
      }
      this.state = merge(spec, old);
      this.src = opts.src || (saved && saved.src) || (sameBoard ? this.src : '') || '';
      if (!sameBoard) {
        this.board = null;
        this.boardSig = '';
      }
      this.synced = false;
      this.stale = false;
      this.pushedSig = '';
      this.composing = false;
      this.draft = '';
      this.draftPin = null;
      // 새 회차는 지난 회차에 보던 자리가 아니라 다시 볼 첫 요청의 첫 확인부터
      const lastRound = saved && saved.spec ? Number(saved.spec.round) || 1 : spec.round;
      const at = this.place(opts.start) || (lastRound < spec.round ? null : this.place(this.state.cur, this.state.chk));
      const first = at || { unit: (this.nextOpen(null) || spec.units[0]).id, chk: 0 };
      this.autoPos = !at;
      this.state.cur = first.unit;
      this.state.chk = first.chk;
      local.put(LAST, spec.id);
      local.put(ON, spec.id);
      const here = opts.url || location.href.split('#')[0];
      const it = this.check();
      // 검수 링크를 처음 열 때는 지금 확인할 화면부터 띄운다(같은 주소 안에서만 — 다른 주소면 박스가 [… 화면으로 가기]를 띄운다)
      const startUrl = opts.src && !carried && it && it.url && !it.outside && sameOrigin(it.url) ? it.url : here;
      if (opts.frame !== false && window.top === window && !this.shell) {
        this.loadingSince = Date.now();
        this.shell = new Shell(this.onFrameLoad, sameOrigin(startUrl) ? startUrl : location.href.split('#')[0]);
      }
      if (this.shell) this.ensureHide(document);
      this.applyView();
      this.save();
      this.mount();
      this.changed();
      if (spec.board) this.serverLoad(true);
      return this.summary();
    }

    save() {
      if (!this.spec) return;
      const href = this.href();
      if (href && sameOrigin(href)) this.state.lastUrl = href;
      local.set(KEY + this.spec.id, { v: 1, spec: this.raw, state: this.state, savedAt: Date.now(), src: this.src || '' });
      this.pushSoon();
    }

    destroy(opts) {
      clearInterval(this.timer);
      this.timer = 0;
      clearInterval(this.drawTimer);
      this.drawTimer = 0;
      clearInterval(this.pollTimer);
      this.pollTimer = 0;
      document.removeEventListener('visibilitychange', this.onVisible);
      cancelAnimationFrame(this.raf);
      document.removeEventListener('keydown', this.onKey, true);
      removeEventListener('resize', this.onResize);
      removeEventListener('scroll', this.onScroll, true);
      removeEventListener('storage', this.onStorage);
      this.save();
      this.pushNow();
      const keep = Boolean(opts && opts.keep);
      if (!keep) local.put(ON, null);
      session.put(ON, null);
      this.host.remove();
      const href = this.shell ? this.shell.href() : '';
      if (this.shell) this.shell.destroy();
      this.shell = null;
      app = null;
      if (!keep && href && sameOrigin(href) && pageKey(href) !== pageKey(location.href)) location.href = href;
    }

    isPhone() {
      return attempt(() => matchMedia('(max-width: 640px)').matches, false);
    }

    unit(id) {
      return this.spec ? this.spec.units.find((u) => u.id === id) || null : null;
    }

    current() {
      return this.unit(this.state.cur);
    }

    check() {
      const u = this.current();
      return (u && u.checks[this.state.chk]) || null;
    }

    item(id) {
      return this.spec ? this.spec.items.find((it) => it.id === id) || null : null;
    }

    // 'unitId~2'(장과 그 안의 확인 순서), 장 id, 또는 옛 링크·옛 기록의 검수항목 id 를 { unit, chk } 로
    place(value, chk) {
      if (!value || !this.spec) return null;
      let id = String(value);
      let k = Number(chk) || 0;
      const m = /^(.*)~(\d+)$/.exec(id);
      if (m) {
        id = m[1];
        k = Number(m[2]);
      }
      const u = this.unit(id);
      if (u) return { unit: u.id, chk: Math.max(0, Math.min(k, u.checks.length - 1)) };
      const owner = this.spec.units.find((x) => x.checks.some((it) => it.id === id));
      return owner ? { unit: owner.id, chk: owner.checks.findIndex((it) => it.id === id) } : null;
    }

    entry(id) {
      if (!this.state.items[id]) this.state.items[id] = { status: 'todo', rev: 1, comments: [], at: 0 };
      return this.state.items[id];
    }

    // 한 장을 부르는 말 — 업데이트 일지가 있으면 고객 요청, 없으면(옛 검수 링크) 검수항목
    noun() {
      return this.spec && this.spec.log ? '요청' : '항목';
    }

    statusOf(u) {
      return unitStatus(u, this.state.items);
    }

    reqUnits() {
      return this.spec.units.filter((u) => u.kind !== 'send' && u.kind !== 'end');
    }

    endUnit() {
      return this.spec.units[this.spec.units.length - 1];
    }

    // 대시보드에 알리는 수 — 고객 요청 장들 + 고객에게 보낼 글. 모두 확인 완료면 서버가 고객 링크를 연다
    counts() {
      return unitCounts(this.spec, this.state.items, true);
    }

    reqCounts() {
      return unitCounts(this.spec, this.state.items, false);
    }

    // 다음에 볼 장 — 지금 장 뒤에서 아직 안 본 장, 없으면 앞에서, 다 봤으면 마지막 장
    nextOpen(from) {
      const list = this.reqUnits();
      const idx = from ? list.indexOf(from) : -1;
      const order = list.slice(idx + 1).concat(list.slice(0, Math.max(0, idx)));
      return order.find((u) => this.statusOf(u) === 'todo') || this.endUnit();
    }

    prevPlace() {
      const u = this.current();
      if (!u) return null;
      if (this.state.chk > 0) return { unit: u.id, chk: this.state.chk - 1 };
      const list = this.spec.units;
      const idx = list.indexOf(u);
      if (idx <= 0) return null;
      const p = list[idx - 1];
      return { unit: p.id, chk: Math.max(0, p.checks.length - 1) };
    }

    doc() {
      return this.shell ? this.shell.doc() : document;
    }

    href() {
      return this.shell ? this.shell.href() : location.href;
    }

    frameRect() {
      if (this.shell) return this.shell.rect();
      return { left: 0, top: 0, right: innerWidth, bottom: innerHeight, width: innerWidth, height: innerHeight };
    }

    name() {
      return local.text(NAME) || local.text('hffb-name') || '';
    }

    summary() {
      const c = this.counts();
      return {
        id: this.spec.id, round: this.spec.round, items: this.spec.items.length, units: c.all, todo: c.todo, needs: c.needs, done: c.done,
        current: this.state.cur, check: this.state.chk, frame: Boolean(this.shell),
      };
    }

    status() {
      const u = this.current();
      const it = this.check();
      return {
        id: this.spec.id,
        unit: u ? u.id : null,
        check: this.state.chk,
        item: it ? it.id : null,
        page: this.href(),
        marks: this.targets.map((t) => ({ kind: t.kind, step: t.step || null, label: t.label, found: Boolean(t.el), visible: Boolean(t.el && t.visible), matches: t.matches })),
      };
    }

    layout() {
      if (!this.shell || this.isPhone()) return 'full';
      if (this.state.view === 'mobile') return 'mobile';
      if (this.state.view === 'full') return 'full';
      return innerWidth >= SPLIT_MIN ? 'split' : 'full';
    }

    applyView() {
      const mode = this.layout();
      this.mode = mode;
      if (this.shell) this.shell.setLayout(mode);
      this.ui.mobile.hidden = !this.shell;
      this.ui.split.hidden = !this.shell || innerWidth < SPLIT_MIN || mode === 'mobile';
      this.ui.mobile.classList.toggle('on', mode === 'mobile');
      this.ui.split.classList.toggle('on', mode === 'split');
      this.ui.split.title = mode === 'split' ? '화면 위에 겹쳐 보기' : '사이트 옆에 나란히 보기';
      this.ui.box.classList.toggle('fold', Boolean(this.state.fold));
      // 나란히 보기 — 오른쪽 칸 전체가 박스. 버튼은 겹쳐 보기 때와 같은 오른쪽 아래에 남는다
      this.ui.box.classList.toggle('side', mode === 'split');
      if (mode === 'split') this.ui.box.classList.remove('left');
    }

    // 장(과 그 안의 확인)으로 옮긴다. 확인할 화면이 다르면 화면도 옮긴다 — 같은 주소는 이 창 안에서, 다른 주소(운영↔개발기)는 이 창이 통째로
    go(id, chk, opts) {
      const u = this.unit(id);
      if (!u) return;
      const o = opts || {};
      this.autoPos = false;
      if (u.id !== this.state.cur) {
        this.composing = false;
        this.draft = '';
        this.draftPin = null;
      }
      this.state.cur = u.id;
      this.state.chk = Math.max(0, Math.min(Number(chk) || 0, u.checks.length - 1));
      const it = u.checks[this.state.chk];
      if (it && it.url && !it.outside && (o.reload || pageKey(it.url) !== pageKey(this.href()))) {
        if (!sameOrigin(it.url)) {
          this.jump(it);
          return;
        }
        if (this.shell) {
          this.loadingSince = Date.now();
          this.shell.go(it.url);
        } else {
          this.save();
          local.put(ON, this.spec.id);
          this.toast('다른 화면으로 옮겨요');
          setTimeout(() => {
            location.href = it.url;
          }, 700);
          return;
        }
      }
      this.save();
      this.changed();
    }

    // 다른 주소 확인 — 새 창 대신 이 창이 옮겨 간다. 체크·말·이름을 주소 뒤(#)에 실어 보내고(대시보드에도 저장), 저쪽이 같은 자리에서 이어 띄운다
    async jump(it) {
      if (this.jumping) return;
      this.jumping = true;
      setTimeout(() => {
        this.jumping = false;
      }, 5000);
      this.save();
      this.changed();
      this.toast(`${placeName(it.url)} 화면으로 옮겨요`);
      const url = await this.carry(it);
      if (this.synced) await Promise.race([this.pushNow().catch(() => null), new Promise((r) => setTimeout(r, 1500))]);
      location.href = url;
    }

    changed() {
      this.targetsFor = '';
      this.targets = [];
      this.placed = 0;
      this.scrolled = false;
      this.itemSince = Date.now();
      this.navReset = true;
      this.applyView();
      this.render();
      this.tick();
    }

    renderAll() {
      this.render();
    }

    render() {
      if (!this.spec) return;
      const s = this.spec;
      const u = this.current();
      this.ui.title.textContent = s.title;
      this.ui.title.title = s.title;
      this.ui.round.hidden = s.round < 2;
      this.ui.round.textContent = `${s.round}회차`;
      const reqs = this.reqUnits();
      const n = u ? reqs.indexOf(u) : -1;
      this.ui.cnt.textContent = n >= 0 ? `${s.log ? '요청' : '검수'} ${n + 1}/${reqs.length}` : '마무리';
      this.renderStrip(u);
      this.renderProg(u);
      const focused = this.shadow.activeElement;
      const typing = focused && focused.dataset && focused.dataset.role === 'draft';
      const keep = this.navReset ? 0 : this.ui.body.scrollTop;
      this.navReset = false;
      this.ui.body.innerHTML = u ? this.bodyHtml(u) : '<p class="empty">검수할 것이 없어요.</p>';
      this.ui.body.scrollTop = keep;
      this.renderFoot(u);
      if (typing || this.focusDraft) {
        const ta = this.ui.body.querySelector('textarea[data-role="draft"]');
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
          if (this.focusDraft) attempt(() => ta.scrollIntoView({ block: 'nearest' }), null);
        }
        this.focusDraft = false;
      }
      this.fade(this.ui.body);
      this.updateSteps();
    }

    renderStrip(u) {
      const b = this.board || {};
      const h = b.handoff;
      let html = '';
      let ok = false;
      if (this.spec.board && b.round > this.spec.round && b.link) {
        html = `<span>AI가 고친 ${esc(b.round)}회차가 나왔어요</span><button class="lnk" type="button" data-act="next-round">${esc(b.round)}회차 열기 ›</button>`;
      } else if (this.spec.board && h && SAID[h.phase] && b.round === this.spec.round && !(u && (u.kind === 'send' || u.kind === 'end'))) {
        html = `${ACTIVE[h.phase] ? '<i class="live"></i>' : ''}<span>${esc(SAID[h.phase])}</span>${this.issueRef()}`;
        ok = h.phase === 'done';
      }
      this.ui.strip.innerHTML = html;
      this.ui.strip.hidden = !html;
      this.ui.strip.classList.toggle('ok', ok);
    }

    renderProg(u) {
      const list = this.spec.units;
      this.ui.prog.hidden = list.length < 3;
      if (this.ui.prog.hidden) return;
      this.ui.prog.innerHTML = list.map((x, i) => {
        const st = x.kind === 'end' ? 'todo' : this.statusOf(x);
        const name = x.kind === 'send' ? '마지막 · 고객에게 보낼 글' : x.kind === 'end' ? '마무리' : `${i + 1}. ${x.title}`;
        return `<button class="seg ${st}${x === u ? ' cur' : ''}" type="button" data-act="go" data-id="${esc(x.id)}" title="${esc(`${name} · ${STATUS[st]}`)}" aria-label="${esc(name)}"><i></i></button>`;
      }).join('');
    }

    bodyHtml(u) {
      if (u.kind === 'send' || u.kind === 'end') return this.endHtml(u);
      const s = this.spec;
      const st = this.statusOf(u);
      const reqs = this.reqUnits();
      const tag = u.kind === 'remain' ? '이번엔 못 한 요청' : u.kind === 'extra' ? '따로 확인할 것' : s.log ? '고객 요청' : '검수항목';
      const head = `<div class="uh"><span class="tag${u.kind === 'remain' ? ' rest' : ''}">${tag} ${reqs.indexOf(u) + 1} / ${reqs.length}</span>${st !== 'todo' ? `<span class="pill ${st}">${STATUS[st]}</span>` : ''}</div>`;
      const prep = s.prep.length ? `<details class="prep"${this.prepOpen ? ' open' : ''}><summary><b>준비</b>${esc(String(s.prep[0]).replace(/[`*]/g, ''))}</summary><ul>${s.prep.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></details>` : '';
      const ask = u.kind === 'req' || u.kind === 'remain' ? `<blockquote class="ask">${esc(u.title)}</blockquote>` : `<h3 class="ask">${inline(u.title)}</h3>`;
      const did = u.kind === 'req' && u.lines.length
        ? `<div class="sec"><h5>우리가 한 것<span class="mu">고객 일지에 이대로 나가요</span></h5><ul class="did">${u.lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
          + `${u.links.length ? `<div class="golinks">${u.links.map((l) => `<a class="ln" href="${esc(l.url)}" data-href="${esc(l.url)}">${esc(l.label)} ›</a>`).join('')}</div>` : ''}</div>`
        : '';
      const rest = u.kind === 'remain' ? '<p class="note">고객 일지 \'남은 부분\'에 이대로 나가요.</p>' : '';
      return head + prep + ask + did + rest + this.checkHtml(u) + this.threadHtml(u) + (this.composing ? this.composerHtml() : '');
    }

    checkHtml(u) {
      const k = this.state.chk;
      const it = u.checks[k];
      if (!it) return '';
      const total = u.checks.length;
      const here = Boolean(it.url) && !it.outside && sameOrigin(it.url);
      const away = Boolean(it.url) && !it.outside && !here;
      const marked = here && it.steps.some((x) => x.marks.length);
      const sub = [total > 1 ? `확인 ${k + 1} / ${total}` : '', marked ? '화면에 빨간 표시가 따라가요' : ''].filter(Boolean).join(' · ');
      const head = `<h5>이렇게 확인하세요${sub ? `<span class="mu">${sub}</span>` : ''}</h5>`;
      const title = u.kind === 'check' ? '' : `<b class="ct">${inline(it.title)}</b>`;
      const extra = `${it.env ? `<span>${inline(it.env)}</span>` : ''}${it.account ? `<span>${inline(it.account)}</span>` : ''}`;
      let where = '';
      if (it.url) {
        const addr = away ? `<span class="place">${esc(placeName(it.url))}</span><span class="mono">${esc(shortUrl(it.url))}</span>` : link(it.url, true);
        const again = here ? `<button class="tiny" type="button" data-act="reload" title="이 화면을 처음부터 다시 열어요">${ICON.reload}처음부터</button>` : '';
        where = `<div class="where">${addr}${again}${extra}</div>`;
      } else if (extra) {
        where = `<div class="where">${extra}</div>`;
      }
      const goto = away
        ? `<div class="goto"><button class="btn dark sm" type="button" data-act="jump">${esc(placeName(it.url))} 화면으로 가기 ›</button></div>`
        : it.outside && it.url ? `<div class="goto"><button class="btn dark sm" type="button" data-act="open-out">${ICON.out}새 창에서 열기</button></div>` : '';
      const sit = it.situation ? `<p class="sit">${inline(it.situation)}</p>` : '';
      const steps = it.steps.length ? `<ol class="steps">${it.steps.map((step, i) => {
        const mark = step.marks.length > 0 && here;
        return `<li class="st" data-step="${i + 1}" data-act="step"><span class="n${mark ? '' : ' nomark'}">${i + 1}</span><div class="tx">${inline(step.text)}`
          + `${step.copy ? `<div class="cpy"><pre>${esc(step.copy)}</pre><button type="button" data-act="copy" data-step="${i}">복사하기</button></div>` : ''}</div></li>`;
      }).join('')}</ol>` : '';
      const ai = it.ai ? this.aiHtml(it.ai) : '';
      return `<div class="sec">${head}<div class="chk">${title}${where}${goto}${sit}${steps}${ai}</div></div>`;
    }

    threadHtml(u) {
      const list = threadOf(u, this.state.items);
      if (!list.length) return '';
      return `<div class="th"><div class="thh">남긴 말</div>${list.map(({ c, owner }) => {
        const about = owner !== u.key ? this.item(owner) : c.check ? this.item(c.check) : null;
        return `<div class="msg${c.sys ? ' sys' : ''}"><div class="mh"><b>${esc(c.by || '검수자')}</b><span>${esc(when(c.at))}</span>`
          + `${c.sys ? '' : `<button class="del" type="button" data-act="del" data-owner="${esc(owner)}" data-cid="${esc(c.id)}" title="지우기" aria-label="지우기">×</button>`}</div>`
          + `<div class="mt">${inline(c.text)}</div>${about && u.checks.length > 1 ? `<span class="about">${esc(String(about.title).replace(/\*\*|`/g, ''))}</span>` : ''}`
          + `${c.pin ? `<button class="pin" type="button" data-act="pin-show" data-cid="${esc(c.id)}">${ICON.pin}${esc(c.pin.path)} · ${esc(c.pin.desc)}</button>` : ''}</div>`;
      }).join('')}</div>`;
    }

    composerHtml() {
      const nm = this.name();
      const pin = this.draftPin ? `<div class="draftpin">${ICON.pin}<span>${esc(this.draftPin.path)} · ${esc(this.draftPin.desc)}</span><button type="button" data-act="unpin">빼기</button></div>` : '';
      return `<div class="cp"><div class="thh">고칠 점</div><textarea data-role="draft" rows="3" placeholder="어디가 어떻게 다른지 적어 주세요">${esc(this.draft)}</textarea>${pin}`
        + `<div class="cpr"><button class="btn ghost sm" type="button" data-act="pick">${ICON.pin}화면에서 위치 찍기</button><span class="sp"></span>`
        + `${nm ? `<span class="me">${esc(nm)}<button type="button" data-act="rename">바꾸기</button></span>` : ''}</div></div>`;
    }

    dot(st) {
      return `<span class="dot ${st}" aria-label="${STATUS[st]}">${st === 'done' ? ICON.check : ''}</span>`;
    }

    endHtml(u) {
      const s = this.spec;
      const c = this.reqCounts();
      const sendSt = u.kind === 'send' ? this.statusOf(u) : 'todo';
      const head = `<div class="uh"><span class="tag">${u.kind === 'send' ? '마지막 · 고객에게 보낼 글' : '마무리'}</span>${sendSt !== 'todo' ? `<span class="pill ${sendSt}">${STATUS[sendSt]}</span>` : ''}</div>`;
      const tally = c.all ? `<div class="tally"><span class="t-done">확인 완료<b>${c.done}</b></span><span class="t-needs">고칠 것<b>${c.needs}</b></span><span>아직 안 봄<b>${c.todo}</b></span></div>` : '';
      const reqs = this.reqUnits();
      const needs = reqs.filter((x) => this.statusOf(x) === 'needs');
      const todo = reqs.filter((x) => this.statusOf(x) === 'todo');
      const row = (x) => {
        const first = freshOf(x, this.state.items)[0];
        const meta = first ? oneLine(first.c.text) : x.kind === 'remain' ? '이번엔 못 한 요청' : '';
        return `<button class="row" type="button" data-act="go" data-id="${esc(x.id)}">${this.dot(this.statusOf(x))}<span class="rt">${esc(x.title)}${meta ? `<span class="rm">${esc(meta)}</span>` : ''}</span></button>`;
      };
      const lists = (needs.length ? `<div class="sec"><h5>고칠 것 ${needs.length}</h5><div class="rows">${needs.map(row).join('')}</div></div>` : '')
        + (todo.length ? `<div class="sec"><h5>아직 안 본 것 ${todo.length}</h5><div class="rows">${todo.map(row).join('')}</div></div>` : '');
      const off = s.offscreen.length ? `<div class="sec"><h5>화면 밖에서 볼 것</h5><ul>${s.offscreen.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></div>` : '';
      const reg = s.regression.length ? `<details class="sec"><summary>AI가 따로 확인한 것 ${s.regression.length}</summary><ul>${s.regression.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></details>` : '';
      const preview = u.kind === 'send' && !needs.length && !todo.length ? this.sendHtml() : '';
      const thread = u.kind === 'send' ? this.threadHtml(u) : '';
      return head + tally + lists + off + preview + thread + (this.composing ? this.composerHtml() : '') + reg;
    }

    renderFoot(u) {
      const f = u ? this.foot(u) : { say: '' };
      this.ui.say.innerHTML = inline(f.say || '');
      this.ui.say.classList.toggle('live', Boolean(f.live));
      const back = f.noBack ? null : this.prevPlace();
      const btn = (x, cls) => (x ? `<button class="btn ${x[2]} ${cls}" type="button" data-act="${x[1]}">${esc(x[0])}</button>` : '');
      this.ui.acts.innerHTML = `${f.noBack ? '' : `<button class="btn outline back" type="button" data-act="back" title="이전" aria-label="이전"${back ? '' : ' disabled'}>‹</button>`}${btn(f.a, 'a')}${btn(f.b, 'b')}`;
    }

    // 박스 아래 — 지금 할 일 한 줄과 누를 버튼(왼쪽은 '고칠 게 있어요' 쪽, 오른쪽이 앞으로 가는 쪽)
    foot(u) {
      if (this.composing) return { say: '어디가 어떻게 다른지 적고 [남기기]를 눌러요. 화면에서 위치를 찍어도 돼요', a: ['취소', 'compose-cancel', 'ghost'], b: ['남기기', 'comment', 'red'], noBack: true };
      if (u.kind === 'send' || u.kind === 'end') return this.endFoot(u);
      const st = this.statusOf(u);
      const k = this.state.chk;
      const more = k < u.checks.length - 1;
      const it = u.checks[k];
      const last = this.nextOpen(u).kind === 'send' || this.nextOpen(u).kind === 'end';
      const onward = more ? ['다음 확인 ›', 'next-check', 'dark'] : [last ? '마무리로 ›' : `다음 ${this.noun()} ›`, 'next-unit', 'dark'];
      if (st === 'needs') return { say: more ? '고칠 것으로 남겼어요. 남은 확인도 봐 주세요' : '고칠 것으로 남겼어요. 다음으로 넘어가요', a: ['더 남기기', 'compose', 'outline'], b: onward };
      if (st === 'done') return { say: '확인을 마친 요청이에요', a: ['확인 취소', 'undo', 'outline'], b: onward };
      const fix = ['고칠 게 있어요', 'compose', 'outline'];
      if (it && it.url && !it.outside && !sameOrigin(it.url)) {
        const where = placeName(it.url);
        return { say: `이 확인은 ${where} 화면에서 해요`, a: fix, b: [`${where} 화면으로 가기 ›`, 'jump', 'dark'] };
      }
      const ok = more ? ['다음 확인 ›', 'next-check', 'ok'] : [last ? '맞아요 → 마무리' : `맞아요 → 다음 ${this.noun()}`, 'ok-unit', 'ok'];
      let say;
      if (u.kind === 'remain') say = '이번에 못 하는 게 맞고 까닭도 맞으면 [맞아요]';
      else if (!it) say = '고객에게 이대로 나가도 되면 [맞아요]';
      else if (it.outside) say = `[새 창에서 열기]로 확인하고 돌아와서 ${more ? '[다음 확인 ›]' : '[맞아요]'}`;
      else say = `${(!it.url || onSite(it)) && it.steps.some((x) => x.marks.length) ? '빨간 표시대로' : '위 순서대로'} 해 보고 ${more ? '맞으면 [다음 확인 ›]' : '다 맞으면 [맞아요]'}`;
      return { say, a: fix, b: ok };
    }

    endFoot(u) {
      const c = this.reqCounts();
      const all = this.counts();
      const b = this.board || {};
      const needs = all.needs;
      if (!this.spec.board) {
        if (c.todo) return { say: `아직 안 본 게 ${c.todo}개 있어요`, a: needs ? ['넘길 글 보기', 'export', 'outline'] : null, b: ['안 본 것부터 ›', 'first-todo', 'dark'] };
        return { say: needs ? `고칠 것 ${needs}개: 글을 복사해 이슈 댓글에 붙여 주세요` : '모두 확인했어요. 결과를 이슈 댓글에 남겨 주세요', b: ['AI에게 넘길 글 복사', 'export', 'red'] };
      }
      if (b.round > this.spec.round && b.link) return { say: `AI가 고친 ${b.round}회차가 나왔어요`, b: [`${b.round}회차 열기 ›`, 'next-round', 'red'] };
      const ph = this.phase();
      if (ph) return { say: `${SAID[ph]}. 다 고치면 여기에 다음 회차가 떠요`, live: true, b: ['대시보드에서 보기', 'open-issue', 'outline'] };
      if (c.todo) return { say: `아직 안 본 요청이 ${c.todo}개 있어요`, a: needs ? [`고칠 것 ${needs}개 먼저 보내기`, 'handoff', 'outline'] : null, b: ['안 본 요청 보기 ›', 'first-todo', 'dark'] };
      if (needs) return { say: `고칠 것 ${needs}개를 보내면 대시보드에 바로 등록되고 AI가 고쳐요`, b: [`고칠 것 ${needs}개 AI에게 보내기`, 'handoff', 'red'] };
      if (u.kind !== 'send') return { say: '모두 확인했어요', b: ['AI에게 알리기', 'handoff', 'outline'] };
      if (b.share_url) return { say: '고객 링크가 준비됐어요. 보낼 말과 링크를 복사해 고객에게 보내면 끝이에요', a: ['고객 화면 보기', 'preview', 'outline'], b: ['보낼 말·링크 복사', 'copy-share', 'ok'] };
      if (this.statusOf(u) === 'done' || this.making) return { say: '고객 링크를 만드는 중이에요', live: true, b: ['다시 만들기', 'make-link', 'ok'] };
      return { say: '고객에게 이렇게 나가요. 이대로 보내도 되면 [고객 링크 만들기]', a: ['글 고칠 게 있어요', 'compose', 'outline'], b: ['고객 링크 만들기', 'make-link', 'ok'] };
    }

    aiHtml(ai) {
      const result = String(ai.result || '');
      const cls = /어긋/.test(result) ? 'bad' : /못/.test(result) ? 'na' : 'ok';
      const lines = toList(ai.lines);
      return `<details class="ai ${cls}"><summary>AI 확인 · ${esc(result || '기록 있음')}${ai.at ? ` · ${esc(ai.at)}` : ''}</summary>${lines.length ? `<ul>${lines.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>` : ''}</details>`;
    }

    buildTargets() {
      const u = this.current();
      const it = this.check();
      const thread = u ? threadOf(u, this.state.items) : [];
      const key = u ? `${u.id}|${this.state.chk}|${thread.length}` : '';
      if (key === this.targetsFor) return;
      this.targetsFor = key;
      this.targets = [];
      if (!u) return;
      if (it && (!it.url || onSite(it))) {
        it.steps.forEach((step, k) => step.marks.forEach((mark) => {
          this.targets.push({ kind: 'step', step: k + 1, mark, label: mark.label ? `${k + 1} ${mark.label}` : String(k + 1), el: null, matches: 0 });
        }));
      }
      thread.forEach(({ c }) => {
        if (c.pin) this.targets.push({ kind: 'pin', cid: c.id, page: c.pin.page, mark: { selector: c.pin.selector, text: c.pin.text }, label: '댓글', el: null, matches: 0 });
      });
    }

    tick() {
      if (!this.spec) return;
      const doc = this.doc();
      if (doc !== this.docSeen) {
        this.docSeen = doc;
        this.prepareDoc(doc);
        this.targets.forEach((t) => {
          t.el = null;
        });
      } else if (doc) {
        this.ensureHide(doc);
      }
      this.buildTargets();
      if (this.loadingSince && Date.now() - this.loadingSince > 15000) this.loadingSince = 0;
      if (doc && !this.loadingSince) {
        const here = pageKey(this.href());
        const now = Date.now();
        const ctx = { text: null };
        this.targets.forEach((t) => {
          if (t.kind === 'pin' && pageKey(t.page) !== here) {
            t.el = null;
            t.matches = 0;
            return;
          }
          if (t.el && isShown(t.el)) return;
          if (!t.el && t.searched && now - t.searched < 1300) return;
          t.searched = now;
          let found = findMark(doc, t.mark, ctx);
          if (!found.el && t.kind === 'pin' && t.mark.text) found = findMark(doc, { text: t.mark.text }, ctx);
          t.el = found.el;
          t.matches = found.matches;
        });
      } else if (this.loadingSince) {
        this.targets.forEach((t) => {
          t.el = null;
        });
      }
      this.updateSteps();
      this.draw();
      this.autoScroll();
      const href = this.href();
      if (href && href !== this.lastHref) {
        this.lastHref = href;
        this.save();
      }
    }

    prepareDoc(doc) {
      if (!doc) return;
      this.ensureHide(doc);
      const win = doc.defaultView;
      if (!doc.qaReviewBound && win) {
        doc.qaReviewBound = true;
        if (doc !== document) {
          doc.addEventListener('scroll', this.onScroll, true);
          win.addEventListener('resize', this.onScroll);
          doc.addEventListener('keydown', this.onKey, true);
        }
      }
    }

    ensureHide(doc) {
      if (!this.spec.hide.length || !doc || !doc.documentElement || doc.getElementById('qa-review-hide')) return;
      const style = doc.createElement('style');
      style.id = 'qa-review-hide';
      style.textContent = this.spec.hide.map((sel) => `${sel}{display:none!important}`).join('\n');
      (doc.head || doc.documentElement).appendChild(style);
    }

    updateSteps() {
      this.ui.body.querySelectorAll('.st').forEach((li) => {
        const step = Number(li.dataset.step);
        const mine = this.targets.filter((t) => t.kind === 'step' && t.step === step);
        if (!mine.length) return;
        li.classList.toggle('on', mine.some((t) => t.el && t.visible));
      });
    }

    fade(el) {
      el.classList.toggle('fadeout', el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    }

    covered(el, rect) {
      const doc = el.ownerDocument;
      const points = [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.25, 0.72], [0.75, 0.72]];
      let tested = 0;
      for (let i = 0; i < points.length; i += 1) {
        const x = rect.left + (rect.right - rect.left) * points[i][0];
        const y = rect.top + (rect.bottom - rect.top) * points[i][1];
        const hitEl = doc === document
          ? attempt(() => document.elementsFromPoint(x, y).find((n) => n !== this.host) || null, null)
          : attempt(() => doc.elementFromPoint(x, y), null);
        if (hitEl) {
          tested += 1;
          if (hitEl === el || el.contains(hitEl) || hitEl.contains(el)) return false;
        }
      }
      return tested > 0;
    }

    schedule() {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => {
        this.raf = 0;
        this.draw();
      });
    }

    draw() {
      if (!this.spec) return;
      const off = this.frameRect();
      const view = { left: off.left, top: off.top, right: off.right, bottom: off.bottom };
      const groups = new Map();
      this.targets.forEach((t) => {
        if (!t.el || !t.el.isConnected) return;
        const g = groups.get(t.el) || { el: t.el, labels: [], pin: true, flash: false };
        g.labels.push(t.label);
        if (t.kind !== 'pin') g.pin = false;
        if (t.flash && t.flash > Date.now()) g.flash = true;
        groups.set(t.el, g);
      });
      const list = [];
      const seen = new Set();
      groups.forEach((g) => {
        const r = contentRect(g.el);
        if (!r.width && !r.height) return;
        const clip = clipBox(g.el);
        const shownPart = intersect(r, clip);
        if (!shownPart) return;
        const win = viewOf(g.el);
        const onScreen = intersect(shownPart, { left: 0, top: 0, right: win.innerWidth, bottom: win.innerHeight });
        if (!onScreen || this.covered(g.el, onScreen)) return;
        const o = intersect({ left: r.left - 4, top: r.top - 4, right: r.right + 4, bottom: r.bottom + 4 }, clip);
        if (!o) return;
        const box = intersect({ left: o.left + off.left, top: o.top + off.top, right: o.right + off.left, bottom: o.bottom + off.top }, view);
        if (!box) return;
        seen.add(g.el);
        list.push(Object.assign(g, { box }));
      });
      let changed = false;
      this.targets.forEach((t) => {
        const visible = Boolean(t.el && seen.has(t.el));
        if (visible !== Boolean(t.visible)) changed = true;
        t.visible = visible;
      });
      if (changed) this.updateSteps();
      const nodes = this.markNodes || (this.markNodes = []);
      while (nodes.length < list.length) {
        const d = document.createElement('div');
        const b = document.createElement('span');
        this.ui.marks.append(d, b);
        nodes.push({ d, b });
      }
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const boxes = list.map((g) => g.box);
      const badges = [];
      const rects = [];
      nodes.forEach((n, i) => {
        const g = list[i];
        n.d.hidden = !g;
        n.b.hidden = !g;
        if (!g) return;
        const { box } = g;
        n.d.className = `mk${g.pin ? ' cm' : ''}${g.flash ? ' flash' : ''}`;
        n.d.style.cssText = `left:${box.left}px;top:${box.top}px;width:${box.right - box.left}px;height:${box.bottom - box.top}px`;
        const label = g.labels.join(' · ');
        if (n.b.textContent !== label) n.b.textContent = label;
        n.b.className = `mb${g.pin ? ' cm' : ''}`;
        const bw = n.b.offsetWidth || label.length * 8 + 16;
        const bh = 20;
        const key = `${Math.round(box.left)},${Math.round(box.top)},${Math.round(box.right)},${Math.round(box.bottom)},${label},${list.length}`;
        let spot = n.key === key ? n.spot : null;
        if (!spot) {
          const midY = box.top + (box.bottom - box.top - bh) / 2;
          const spots = [
            { left: box.left - 2, top: box.top - bh / 2 - 1 },
            { left: box.right + 6, top: midY },
            { left: box.left, top: box.top - bh - 4 },
            { left: box.left - bw - 6, top: midY },
            { left: box.left - 2, top: box.bottom - bh / 2 + 1 },
            { left: box.left, top: box.bottom + 4 },
            { left: box.right - bw + 2, top: box.top - bh / 2 - 1 },
          ].map((s) => ({ left: s.left, top: s.top, right: s.left + bw, bottom: s.top + bh }));
          const doc = g.el.ownerDocument;
          const score = (s, k) => {
            let total = k * 0.5;
            if (s.left < view.left + 2 || s.top < view.top + 2 || s.right > view.right - 2 || s.bottom > view.bottom - 2) total += 100;
            boxes.forEach((other, j) => {
              if (j !== i && hit(s, other)) total += 6;
            });
            badges.forEach((other) => {
              if (hit(s, other)) total += 30;
            });
            [s.top + 4, s.top + bh / 2, s.bottom - 4].forEach((py) => {
              [s.left + 5, (s.left + s.right) / 2, s.right - 5].forEach((px) => {
                if (textAt(doc, px - off.left, py - off.top)) total += 4;
              });
            });
            return total;
          };
          spot = spots.map((s, k) => ({ s, v: score(s, k) })).sort((a, b) => a.v - b.v)[0].s;
          n.key = key;
          n.spot = spot;
        }
        const left = Math.min(Math.max(spot.left, view.left + 2), view.right - bw - 2);
        const top = Math.min(Math.max(spot.top, view.top + 2), view.bottom - bh - 2);
        n.b.style.left = `${left}px`;
        n.b.style.top = `${top}px`;
        badges.push({ left, top, right: left + bw, bottom: top + bh });
        rects.push(box, badges[badges.length - 1]);
      });
      this.markRects = rects;
      this.placeCards();
    }

    // 겹쳐 보기에서 박스가 빨간 표시를 가리면 반대쪽으로 옮긴다(나란히 보기·폰은 그대로)
    placeCards() {
      if (this.markRects.length <= this.placed || this.isPhone() || this.mode === 'split') return;
      this.placed = this.markRects.length;
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const covered = (rect) => this.markRects.filter((m) => hit(m, rect)).length;
      const box = this.ui.box.getBoundingClientRect();
      const now = covered(box);
      if (!now) return;
      const left = this.ui.box.classList.contains('left');
      const other = left
        ? { left: innerWidth - 12 - box.width, right: innerWidth - 12, top: box.top, bottom: box.bottom }
        : { left: 12, right: 12 + box.width, top: box.top, bottom: box.bottom };
      if (covered(other) < now) this.ui.box.classList.toggle('left', !left);
    }

    autoScroll() {
      if (this.scrolled) return;
      if (Date.now() - this.itemSince > 9000) {
        this.scrolled = true;
        return;
      }
      const found = this.targets.filter((t) => t.kind === 'step' && t.el);
      if (!found.length) return;
      this.scrolled = true;
      const visible = found.some((t) => {
        const r = t.el.getBoundingClientRect();
        const w = viewOf(t.el);
        return r.bottom > 0 && r.top < w.innerHeight && r.right > 0 && r.left < w.innerWidth;
      });
      if (!visible) attempt(() => found[0].el.scrollIntoView({ block: 'center' }), null);
    }

    click(e) {
      const a = e.target.closest('a.ln');
      if (a) {
        e.preventDefault();
        this.openUrl(a.dataset.href || a.getAttribute('href'));
        return;
      }
      const el = e.target.closest('[data-act]');
      if (!el || el.disabled) return;
      const act = el.dataset.act;
      const u = this.current();
      // 사람이 박스를 만지기 시작했으면 대시보드 기록이 늦게 와도 자리를 옮기지 않는다(쓰던 말이 날아가지 않게)
      this.autoPos = false;
      if (act === 'fold') {
        this.state.fold = !this.state.fold;
        this.applyView();
        this.save();
        this.schedule();
      } else if (act === 'mobile' || act === 'split') {
        if (act === 'mobile') this.state.view = this.state.view === 'mobile' ? 'auto' : 'mobile';
        else this.state.view = this.mode === 'split' ? 'full' : 'auto';
        this.applyView();
        this.save();
        this.placed = 0;
        const said = { mobile: '휴대폰 폭(390px)으로 보고 있어요', split: '사이트 옆에 나란히 보고 있어요. 빨간 표시를 가리지 않아요', full: '사이트 위에 겹쳐 보고 있어요' };
        this.toast(said[this.mode]);
        setTimeout(() => this.tick(), 120);
      } else if (act === 'close') {
        this.confirm('검수를 닫을까요?', this.spec.board ? '확인한 것과 남긴 말은 대시보드에도 저장돼 있어요. 검수 링크를 다시 열면 이어서 볼 수 있어요.' : '확인한 것과 남긴 말은 이 브라우저에 남아 있어요. 검수 링크를 다시 열면 이어서 볼 수 있어요.', '닫기', () => this.destroy());
      } else if (act === 'go') {
        this.go(el.dataset.id, 0);
      } else if (act === 'back') {
        const p = this.prevPlace();
        if (p) this.go(p.unit, p.chk);
      } else if (act === 'next-check') {
        if (u) this.go(u.id, this.state.chk + 1);
      } else if (act === 'next-unit') {
        const n = this.nextOpen(u);
        if (n) this.go(n.id, 0);
      } else if (act === 'first-todo') {
        const n = this.nextOpen(null);
        if (n) this.go(n.id, 0);
      } else if (act === 'ok-unit') {
        this.okUnit();
      } else if (act === 'undo') {
        this.undo();
      } else if (act === 'compose') {
        this.composing = true;
        this.focusDraft = true;
        this.render();
      } else if (act === 'compose-cancel') {
        this.composing = false;
        this.draft = '';
        this.draftPin = null;
        this.render();
      } else if (act === 'comment') {
        this.comment();
      } else if (act === 'jump') {
        const it = this.check();
        if (it && it.url) this.jump(it);
      } else if (act === 'make-link') {
        this.makeLink();
      } else if (act === 'export') {
        this.exportModal();
      } else if (act === 'handoff') {
        this.sendToAi();
      } else if (act === 'next-round') {
        this.openRound();
      } else if (act === 'open-issue') {
        const url = this.board && this.board.issue && this.board.issue.url;
        if (url) window.open(url, '_blank', 'noopener');
      } else if (act === 'share') {
        this.showShare();
      } else if (act === 'copy-share') {
        if (this.board && this.board.share_url) this.copy(this.shareText(), '복사했어요. 고객 카톡·문자에 그대로 붙여 넣으면 돼요');
      } else if (act === 'copy-link') {
        if (this.board && this.board.share_url) this.copy(this.board.share_url, '링크를 복사했어요');
      } else if (act === 'preview') {
        if (this.board && this.board.share_url) window.open(`${this.board.share_url}?preview=1`, '_blank', 'noopener');
      } else if (act === 'reload') {
        if (u) this.go(u.id, this.state.chk, { reload: true });
      } else if (act === 'open-out') {
        const it = this.check();
        if (it && it.url) window.open(it.url, '_blank', 'noopener');
      } else if (act === 'step') {
        this.focusStep(Number(el.dataset.step));
      } else if (act === 'copy') {
        const it = this.check();
        const step = it && it.steps[Number(el.dataset.step)];
        if (step && step.copy) this.copy(step.copy, '복사했어요. 화면의 입력칸에 붙여 넣어 주세요');
      } else if (act === 'del') {
        this.deleteComment(el.dataset.owner, el.dataset.cid);
      } else if (act === 'pick') {
        this.startPick();
      } else if (act === 'unpin') {
        this.draftPin = null;
        this.render();
      } else if (act === 'pin-show') {
        this.showPin(el.dataset.cid);
      } else if (act === 'rename') {
        this.askName(() => this.render(), true);
      } else if (act === 'modal-cancel') {
        this.closeModal(true);
      } else if (act === 'modal-ok') {
        this.finishModal();
      } else if (act === 'modal-copy') {
        const ta = this.ui.modal.querySelector('textarea');
        if (ta) this.copy(ta.value, '복사했어요. 이슈 댓글에 붙여 넣고 "댓글 단 거 고쳐줘"라고 적어 주세요');
      }
    }

    key(e) {
      if (e.key !== 'Escape') return;
      if (this.picking) {
        e.preventDefault();
        this.stopPick();
        this.toast('위치 찍기를 그만뒀어요');
      } else if (!this.ui.mbg.hidden) {
        e.preventDefault();
        this.closeModal(true);
      }
    }

    openUrl(url) {
      if (!url) return;
      if (sameOrigin(url) && this.shell) {
        this.shell.go(url);
        return;
      }
      if (sameOrigin(url)) {
        location.href = url;
        return;
      }
      window.open(url, '_blank', 'noopener');
    }

    focusStep(step) {
      const mine = this.targets.filter((t) => t.kind === 'step' && t.step === step && t.el);
      if (!mine.length) {
        const it = this.check();
        const s = it && it.steps[step - 1];
        this.toast(s && s.marks.length ? '아직 화면에 없어요. 앞 단계를 하면 나타나요' : '이 단계는 화면에 표시할 곳이 없어요');
        return;
      }
      attempt(() => mine[0].el.scrollIntoView({ block: 'center', behavior: 'smooth' }), null);
      const until = Date.now() + 1900;
      mine.forEach((t) => {
        t.flash = until;
      });
      setTimeout(() => this.draw(), 350);
      setTimeout(() => this.draw(), 2000);
    }

    // [맞아요] — 이 요청은 확인 완료, 다음 안 본 요청으로
    okUnit() {
      const u = this.current();
      if (!u) return;
      const now = Date.now();
      const by = this.name();
      Object.assign(this.entry(u.key), { status: 'done', at: now, by });
      if (u.kind === 'req' || u.kind === 'extra') {
        u.checks.forEach((it) => {
          const x = this.entry(it.id);
          if (x.status !== 'done') Object.assign(x, { status: 'done', at: now, by });
        });
      }
      this.composing = false;
      this.save();
      const next = this.nextOpen(u);
      this.toast(next.kind === 'send' || next.kind === 'end' ? '확인 완료 · 마무리만 남았어요' : `확인 완료 · 다음 ${this.noun()}이에요`);
      this.go(next.id, 0);
    }

    undo() {
      const u = this.current();
      if (!u) return;
      Object.assign(this.entry(u.key), { status: freshOf(u, this.state.items).length ? 'needs' : 'todo', at: Date.now() });
      this.save();
      this.render();
      this.toast('확인을 취소했어요');
    }

    comment() {
      const u = this.current();
      if (!u) return;
      const ta = this.ui.body.querySelector('textarea[data-role="draft"]');
      const text = String(ta ? ta.value : this.draft).trim();
      if (!text) {
        this.toast('고칠 점을 적어 주세요');
        if (ta) ta.focus();
        return;
      }
      this.draft = text;
      this.askName(() => {
        const e = this.entry(u.key);
        const it = this.check();
        const c = { id: uid(), by: this.name() || '검수자', at: Date.now(), round: this.spec.round, text, pin: this.draftPin || null };
        if (it && u.kind !== 'check') c.check = it.id;
        e.comments = (e.comments || []).concat([c]);
        e.status = 'needs';
        e.at = Date.now();
        this.draft = '';
        this.draftPin = null;
        this.composing = false;
        this.targetsFor = '';
        this.save();
        this.render();
        this.tick();
        this.toast('고칠 것으로 남겼어요');
      });
    }

    deleteComment(owner, cid) {
      if (!owner || !cid) return;
      this.confirm('이 말을 지울까요?', '지운 말은 AI에게 보내는 글에서도 빠져요.', '지우기', () => {
        const e = this.entry(owner);
        e.comments = (e.comments || []).filter((cm) => cm.id !== cid);
        e.del = Array.from(new Set([].concat(e.del || [], [cid])));
        e.at = Date.now();
        if (e.status === 'needs' && !freshComments(e).length) e.status = 'todo';
        const u = this.current();
        if (u && owner === u.key && e.status === 'todo' && freshOf(u, this.state.items).length) e.status = 'needs';
        this.targetsFor = '';
        this.save();
        this.render();
        this.tick();
        this.toast('지웠어요');
      });
    }

    // [고객 링크 만들기] — 고객에게 보낼 글까지 확인 완료로 저장하면 대시보드가 고객 링크를 연다
    makeLink() {
      const u = this.current();
      if (!this.spec.board || !u || u.kind !== 'send' || this.making) return;
      this.askName(async () => {
        this.making = true;
        Object.assign(this.entry(SEND), { status: 'done', at: Date.now(), by: this.name() });
        this.save();
        this.render();
        if (!this.synced) await this.serverLoad(false);
        if (this.synced) await this.pushNow();
        if (!(this.board && this.board.share_url)) {
          const res = await this.call('POST', '/release');
          if (res.ok && res.data) this.setBoard(res.data);
        }
        this.making = false;
        this.render();
        if (!(this.board && this.board.share_url)) this.toast('고객 링크를 만들지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요');
      });
    }

    askName(next, force) {
      if (!force && (this.name() || session.text('qa-review-name-later'))) {
        next();
        return;
      }
      this.modal(`<h3>담당자님 이름을 입력해주세요</h3><p>댓글과 검수완료 기록에 이 이름이 붙어요.</p><input type="text" maxlength="40" placeholder="이름" value="${esc(this.name())}">`
        + `<div class="mr"><button class="btn ghost sm" type="button" data-act="modal-cancel">${force ? '취소' : '나중에'}</button><button class="btn dark sm" type="button" data-act="modal-ok">확인</button></div>`);
      const input = this.ui.modal.querySelector('input');
      this.modalValidate = () => {
        if (input && input.value.trim()) return true;
        this.toast('담당자님 이름을 입력해주세요');
        if (input) input.focus();
        return false;
      };
      this.modalDone = () => {
        local.put(NAME, input.value.trim());
        next();
      };
      this.modalCancel = force ? null : () => {
        session.put('qa-review-name-later', '1');
        next();
      };
      if (input) {
        input.focus();
        input.select();
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.finishModal();
          }
        });
      }
    }

    confirm(title, body, okLabel, done) {
      this.modal(`<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="mr"><button class="btn ghost sm" type="button" data-act="modal-cancel">취소</button><button class="btn red sm" type="button" data-act="modal-ok">${esc(okLabel)}</button></div>`);
      this.modalDone = done;
    }

    exportModal(reason) {
      const text = buildExport(this.spec, this.state, this.name());
      const c = this.counts();
      const lead = reason
        ? `${esc(reason)} 아래 글을 복사해서 대시보드 이슈 댓글에 붙여 넣어 주세요.`
        : `아래 글을 복사해서 이슈 댓글에 붙여 넣고 "댓글 단 거 다 고쳐줘"라고 적어 주세요. 고칠 것 ${c.needs}개를 고치고, 확인 완료 ${c.done}개는 그대로 둬요.`;
      this.modal(`<h3>AI에게 넘기기</h3><p>${lead}</p>`
        + `<textarea readonly>${esc(text)}</textarea><div class="mr"><button class="btn ghost sm" type="button" data-act="modal-cancel">닫기</button><button class="btn red sm" type="button" data-act="modal-copy">복사하기</button></div>`);
      const ta = this.ui.modal.querySelector('textarea');
      if (ta) ta.addEventListener('focus', () => ta.select());
    }

    modal(html) {
      this.modalDone = null;
      this.modalCancel = null;
      this.modalValidate = null;
      this.ui.modal.innerHTML = html;
      this.ui.mbg.hidden = false;
    }

    finishModal() {
      if (this.modalValidate && !this.modalValidate()) return;
      const done = this.modalDone;
      this.closeModal(false);
      if (done) done();
    }

    closeModal(cancelled) {
      const cancel = cancelled && !this.ui.mbg.hidden ? this.modalCancel : null;
      this.ui.mbg.hidden = true;
      this.ui.modal.innerHTML = '';
      this.modalDone = null;
      this.modalCancel = null;
      this.modalValidate = null;
      if (cancel) cancel();
    }

    copy(text, message) {
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
        document.documentElement.appendChild(ta);
        ta.select();
        const ok = attempt(() => document.execCommand('copy'), false);
        ta.remove();
        this.toast(ok ? message : '복사하지 못했어요. 글을 길게 눌러 직접 복사해 주세요');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => this.toast(message), fallback);
      } else {
        fallback();
      }
    }

    startPick() {
      this.picking = true;
      this.pickEl = null;
      this.ui.pick.hidden = false;
      this.ui.pickbox.hidden = true;
      this.ui.picktag.hidden = true;
    }

    stopPick() {
      this.picking = false;
      this.pickEl = null;
      this.ui.pick.hidden = true;
    }

    elementAt(x, y) {
      if (this.shell) {
        const r = this.shell.rect();
        const doc = this.shell.doc();
        if (!doc || x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
        return doc.elementFromPoint(x - r.left, y - r.top);
      }
      return document.elementsFromPoint(x, y).find((el) => el !== this.host && el !== document.documentElement && el !== document.body) || null;
    }

    pickTarget(x, y) {
      const el = this.elementAt(x, y);
      if (!el) return null;
      return el.closest(CLICKABLE) || el.closest(MEANINGFUL) || el;
    }

    pickMove(e) {
      const el = this.pickTarget(e.clientX, e.clientY);
      this.pickEl = el;
      if (!el) {
        this.ui.pickbox.hidden = true;
        this.ui.picktag.hidden = true;
        return;
      }
      const off = this.frameRect();
      const r = el.getBoundingClientRect();
      const left = r.left + off.left;
      const top = r.top + off.top;
      Object.assign(this.ui.pickbox.style, { left: `${left - 3}px`, top: `${top - 3}px`, width: `${r.width + 6}px`, height: `${r.height + 6}px` });
      this.ui.pickbox.hidden = false;
      this.ui.picktag.textContent = `${this.describe(el).desc} · 누르면 여기에 댓글`;
      Object.assign(this.ui.picktag.style, { left: `${Math.max(4, left - 3)}px`, top: `${top - 27 < 4 ? top + r.height + 6 : top - 27}px` });
      this.ui.picktag.hidden = false;
    }

    pickClick(e) {
      e.preventDefault();
      const el = this.pickTarget(e.clientX, e.clientY);
      this.stopPick();
      if (!el) return;
      this.draftPin = this.describe(el);
      this.composing = true;
      this.focusDraft = true;
      this.render();
      this.toast('위치를 붙였어요. 고칠 점을 적고 [남기기]를 눌러 주세요');
    }

    describe(el) {
      const tag = el.tagName.toLowerCase();
      const label = String(el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('placeholder') || el.getAttribute('title') || textOf(el) || '')
        .replace(/\s+/g, ' ').trim();
      const kind = KIND[tag] || '요소';
      const href = this.href();
      return {
        page: href,
        path: shortUrl(href),
        selector: selectorFor(el),
        text: label.slice(0, 60),
        desc: `${kind}${label ? ` '${label.length > 28 ? `${label.slice(0, 27)}…` : label}'` : ''}`,
      };
    }

    showPin(cid) {
      const target = this.targets.find((t) => t.kind === 'pin' && t.cid === cid);
      if (target && target.el) {
        attempt(() => target.el.scrollIntoView({ block: 'center', behavior: 'smooth' }), null);
        target.flash = Date.now() + 1900;
        setTimeout(() => this.draw(), 350);
        setTimeout(() => this.draw(), 2000);
        return;
      }
      const u = this.current();
      const hit = u ? threadOf(u, this.state.items).find((x) => x.c.id === cid) : null;
      const cm = hit && hit.c;
      if (cm && cm.pin && pageKey(cm.pin.page) !== pageKey(this.href())) {
        if (sameOrigin(cm.pin.page)) {
          this.openUrl(cm.pin.page);
          this.toast('그 말을 남긴 화면으로 옮겨요');
        } else {
          this.toast(`${placeName(cm.pin.page)} 화면에서 남긴 말이에요`);
        }
        return;
      }
      this.toast('지금 화면에서 그 자리를 찾지 못했어요');
    }

    // ───────── 대시보드 연결 (2.1.0) ─────────

    async call(method, path, body) {
      const b = this.spec && this.spec.board;
      if (!b) return { ok: false, status: 0, data: null, message: '' };
      const payload = body ? JSON.stringify(body) : undefined;
      try {
        const res = await fetch(`${b.api}/public/qa/${encodeURIComponent(b.key)}${path}`, {
          method,
          cache: 'no-store',
          headers: payload ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
          body: payload,
          keepalive: Boolean(payload && payload.length < 60000),
        });
        const json = await res.json().catch(() => null);
        return { ok: res.ok, status: res.status, data: (json && json.data) || null, message: (json && json.message) || '' };
      } catch (e) {
        return { ok: false, status: 0, data: null, message: '' };
      }
    }

    async serverLoad(first) {
      if (!this.spec || !this.spec.board || this.loadingBoard) return;
      const id = this.spec.id;
      const round = this.spec.round;
      this.loadingBoard = true;
      const res = await this.call('GET', '');
      this.loadingBoard = false;
      this.polledAt = Date.now();
      if (!this.spec || this.spec.id !== id || this.spec.round !== round) return;
      if (!res.ok || !res.data) {
        if (first && res.status === 404) this.toast('대시보드에서 이 검수를 찾지 못했어요. 체크는 이 브라우저에만 저장돼요');
        return;
      }
      if (res.data.round > this.spec.round) {
        // 새 회차가 이미 나왔다 — 옛 회차 체크로 서버를 덮지 않는다
        this.stale = true;
        this.setBoard(res.data);
        return;
      }
      this.synced = true;
      const remote = res.data.state && res.data.state.items;
      if (remote && typeof remote === 'object') {
        const before = JSON.stringify(this.state.items);
        const combined = {};
        new Set(Object.keys(this.state.items).concat(Object.keys(remote))).forEach((key) => {
          combined[key] = pickEntry(this.state.items[key], remote[key]);
        });
        this.state.items = merge(this.spec, { items: combined }).items;
        if (JSON.stringify(this.state.items) !== before) {
          this.targetsFor = '';
          this.save();
          this.renderAll();
        }
      }
      // 처음 여는 브라우저 — 저절로 고른 첫 자리가 다른 사람이 이미 본 요청이면, 아직 안 본 요청으로 옮긴다
      if (this.autoPos) {
        this.autoPos = false;
        const u = this.current();
        const n = u && this.statusOf(u) !== 'todo' ? this.nextOpen(null) : null;
        if (n && n !== u) this.settle(n);
      }
      this.setBoard(res.data);
      this.pushSoon(300);
    }

    // 자리만 옮긴다 — 같은 주소 화면이면 창 안에서 옮기고, 다른 주소(운영↔개발기)면 저절로 넘어가지 않고 [… 화면으로 가기]를 띄운다
    settle(n) {
      this.composing = false;
      this.state.cur = n.id;
      this.state.chk = 0;
      const it = n.checks[0];
      if (this.shell && it && it.url && !it.outside && sameOrigin(it.url) && pageKey(it.url) !== pageKey(this.href())) {
        this.loadingSince = Date.now();
        this.shell.go(it.url);
      }
      this.save();
      this.changed();
    }

    pushSoon(delay) {
      if (!this.synced || this.stale || !this.spec || !this.spec.board) return;
      if (JSON.stringify(this.state.items) === this.pushedSig) return;
      const c = this.counts();
      clearTimeout(this.pushTimer);
      this.pushTimer = setTimeout(() => this.pushNow(), delay != null ? delay : c.all && c.done === c.all ? 150 : 1200);
    }

    async pushNow() {
      clearTimeout(this.pushTimer);
      if (!this.synced || this.stale || !this.spec || !this.spec.board) return null;
      const sig = JSON.stringify(this.state.items);
      if (sig === this.pushedSig) return null;
      const c = this.counts();
      this.pushedSig = sig;
      const res = await this.call('PUT', '/state', { state: { items: this.state.items }, round: this.spec.round, counts: { total: c.all, done: c.done, needs: c.needs } });
      if (res.ok) {
        this.setBoard(res.data);
      } else if (res.status === 409 && res.data) {
        this.stale = true;
        this.setBoard(res.data);
      } else if (this.pushedSig === sig) {
        this.pushedSig = '';
      }
      return res;
    }

    poll() {
      if (!this.spec || !this.spec.board || this.loadingBoard || document.hidden) return;
      const every = this.phase() || this.sending ? 8000 : this.synced || this.stale ? 45000 : 20000;
      if (Date.now() - (this.polledAt || 0) < every) return;
      this.serverLoad(false);
    }

    setBoard(data) {
      if (!data) return;
      const prev = this.board || {};
      const next = Object.assign({}, prev, data);
      delete next.state;
      this.board = next;
      const known = prev.round != null;
      const ph = next.handoff ? next.handoff.phase : '';
      const before = prev.handoff ? prev.handoff.phase : '';
      if (known && next.round > this.spec.round && next.link && !(prev.round > this.spec.round)) {
        this.toast(`AI가 고친 ${next.round}회차가 나왔어요`);
      } else if (known && before && ph && ph !== before) {
        const say = { running: 'AI가 고치기 시작했어요', question: 'AI가 물어볼 게 있어요 · 대시보드 이슈를 봐 주세요', done: 'AI가 일을 끝냈어요', failed: 'AI 작업이 멈췄어요 · 대시보드 이슈를 봐 주세요', blocked: 'AI가 착수하지 못했어요 · 대시보드 이슈를 봐 주세요' }[ph];
        if (say) this.toast(say);
      }
      const sig = JSON.stringify([next.round, next.link, ph, next.share_url, next.viewed_at, next.message, next.log ? 1 : 0]);
      if (sig !== this.boardSig) {
        this.boardSig = sig;
        this.render();
      }
      if (known && !prev.share_url && next.share_url) setTimeout(() => this.showShare(), 450);
    }

    phase() {
      const b = this.board;
      const h = b && b.handoff;
      if (!h || b.round > this.spec.round) return '';
      return ACTIVE[h.phase] ? h.phase : '';
    }

    issueRef() {
      const i = this.board && this.board.issue;
      return i && i.url ? `<button class="lnk" type="button" data-act="open-issue">#${esc(i.id)}</button>` : '';
    }

    sendToAi() {
      if (!this.spec.board) {
        this.exportModal();
        return;
      }
      if (this.board && this.board.can_handoff === false) {
        this.exportModal('이 검수는 넘길 사람이 정해져 있지 않아 자동으로 넘기지 못해요.');
        return;
      }
      if (this.sending) return;
      const c = this.counts();
      const left = this.reqCounts().todo;
      const issue = this.board && this.board.issue;
      const where = issue ? `대시보드 이슈 #${issue.id}` : '대시보드 이슈';
      const title = c.needs ? `고칠 것 ${c.needs}개를 AI에게 보낼까요?` : '검수 결과를 AI에게 알릴까요?';
      const body = c.needs
        ? `${where}에 추가요청으로 바로 등록되고 AI가 고치기 시작해요. 다 고치면 이 검수 화면에 다음 회차가 떠요.${left ? ` 아직 안 본 ${left}개는 다음 회차에도 그대로 남아요.` : ''}`
        : `${where}에 검수 결과가 등록돼요.`;
      this.modal(`<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="mr"><button class="btn ghost sm" type="button" data-act="modal-cancel">취소</button><button class="btn red sm" type="button" data-act="modal-ok">보내기</button></div>`);
      this.modalDone = () => this.askName(() => this.postHandoff());
    }

    async postHandoff() {
      if (this.sending) return;
      this.sending = true;
      this.toast('대시보드에 등록하는 중이에요…');
      if (this.synced) await this.pushNow();
      const c = this.counts();
      const res = await this.call('POST', '/handoff', { text: buildExport(this.spec, this.state, this.name()), name: this.name(), round: this.spec.round, needs: c.needs });
      this.sending = false;
      if (res.ok && res.data) {
        this.polledAt = Date.now();
        this.setBoard(res.data);
        this.render();
        const issue = res.data.issue;
        this.toast(`대시보드${issue ? ` #${issue.id}` : ''}에 등록했어요 · AI가 곧 고치기 시작해요`);
        return;
      }
      if (res.status === 409 && res.data) {
        this.stale = true;
        this.setBoard(res.data);
        this.toast(res.message || '새 회차가 나왔어요');
        return;
      }
      this.exportModal(res.message ? `자동으로 넘기지 못했어요(${res.message}).` : '자동으로 넘기지 못했어요(인터넷 연결을 확인해 주세요).');
    }

    shareText() {
      const b = this.board || {};
      return [String(b.message || this.spec.message || '').trim(), b.share_url || ''].filter(Boolean).join('\n\n');
    }

    seenText() {
      const b = this.board || {};
      const at = b.viewed_at ? Date.parse(b.viewed_at) : NaN;
      return Number.isFinite(at) ? `고객이 ${stamp(at)}에 열어봤어요` : '고객은 아직 안 열어봤어요';
    }

    showShare() {
      const b = this.board || {};
      if (!b.share_url) {
        this.toast(this.spec.board ? '모두 확인하면 고객에게 보낼 링크가 나와요' : '이 검수는 대시보드에 연결되지 않아 고객 링크가 없어요');
        return;
      }
      this.modal('<h3>검수 끝! 이 글만 고객에게 보내면 돼요</h3>'
        + `<p>보낼 말과 업데이트 일지 링크예요. 대시보드 이슈${b.issue ? ` #${esc(b.issue.id)}` : ''}에도 남겨 뒀어요. ${esc(this.seenText())}.</p>`
        + `<textarea class="short" readonly>${esc(this.shareText())}</textarea>`
        + '<div class="mr"><button class="btn ghost sm" type="button" data-act="modal-cancel">닫기</button><button class="btn ghost sm" type="button" data-act="preview">고객 화면 보기</button>'
        + '<button class="btn ghost sm" type="button" data-act="copy-link">링크만 복사</button><button class="btn ok sm" type="button" data-act="copy-share">보낼 말·링크 복사</button></div>');
      const ta = this.ui.modal.querySelector('textarea');
      if (ta) ta.addEventListener('focus', () => ta.select());
    }

    // 고객에게 나갈 글 미리보기 — 보낼 말 + 업데이트 일지(고객 화면처럼 '남은 부분'이 위)
    sendHtml() {
      const b = this.board || {};
      const log = normalizeLog(b.log) || this.spec.log;
      const msg = String(b.message || this.spec.message || '').trim();
      if (!log && !msg) return '';
      const head = log ? [[log.product, log.title].filter(Boolean).join(' '), log.version, log.date].filter(Boolean).join(' · ') : '';
      const list = (xs) => (xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
      const remain = log && log.remain.length ? `<div class="le rest"><b>남은 부분</b>${list(log.remain)}</div>` : '';
      const entries = log ? log.entries.map((e) => `<div class="le"><b>${esc(e.title)}</b>${list(e.lines)}${e.links.map((l) => `<a class="ln" href="${esc(l.url)}" data-href="${esc(l.url)}">${esc(l.label)} ›</a>`).join(' ')}</div>`).join('') : '';
      const share = b.share_url ? `<div class="share">고객 링크가 만들어졌어요<span class="mu">${esc(this.seenText())}</span></div>` : '';
      return `${share}<div class="sec"><h5>고객에게 이렇게 나가요</h5>${msg ? `<div class="msgp">${esc(msg)}</div>` : ''}`
        + `${log ? `<div class="lgp"><div class="lh">${esc(head || '업데이트 일지')}</div>${remain}${entries}</div>` : ''}</div>`;
    }

    openRound() {
      const b = this.board;
      if (!b || !b.link) return;
      this.save();
      this.toast(`${b.round}회차를 열어요`);
      setTimeout(() => {
        location.href = b.link;
      }, 350);
    }

    // 다른 주소 화면으로 갈 주소 — 검수판·지금 자리·체크·말·이름을 주소 뒤(#)에 싣는다. # 뒤는 서버로 가지 않는다
    async carry(it) {
      let src = this.src;
      let packed = '';
      try {
        if (!src) src = await encodeSpec(this.raw);
        packed = await encodeSpec({ i: this.state.items, n: this.name(), v: this.state.view, f: this.state.fold });
      } catch (e) {
        packed = '';
      }
      if (!src) return it.url;
      const st = packed && packed.length < 150000 ? `&${STATE_PARAM}=${packed}` : '';
      return `${String(it.url).split('#')[0]}#${PARAM}=${src}&${ITEM_PARAM}=${encodeURIComponent(this.state.cur)}~${this.state.chk}${st}`;
    }

    toast(message) {
      const t = this.ui.toast;
      t.textContent = message;
      t.classList.add('on');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
    }
  }

  const resumeUrl = (saved) => {
    const here = location.href.split('#')[0];
    const last = saved && saved.state && saved.state.lastUrl;
    const kind = attempt(() => performance.getEntriesByType('navigation')[0].type, '');
    return kind === 'reload' && last && sameOrigin(last) ? last : here;
  };

  const api = {
    version: VERSION,
    src: SCRIPT_URL,
    isShell: () => Boolean(app && app.shell),
    open(spec, opts) {
      if (!spec || !Array.isArray(spec.items)) throw new Error('qaReview.open: spec.items 가 필요합니다');
      const options = opts || {};
      if (app && app.spec && String(spec.id || 'review') !== app.spec.id) app.destroy({ keep: true });
      if (!app) app = new App();
      return app.load(spec, options);
    },
    resume(opts) {
      const options = opts || {};
      const id = local.text(ON) || local.text(LAST);
      const saved = id ? local.get(KEY + id) : null;
      if (!saved || !saved.spec) {
        if (!options.quiet) flash('이 주소에 저장된 검수가 없어요. 검수 링크를 먼저 열어 주세요');
        return null;
      }
      if (app && app.spec && app.spec.id === id) {
        app.mount();
        app.renderAll();
        return app.summary();
      }
      return api.open(saved.spec, { url: resumeUrl(saved), frame: options.frame, start: options.start });
    },
    close() {
      if (app) app.destroy();
    },
    state(id) {
      const saved = local.get(KEY + (id || local.text(LAST)));
      return saved ? saved.state : null;
    },
    exportText(id) {
      const key = id || local.text(LAST);
      if (app && app.spec && app.spec.id === key) return buildExport(app.spec, app.state, app.name());
      const saved = local.get(KEY + key);
      if (!saved || !saved.spec) return '';
      const spec = normalize(saved.spec);
      return buildExport(spec, merge(spec, saved.state), local.text(NAME) || local.text('hffb-name'));
    },
    status() {
      return app ? app.status() : null;
    },
    probe(marks, doc) {
      const target = doc || (app ? app.doc() : document);
      return toList(marks).map((m) => {
        const found = findMark(target, typeof m === 'string' ? { text: m } : m);
        return { found: Boolean(found.el), matches: found.matches, invalid: Boolean(found.invalid) };
      });
    },
    link: async (spec, url) => `${String(url || location.href).split('#')[0]}#${PARAM}=${await encodeSpec(spec)}`,
    decode: (payload) => decodeSpec(payload),
    board: () => (app ? app.board : null),
    sync: () => (app ? app.serverLoad(false) : null),
  };
  window.qaReview = api;

  const readParam = () => {
    const pieces = `${String(location.hash || '').replace(/^#/, '')}&${String(location.search || '').replace(/^\?/, '')}`.split('&');
    const find = (key) => {
      const hit = pieces.find((p) => p === key || p.indexOf(`${key}=`) === 0);
      return hit == null ? null : attempt(() => decodeURIComponent(hit.slice(key.length + 1)), '');
    };
    const value = find(PARAM);
    if (value != null) return { value: value.trim(), item: find(ITEM_PARAM) || '', st: find(STATE_PARAM) || '' };
    const legacy = find(HASH.slice(0, -1));
    return legacy != null ? { value: legacy.trim(), item: '', st: '' } : null;
  };

  const dropParam = () => attempt(() => {
    const strip = (raw) => raw.split('&').filter((p) => p && !/^(qa|qa-item|qa-st|qa-review)(=|$)/.test(p)).join('&');
    const hash = strip(String(location.hash || '').replace(/^#/, ''));
    const search = strip(String(location.search || '').replace(/^\?/, ''));
    const next = `${location.origin}${location.pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
    if (next !== location.href) history.replaceState(history.state, '', next);
  }, null);

  const start = async () => {
    if (boot === 'manual') return false;
    const param = readParam();
    if (param) {
      dropParam();
      if (param.value === 'off') {
        local.put(ON, null);
        session.put(ON, null);
        if (app) app.destroy({ keep: true });
        flash('검수 화면을 껐어요. 다시 보려면 주소 끝에 #qa=on 을 붙여 주세요');
        return true;
      }
      if (!param.value || param.value === 'on') {
        api.resume({ start: param.item });
        return true;
      }
      try {
        const payload = /^[0-2]\./.test(param.value) ? param.value : `2.${param.value}`;
        const spec = await decodeSpec(payload);
        // 다른 주소에서 같은 창으로 넘어올 때 실어 온 체크·말 — 못 읽어도 대시보드에 저장된 것으로 이어진다
        const carried = /^[01]\./.test(param.st) ? await decodeSpec(param.st).catch(() => null) : null;
        api.open(spec, { url: location.href.split('#')[0], start: param.item, src: payload, carried });
      } catch (e) {
        flash('검수 링크를 읽지 못했어요. 링크가 끝까지 복사됐는지, 방금 만든 회차면 1분 뒤 새로고침해 주세요');
      }
      return true;
    }
    if (boot === 'resume') {
      api.resume();
      return true;
    }
    if (local.text(ON) || session.text(ON)) api.resume({ quiet: true });
    return false;
  };

  api.fromHash = start;
  addEventListener('hashchange', () => {
    if (readParam()) start();
  });
  start();
})();
