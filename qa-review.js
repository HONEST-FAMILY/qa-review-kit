(() => {
  'use strict';

  const VERSION = '2.0.0';
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
  const TIP = 'qa-review-tip';
  const HASH = 'qa-review=';
  const PARAM = 'qa';
  const ITEM_PARAM = 'qa-item';
  const SIDE = 412;
  const SPLIT_MIN = 1280;
  const STATUS = { todo: '미검수', needs: '추가 검토', done: '검수완료' };
  const FILTERS = [['left', '남은 것'], ['needs', '추가 검토'], ['done', '검수완료'], ['all', '전체']];
  const TABS = [['original', '원본 내용'], ['actions', '조치 내용'], ['scenario', '검수 시나리오']];
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
    return spec;
  };
  const merge = (spec, old) => {
    const prev = (old && old.items) || {};
    const state = {
      cur: (old && old.cur) || '',
      filter: (old && old.filter) || 'left',
      tab: (old && old.tab) || 'original',
      fold: Object.assign({}, old && old.fold),
      view: (old && old.view) || 'pc',
      lastUrl: (old && old.lastUrl) || '',
      items: {},
    };
    spec.items.forEach((item) => {
      const p = prev[item.id];
      if (!p) {
        state.items[item.id] = { status: item.done ? 'done' : 'todo', rev: item.revision, comments: [], at: 0 };
        return;
      }
      const s = Object.assign({ comments: [] }, p);
      delete s.gone;
      if (item.revision > (s.rev || 1)) {
        if (s.status !== 'todo' || item.reply) {
          s.comments = s.comments.concat([{ id: uid(), sys: true, by: 'AI', at: Date.now(), round: spec.round, text: item.reply || `${spec.round}회차에 고쳤어요. 다시 확인해 주세요` }]);
        }
        s.status = 'todo';
        s.rev = item.revision;
      } else if (item.done && s.status === 'todo') {
        s.status = 'done';
      }
      state.items[item.id] = s;
    });
    Object.keys(prev).forEach((id) => {
      if (!state.items[id]) state.items[id] = Object.assign({}, prev[id], { gone: true });
    });
    return state;
  };
  const freshComments = (entry) => {
    const list = (entry && entry.comments) || [];
    let from = 0;
    list.forEach((c, i) => {
      if (c.sys) from = i + 1;
    });
    return list.slice(from).filter((c) => !c.sys);
  };
  const matchFilter = (status, filter) => (filter === 'all' ? true : filter === 'left' ? status !== 'done' : status === filter);
  const buildExport = (spec, state, name) => {
    const statusOf = (item) => (state.items[item.id] || {}).status || 'todo';
    const group = (st) => spec.items.filter((item) => statusOf(item) === st);
    const needs = group('needs');
    const done = group('done');
    const todo = group('todo');
    const out = [
      `[검수판 결과] ${spec.title}${spec.round > 1 ? ` · ${spec.round}회차` : ''}`,
      `검수자 ${name || '이름 없음'} · ${stamp(Date.now())}`,
      `주소 ${spec.site}`,
      `전체 ${spec.items.length}개 · 검수완료 ${done.length} · 추가 검토 ${needs.length} · 미검수 ${todo.length}`,
    ];
    if (needs.length) {
      out.push('', '■ 추가 검토 — 댓글 단 것을 고쳐 주세요');
      needs.forEach((item) => {
        out.push(`${item.no}. ${oneLine(item.title)}${item.url ? ` (${item.url})` : ''}`);
        freshComments(state.items[item.id]).forEach((c) => {
          out.push(`   - ${c.by} · ${stamp(c.at)}: ${oneLine(c.text)}`);
          if (c.pin) out.push(`     위치: ${c.pin.path} · ${c.pin.desc}${c.pin.selector ? ` · ${c.pin.selector}` : ''}`);
        });
      });
    }
    if (done.length) {
      out.push('', '■ 검수완료 — 다음 검수판에서 빼 주세요');
      done.forEach((item) => {
        const notes = freshComments(state.items[item.id]);
        out.push(`${item.no}. ${oneLine(item.title)}${notes.length ? ` (참고 댓글: ${notes.map((c) => oneLine(c.text)).join(' | ')})` : ''}`);
      });
    }
    if (todo.length) {
      out.push('', '■ 아직 안 본 것');
      todo.forEach((item) => out.push(`${item.no}. ${oneLine(item.title)}`));
    }
    out.push('', `검수판상태 ${JSON.stringify({ id: spec.id, round: spec.round, done: done.map((i) => i.id), needs: needs.map((i) => i.id), todo: todo.map((i) => i.id) })}`);
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
.ib svg,.btn svg,.pin svg,.chip svg,.dot svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.marks{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.mk{position:absolute;border:2.5px solid #dc2626;border-radius:7px;box-shadow:0 0 0 2px #fff}
.mb{position:absolute;background:#dc2626;color:#fff;font-size:12px;font-weight:800;line-height:20px;height:20px;padding:0 8px;border-radius:999px;white-space:nowrap;box-shadow:0 0 0 2px #fff}
.mb.cm{background:#d97706}
.mk.cm{border-style:dashed;border-color:#d97706}
.mk.flash{animation:qf .6s ease-in-out 3}
@keyframes qf{50%{box-shadow:0 0 0 2px #fff,0 0 0 10px rgba(220,38,38,.35)}}
.card{position:absolute;pointer-events:auto;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -18px rgba(15,23,42,.5),0 0 0 1px rgba(15,23,42,.07);animation:qin .22s cubic-bezier(.2,.8,.2,1)}
@keyframes qin{from{opacity:0;transform:translateY(6px)}}
.top{top:12px;right:12px;width:388px;max-height:calc(52vh - 18px);border:1px solid #dc2626}
.nav{bottom:12px;right:12px;width:388px;max-height:calc(48vh - 18px)}
.nav.left{right:auto;left:12px}
.hd{flex:none;display:flex;align-items:center;gap:6px;padding:8px 8px 8px 12px;background:#dc2626;color:#fff;cursor:pointer;user-select:none}
.brand{flex:none;background:#fff;color:#dc2626;font-size:11.5px;font-weight:800;border-radius:999px;padding:0 8px;line-height:20px}
.hd .t{flex:1;min-width:0;font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd .rd{flex:none;font-size:11.5px;font-weight:800;background:rgba(255,255,255,.22);border-radius:999px;padding:0 8px;line-height:20px;white-space:nowrap}
.ib{flex:none;width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center}
.ib svg{width:16px;height:16px}
.hd .ib:hover{background:rgba(255,255,255,.18)}
.hd .ib.on{background:#fff;color:#dc2626}
.fold-ic{transition:transform .2s}
.fold .fold-ic{transform:rotate(180deg)}
.tabs{flex:none;display:flex;gap:6px;padding:10px 12px 9px;border-bottom:1px solid #eef0f4;overflow-x:auto;scrollbar-width:none}
.tab{flex:none;padding:5px 11px;border-radius:999px;font-size:13px;font-weight:700;color:#4b5563;background:#f3f4f6;white-space:nowrap}
.tab:hover{background:#e9ebef}
.tab.on{background:#111827;color:#fff}
.tab i{font-style:normal;margin-left:4px;opacity:.7}
.body{flex:1;min-height:0;overflow:auto;padding:12px 14px 14px;overscroll-behavior:contain}
.body.more,.nb.more{-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 22px),transparent);mask-image:linear-gradient(to bottom,#000 calc(100% - 22px),transparent)}
details.prep{margin:0 0 10px;background:#f9fafb;border:1px solid #eef0f4;border-radius:10px;padding:7px 10px}
details.prep summary{cursor:pointer;font-size:12.5px;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
details.prep summary b{color:#111827;margin-right:6px}
details.prep[open] summary{white-space:normal}
details.prep ul{margin-top:6px}
.ft{flex:none;display:flex;align-items:center;gap:8px;padding:8px 10px 8px 14px;border-top:1px solid #eef0f4;background:#fff}
.ft .sum{flex:1;min-width:0;font-size:12.5px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top.fold{max-height:none}
.top.fold .tabs,.top.fold .body,.top.fold .ft{display:none}
.req+.req,.act+.act{margin-top:13px}
.rh{display:flex;align-items:baseline;gap:6px;font-size:13px;margin-bottom:5px}
.rh b{color:#111827;font-weight:800}
.rh span{font-weight:700}
.mu{color:#6b7280;font-size:12px;font-weight:500!important}
.qt{background:#f6f7f9;border-radius:10px;padding:9px 11px;font-size:13px;line-height:1.62;white-space:pre-wrap;color:#1f2937}
.qt.clamp{display:-webkit-box;-webkit-line-clamp:8;-webkit-box-orient:vertical;overflow:hidden}
.more{margin-top:4px;font-size:12px;font-weight:800;color:#dc2626}
.summary{background:#f9fafb;color:#111827;border:1px solid #eef0f4;border-radius:10px;padding:9px 11px;font-weight:600;font-size:13px;line-height:1.6;margin:0 0 13px}
.act h4{margin:0 0 5px;font-size:14px;font-weight:700;line-height:1.45}
.act h4 b{color:#111827}
ul{margin:0;padding-left:18px}
li{margin:3px 0;font-size:13px;line-height:1.55}
.refs{display:flex;flex-wrap:wrap;align-items:center;gap:2px 10px;margin-top:6px;font-size:12px;color:#6b7280}
.ref{font-size:12px;font-weight:700;color:#2563eb}
.ref:hover{text-decoration:underline}
.ref.done{color:#15803d}
.ref.needs{color:#b45309}
.sec{margin:0 0 13px}
.sec h5,.sec summary{font-size:12px;font-weight:800;color:#6b7280;margin:0 0 6px}
details.sec summary{cursor:pointer}
.filters{display:flex;gap:2px;padding:3px;background:#f3f4f6;border-radius:10px;margin:0 0 8px}
.fc{flex:1;padding:4px 6px;border-radius:7px;font-size:12px;font-weight:700;color:#6b7280;text-align:center;white-space:nowrap}
.fc:hover{color:#111827}
.fc span{margin-left:3px;font-weight:800}
.fc.on{background:#fff;color:#111827;box-shadow:0 1px 2px rgba(15,23,42,.12)}
.fc.f-needs span{color:#b45309}
.fc.f-done span{color:#15803d}
.rows{display:flex;flex-direction:column;gap:2px}
.row{display:flex;align-items:flex-start;gap:9px;padding:8px;border-radius:10px;width:100%}
.row:hover{background:#f6f7f9}
.row.cur{background:#fef2f2}
.row .rt{flex:1;min-width:0;font-size:13px;line-height:1.45}
.row .rt b{color:#6b7280;margin-right:4px;font-weight:700}
.row .rm{display:block;font-size:12px;color:#6b7280;margin-top:1px}
.dot{flex:none;width:18px;height:18px;border-radius:50%;margin-top:1px;border:2px solid #cfd4dc;display:inline-flex;align-items:center;justify-content:center;color:#fff;background:#fff}
.dot.needs{background:#d97706;border-color:#d97706}
.dot.done{background:#16a34a;border-color:#16a34a}
.dot svg{width:10px;height:10px;stroke-width:3.4}
.dot.needs::after{content:"!";font-size:11px;font-weight:900;line-height:1}
.empty{color:#6b7280;font-size:13px;margin:10px 2px}
.nh{flex:none;display:flex;align-items:center;gap:7px;padding:9px 8px 9px 14px;border-bottom:1px solid #eef0f4;cursor:pointer;user-select:none}
.nh .no{font-size:12.5px;font-weight:800;color:#111827;white-space:nowrap}
.nh .left{font-size:12px;color:#6b7280;white-space:nowrap}
.nh .nt{display:none;flex:1;min-width:0;font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nh .sp{flex:1}
.nav.fold .nh .nt{display:block}
.nav.fold .nh .sp,.nav.fold .nh .left{display:none}
.nh .ib{color:#6b7280}
.nh .ov{display:none;align-items:center;gap:4px;font-size:12px;font-weight:800;color:#dc2626;background:#fef2f2;border-radius:999px;padding:0 9px;line-height:24px}
.nh .ib:hover{background:#f3f4f6}
.pill{font-size:11.5px;font-weight:800;border-radius:999px;padding:0 8px;line-height:20px;white-space:nowrap;background:#f3f4f6;color:#4b5563}
.pill.needs{background:#fffbeb;color:#b45309}
.pill.done{background:#f0fdf4;color:#15803d}
.nb{flex:1;min-height:0;overflow:auto;padding:12px 14px 12px;overscroll-behavior:contain}
.nav.fold .nb{display:none}
.it{margin:0 0 5px;font-size:15px;font-weight:800;line-height:1.42}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:3px 8px;font-size:12.5px;color:#6b7280;margin:0 0 9px}
.meta .tiny{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:700;color:#6b7280}
.meta .tiny:hover{color:#111827}
.meta .tiny svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
.sit{font-size:12.5px;color:#4b5563;margin:-3px 0 10px;line-height:1.55}
.legend{display:flex;gap:12px;font-size:12px;color:#6b7280;margin:0 0 6px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;border:2px solid #dc2626;margin-right:4px;vertical-align:-1px}
.legend i.on{background:#dc2626}
.warn{font-size:12.5px;background:#fffbeb;color:#92400e;border-radius:10px;padding:8px 10px;margin:0 0 9px;line-height:1.55}
.warn .btn{margin-top:6px}
.allset{background:#f0fdf4;color:#166534;border-radius:10px;padding:9px 11px;font-size:13px;font-weight:700;margin:0 0 10px;line-height:1.5}
.allset .btn{margin-top:7px}
.steps{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:6px}
.st{display:flex;gap:9px;align-items:flex-start;cursor:pointer;border-radius:10px;padding:5px 5px 5px 3px}
.st:hover{background:#f6f7f9}
.st .n{flex:none;width:22px;height:22px;border-radius:50%;border:2px solid #dc2626;color:#dc2626;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-top:1px;background:#fff}
.st.on .n{background:#dc2626;color:#fff}
.st .n.nomark{border-color:#cfd4dc;color:#6b7280}
.st .tx{flex:1;min-width:0;font-size:13px;line-height:1.6}
.cpy{margin-top:5px;border:1px solid #e5e7eb;border-radius:9px;background:#fafafa;overflow:hidden}
.cpy pre{margin:0;padding:7px 9px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;color:#374151;max-height:120px;overflow:auto}
.cpy button{display:block;width:100%;padding:5px;border-top:1px solid #e5e7eb;font-size:12px;font-weight:800;color:#dc2626;text-align:center;background:#fff}
.kb{display:inline-block;border:1px solid #cbd2dc;border-bottom-width:2px;border-radius:6px;padding:0 6px;font-size:12.5px;font-weight:700;line-height:1.5;background:#fff;color:#111827}
.q{font-weight:700;color:#111827}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:#f3f4f6;border-radius:5px;padding:1px 5px;color:#374151}
a.ln{color:#2563eb;text-decoration:none;word-break:break-all;cursor:pointer}
a.ln:hover{text-decoration:underline}
a.ln.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
.ai{border:1px solid #e5e7eb;border-radius:10px;padding:7px 10px;margin:0 0 10px;font-size:12.5px}
.ai summary{cursor:pointer;font-weight:800}
.ai.ok summary{color:#15803d}
.ai.bad summary{color:#b91c1c}
.ai.na summary{color:#6b7280}
.ai ul{margin-top:5px}
.th{border-top:1px solid #eef0f4;padding-top:10px}
.thh{font-size:12px;font-weight:800;color:#6b7280;margin-bottom:6px}
.msg{background:#fffbeb;border-radius:10px;padding:7px 10px;margin-bottom:6px}
.msg.sys{background:#f0fdf4}
.mh{display:flex;align-items:center;gap:6px;font-size:12px;color:#6b7280}
.mh b{color:#111827;font-weight:800}
.msg.sys .mh b{color:#15803d}
.mh .del{margin-left:auto;width:22px;height:22px;border-radius:6px;color:#a1a1aa;font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center}
.mh .del:hover{background:#fde68a;color:#92400e}
.mt{font-size:13.5px;white-space:pre-wrap;margin-top:2px;line-height:1.55}
.pin{margin-top:5px;font-size:12px;font-weight:700;color:#b45309;display:inline-flex;gap:4px;align-items:center}
.pin svg{width:13px;height:13px}
.cp textarea{display:block;width:100%;min-height:60px;max-height:180px;resize:vertical;border:1px solid #d6dcea;border-radius:10px;padding:8px 10px;font:inherit;font-size:13.5px;line-height:1.5;background:#fff;color:#111827;outline:none}
.cp textarea:focus{border-color:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.12)}
.cpr{display:flex;align-items:center;gap:6px;margin-top:6px}
.cpr .sp{flex:1}
.draftpin{display:flex;align-items:center;gap:6px;margin-top:6px;font-size:12px;color:#b45309;font-weight:700}
.draftpin svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2}
.draftpin button{color:#9ca3af;font-weight:700;margin-left:auto}
.me{margin-top:6px;font-size:12px;color:#6b7280}
.me button{color:#dc2626;font-weight:800;margin-left:4px}
.nf{flex:none;display:grid;grid-template-columns:1fr 1.3fr 1fr;gap:6px;padding:8px 10px;border-top:1px solid #eef0f4;background:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;height:38px;border-radius:10px;font-size:13.5px;font-weight:800;padding:0 12px;white-space:nowrap}
.btn svg{width:15px;height:15px;stroke-width:2.4}
.btn.sm{height:32px;font-size:12.5px;padding:0 10px}
.btn.ghost{background:#f3f4f6;color:#374151}
.btn.ghost:hover{background:#e9ebef}
.btn.dark{background:#111827;color:#fff}
.btn.dark:hover{background:#000}
.btn.ok{background:#16a34a;color:#fff}
.btn.ok:hover{background:#15803d}
.btn.red{background:#dc2626;color:#fff}
.btn.red:hover{background:#b91c1c}
.btn.line{background:#fff;color:#15803d;box-shadow:inset 0 0 0 1.5px #16a34a}
.btn.outline{background:#fff;color:#111827;box-shadow:inset 0 0 0 1.5px #d1d5db}
.btn.outline:hover{background:#f9fafb}
.btn:disabled{opacity:.38;cursor:default}
.pick{position:absolute;inset:0;pointer-events:auto;cursor:crosshair;background:rgba(15,23,42,.03)}
.pickbox{position:absolute;border:2px dashed #d97706;background:rgba(217,119,6,.08);border-radius:6px;pointer-events:none}
.picktag{position:absolute;background:#d97706;color:#fff;font-size:12px;font-weight:800;border-radius:999px;padding:0 9px;line-height:21px;white-space:nowrap;pointer-events:none}
.pickhint{position:absolute;left:50%;top:14px;transform:translateX(-50%);background:#111827;color:#fff;border-radius:999px;padding:8px 15px;font-size:13px;font-weight:700;pointer-events:none;white-space:nowrap;box-shadow:0 10px 30px -10px rgba(0,0,0,.5)}
.toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%) translateY(8px);opacity:0;background:#111827;color:#fff;border-radius:999px;padding:9px 16px;font-size:13.5px;font-weight:600;white-space:nowrap;max-width:calc(100vw - 24px);overflow:hidden;text-overflow:ellipsis;transition:opacity .2s,transform .2s;pointer-events:none}
.toast.on{opacity:1;transform:translateX(-50%)}
.mbg{position:absolute;inset:0;background:rgba(15,23,42,.45);pointer-events:auto;display:flex;align-items:flex-start;justify-content:center;padding:12vh 12px 12px}
.modal{width:min(460px,100%);background:#fff;border-radius:16px;padding:18px;box-shadow:0 22px 50px -14px rgba(15,23,42,.45)}
.modal h3{margin:0 0 6px;font-size:16px;font-weight:800}
.modal p{margin:0 0 12px;font-size:13px;color:#4b5563;line-height:1.55}
.modal input,.modal textarea{display:block;width:100%;border:1px solid #d6dcea;border-radius:10px;padding:9px 11px;font:inherit;font-size:14px;outline:none;background:#fff;color:#111827}
.modal textarea{height:300px;font-size:13px;line-height:1.6;resize:vertical;white-space:pre-wrap}
.modal input:focus,.modal textarea:focus{border-color:#dc2626}
.mr{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
.mr .btn{height:40px;padding:0 16px;font-size:13.5px}
.tip{position:absolute;right:412px;bottom:20px;width:300px;background:#111827;color:#fff;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.6;pointer-events:auto;box-shadow:0 12px 30px -10px rgba(0,0,0,.5)}
.tip::after{content:"";position:absolute;right:-7px;bottom:18px;border-style:solid;border-width:7px 0 7px 7px;border-color:transparent transparent transparent #111827}
.tip b{color:#fca5a5}
.tip button{display:block;margin-top:8px;font-weight:800;color:#fca5a5}
@media (max-width:640px){
.top{left:0;right:0;top:auto;bottom:0;width:auto;max-height:86vh;border-radius:16px 16px 0 0;z-index:3}
.top.fold{display:none}
.nav,.nav.left{left:0;right:0;bottom:0;width:auto;border-radius:16px 16px 0 0;max-height:46vh;padding-bottom:env(safe-area-inset-bottom)}
.hd .ib[data-act="mobile"],.hd .ib[data-act="split"]{display:none}
.nh .ov{display:inline-flex}
.nf .btn{height:44px}
.toast{bottom:auto;top:62px}
.tip{left:8px;right:8px;width:auto;bottom:calc(46vh + 12px)}
.tip::after{display:none}
.nf{grid-template-columns:1fr 1.4fr 1fr}
}
@media (prefers-reduced-motion:reduce){.card,.mk.flash{animation:none}.toast,.fold-ic{transition:none}}
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
      this.picking = false;
      this.pickEl = null;
      this.itemSince = 0;
      this.scrolled = false;
      this.placed = 0;
      this.userOpened = false;
      this.autoFolded = false;
      this.markRects = [];
      this.modalDone = null;
      this.loadingSince = 0;
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
  <section class="card top" role="dialog" aria-label="검수판">
    <header class="hd" data-act="fold-top">
      <span class="brand">검수판</span><span class="t"></span><span class="rd" hidden></span>
      <button class="ib" type="button" data-act="split" title="화면 위에 겹쳐 보기" aria-label="나란히 보기 또는 겹쳐 보기">${ICON.split}</button>
      <button class="ib" type="button" data-act="mobile" title="휴대폰 폭(390px)으로 보기" aria-label="휴대폰 폭으로 보기">${ICON.phone}</button>
      <button class="ib fold-ic" type="button" data-act="fold-top" title="접기·펼치기" aria-label="접기 또는 펼치기">${ICON.chevron}</button>
      <button class="ib" type="button" data-act="close" title="검수판 닫기" aria-label="검수판 닫기">${ICON.close}</button>
    </header>
    <nav class="tabs" role="tablist"></nav>
    <div class="body"></div>
    <footer class="ft"><span class="sum"></span><button class="btn red sm" type="button" data-act="export">AI에게 넘기기</button></footer>
  </section>
  <section class="card nav" role="dialog" aria-label="검수 항목">
    <header class="nh" data-act="fold-nav">
      <button class="ov" type="button" data-act="overview">검수판</button><span class="no"></span><span class="pill"></span><span class="left"></span><span class="nt"></span><span class="sp"></span>
      <button class="ib fold-ic" type="button" data-act="fold-nav" title="접기·펼치기" aria-label="접기 또는 펼치기">${ICON.chevron}</button>
    </header>
    <div class="nb"></div>
    <footer class="nf">
      <button class="btn outline" type="button" data-act="prev">‹ 이전</button>
      <button class="btn ok" type="button" data-act="done"></button>
      <button class="btn outline" type="button" data-act="next">다음 ›</button>
    </footer>
  </section>
  <div class="pick" hidden><div class="pickbox" hidden></div><div class="picktag" hidden></div><div class="pickhint">댓글을 붙일 곳을 누르세요 · Esc 취소</div></div>
  <div class="tip" hidden></div>
  <div class="toast" role="status" aria-live="polite"></div>
  <div class="mbg" hidden><div class="modal" role="dialog" aria-modal="true"></div></div>
</div>`;
      const $ = (sel) => shadow.querySelector(sel);
      this.host = host;
      this.shadow = shadow;
      this.ui = {
        root: $('.root'), marks: $('.marks'), top: $('.top'), nav: $('.nav'), title: $('.hd .t'), round: $('.hd .rd'), split: $('[data-act="split"]'),
        tabs: $('.tabs'), body: $('.body'), sum: $('.ft .sum'), no: $('.nh .no'), pill: $('.nh .pill'), left: $('.nh .left'), nt: $('.nh .nt'),
        nb: $('.nb'), prev: $('[data-act="prev"]'), done: $('.nf [data-act="done"]'), next: $('[data-act="next"]'), mobile: $('[data-act="mobile"]'),
        pick: $('.pick'), pickbox: $('.pickbox'), picktag: $('.picktag'), tip: $('.tip'), toast: $('.toast'), mbg: $('.mbg'), modal: $('.modal'),
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
      this.ui.nb.addEventListener('scroll', () => this.fade(this.ui.nb), { passive: true });
      this.ui.root.addEventListener('toggle', (e) => {
        if (e.target.classList && e.target.classList.contains('prep')) this.prepOpen = e.target.open;
        this.fade(this.ui.body);
        this.fade(this.ui.nb);
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
    }

    load(raw, opts) {
      const spec = normalize(raw);
      const saved = local.get(KEY + spec.id);
      this.raw = raw;
      this.spec = spec;
      this.state = merge(spec, saved && saved.state);
      if (this.state.fold.top == null) this.state.fold.top = this.isPhone();
      const start = opts.start && this.item(opts.start);
      if (start) this.state.cur = start.id;
      if (!this.item(this.state.cur)) {
        const first = this.firstMatching('left') || spec.items[0];
        this.state.cur = first ? first.id : '';
      }
      local.put(LAST, spec.id);
      local.put(ON, spec.id);
      const startUrl = opts.url || location.href.split('#')[0];
      if (opts.frame !== false && window.top === window && !this.shell) {
        this.loadingSince = Date.now();
        this.shell = new Shell(this.onFrameLoad, sameOrigin(startUrl) ? startUrl : location.href.split('#')[0]);
      }
      if (this.shell) this.ensureHide(document);
      this.applyView();
      this.save();
      this.mount();
      this.itemChanged();
      if (!local.text(TIP)) setTimeout(() => this.showTip(), 500);
      return this.summary();
    }

    save() {
      if (!this.spec) return;
      const href = this.href();
      if (href && sameOrigin(href)) this.state.lastUrl = href;
      local.set(KEY + this.spec.id, { v: 1, spec: this.raw, state: this.state, savedAt: Date.now() });
    }

    destroy(opts) {
      clearInterval(this.timer);
      this.timer = 0;
      clearInterval(this.drawTimer);
      this.drawTimer = 0;
      cancelAnimationFrame(this.raf);
      document.removeEventListener('keydown', this.onKey, true);
      removeEventListener('resize', this.onResize);
      removeEventListener('scroll', this.onScroll, true);
      removeEventListener('storage', this.onStorage);
      this.save();
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

    item(id) {
      return this.spec ? this.spec.items.find((it) => it.id === id) || null : null;
    }

    current() {
      return this.item(this.state.cur);
    }

    entry(id) {
      if (!this.state.items[id]) this.state.items[id] = { status: 'todo', rev: 1, comments: [], at: 0 };
      return this.state.items[id];
    }

    statusOf(id) {
      return this.entry(id).status || 'todo';
    }

    counts() {
      const c = { todo: 0, needs: 0, done: 0, all: this.spec.items.length };
      this.spec.items.forEach((it) => {
        c[this.statusOf(it.id)] += 1;
      });
      c.left = c.todo + c.needs;
      return c;
    }

    firstMatching(filter, except) {
      return this.spec.items.find((it) => it.id !== except && matchFilter(this.statusOf(it.id), filter)) || null;
    }

    neighbor(dir) {
      const list = this.spec.items;
      const idx = list.findIndex((it) => it.id === this.state.cur);
      for (let i = idx + dir; i >= 0 && i < list.length; i += dir) {
        if (matchFilter(this.statusOf(list[i].id), this.state.filter)) return list[i];
      }
      return null;
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
      return { id: this.spec.id, round: this.spec.round, items: c.all, todo: c.todo, needs: c.needs, done: c.done, current: this.state.cur, frame: Boolean(this.shell) };
    }

    status() {
      const it = this.current();
      return {
        id: this.spec.id,
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
      this.ui.top.classList.toggle('fold', Boolean(this.state.fold.top));
      this.ui.nav.classList.toggle('fold', Boolean(this.state.fold.nav));
    }

    go(id, opts) {
      const it = this.item(id);
      if (!it) return;
      this.state.cur = it.id;
      this.draft = '';
      this.draftPin = null;
      const reload = opts && opts.reload;
      if (it.url && (reload || pageKey(it.url) !== pageKey(this.href()))) {
        if (it.outside || !sameOrigin(it.url)) {
          this.save();
          this.itemChanged();
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
      this.itemChanged();
    }

    itemChanged() {
      this.firstShow = this.itemSince === 0;
      this.targetsFor = '';
      this.targets = [];
      this.placed = 0;
      this.userOpened = false;
      this.scrolled = false;
      this.itemSince = Date.now();
      if (this.autoFolded) {
        this.autoFolded = false;
        this.state.fold.top = false;
      }
      this.ui.top.style.maxHeight = '';
      this.ui.nav.classList.remove('left');
      this.navReset = true;
      this.ui.toast.classList.remove('on');
      this.applyView();
      this.renderAll();
      this.tick();
    }

    renderAll() {
      this.renderTop();
      this.renderNav();
    }

    renderTop() {
      const s = this.spec;
      const c = this.counts();
      this.ui.title.textContent = s.title;
      this.ui.title.title = s.title;
      this.ui.round.hidden = s.round < 2;
      this.ui.round.textContent = `${s.round}회차`;
      const tab = this.state.tab;
      const tabCount = { original: s.original.length, actions: s.actions.length, scenario: c.all };
      this.ui.tabs.innerHTML = TABS.map(([key, label]) => `<button class="tab${key === tab ? ' on' : ''}" type="button" role="tab" aria-selected="${key === tab}" data-act="tab" data-tab="${key}">${label}<i>${tabCount[key] || ''}</i></button>`).join('');
      const keep = this.ui.body.scrollTop;
      this.ui.body.innerHTML = tab === 'actions' ? this.actionsHtml() : tab === 'scenario' ? this.scenarioHtml() : this.originalHtml();
      this.ui.body.scrollTop = keep;
      const curRow = tab === 'scenario' && this.ui.body.querySelector('.row.cur');
      if (curRow) {
        const b = this.ui.body.getBoundingClientRect();
        const r = curRow.getBoundingClientRect();
        if (b.height && (r.top < b.top || r.bottom > b.bottom)) this.ui.body.scrollTop += r.top - b.top - (b.height - r.height) / 2;
      }
      this.fade(this.ui.body);
      const comments = this.spec.items.reduce((n, it) => n + freshComments(this.entry(it.id)).length, 0);
      this.ui.sum.textContent = `검수완료 ${c.done} / ${c.all}`;
      const exportBtn = this.ui.top.querySelector('.ft [data-act="export"]');
      if (exportBtn) exportBtn.textContent = comments ? `AI에게 넘기기 · 댓글 ${comments}` : 'AI에게 넘기기';
    }

    originalHtml() {
      const list = this.spec.original;
      if (!list.length) return '<p class="empty">원본 내용이 없어요.</p>';
      return list.map((o, i) => {
        const text = String(o.text || '');
        const long = text.split('\n').length > 8 || text.length > 380;
        return `<article class="req"><div class="rh"><b>${esc(o.no)})</b>${o.who ? `<span>${esc(o.who)}</span>` : ''}${o.when ? `<span class="mu">${esc(o.when)}</span>` : ''}</div>`
          + `<div class="qt${long ? ' clamp' : ''}" data-q="${i}">${linkify(text)}</div>${long ? `<button class="more" type="button" data-act="more" data-q="${i}">더 보기</button>` : ''}</article>`;
      }).join('');
    }

    actionsHtml() {
      const s = this.spec;
      const summary = s.summary ? `<p class="summary">${inline(s.summary)}</p>` : '';
      if (!s.actions.length) return `${summary}<p class="empty">조치 내용이 없어요.</p>`;
      return summary + s.actions.map((a) => {
        const head = a.title || a.no ? `<h4>${a.no ? `<b>${esc(a.no)})</b> ` : ''}${inline(a.title || '')}</h4>` : '';
        const refs = a.refs.map((id) => this.item(String(id))).filter(Boolean);
        const refLinks = refs.map((it) => {
          const st = this.statusOf(it.id);
          return `<button class="ref ${st}" type="button" data-act="go" data-id="${esc(it.id)}" title="${esc(STATUS[st])}">${esc(it.no)}번${st === 'done' ? ' ✓' : st === 'needs' ? ' !' : ''}</button>`;
        }).join('');
        return `<article class="act">${head}${a.items.length ? `<ul>${a.items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>` : ''}`
          + `${refs.length ? `<div class="refs"><span>검수 항목</span>${refLinks}<span>→</span></div>` : ''}</article>`;
      }).join('');
    }

    dot(id) {
      const st = this.statusOf(id);
      return `<span class="dot ${st}" aria-label="${STATUS[st]}">${st === 'done' ? ICON.check : ''}</span>`;
    }

    scenarioHtml() {
      const s = this.spec;
      const c = this.counts();
      const f = this.state.filter;
      const prep = s.prep.length ? `<details class="prep"${this.prepOpen ? ' open' : ''}><summary><b>준비</b>${esc(String(s.prep[0]).replace(/[`*]/g, ''))}</summary><ul>${s.prep.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></details>` : '';
      const filters = `<div class="filters" role="tablist">${FILTERS.map(([key, label]) => `<button class="fc f-${key}${key === f ? ' on' : ''}" type="button" data-act="filter" data-f="${key}">${label}<span>${c[key]}</span></button>`).join('')}</div>`;
      const rows = s.items.filter((it) => matchFilter(this.statusOf(it.id), f));
      const empty = { left: '남은 항목이 없어요. 모두 검수했어요.', needs: '추가 검토로 남긴 항목이 없어요.', done: '아직 검수완료한 항목이 없어요.', all: '검수 항목이 없어요.' }[f];
      const list = rows.length ? `<div class="rows">${rows.map((it) => {
        const n = freshComments(this.entry(it.id)).length;
        const where = it.url ? shortUrl(it.url) : '화면 밖 확인';
        const meta = [it.env, where.length > 34 ? `${where.slice(0, 33)}…` : where, n ? `댓글 ${n}` : ''].filter(Boolean).join(' · ');
        return `<button class="row${it.id === this.state.cur ? ' cur' : ''}" type="button" data-act="go" data-id="${esc(it.id)}">${this.dot(it.id)}<span class="rt"><b>${esc(it.no)}.</b>${inline(it.title)}<span class="rm">${esc(meta)}</span></span></button>`;
      }).join('')}</div>` : `<p class="empty">${empty}</p>`;
      const extra = [['화면 밖 확인', s.offscreen], ['확인한 회귀', s.regression]]
        .filter(([, items]) => items.length)
        .map(([label, items]) => `<details class="sec"><summary>${label} ${items.length}</summary><ul>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</ul></details>`).join('');
      return prep + filters + list + (extra ? `<div style="margin-top:12px">${extra}</div>` : '');
    }

    renderNav() {
      const it = this.current();
      const c = this.counts();
      const focused = this.shadow.activeElement;
      const typing = focused && focused.dataset && focused.dataset.role === 'draft';
      const keep = this.navReset ? 0 : this.ui.nb.scrollTop;
      this.navReset = false;
      if (!it) {
        this.ui.no.textContent = '검수 항목';
        this.ui.pill.className = 'pill';
        this.ui.pill.textContent = '없음';
        this.ui.left.textContent = '';
        this.ui.nt.textContent = '';
        this.ui.nb.innerHTML = '<p class="empty">검수 항목이 없어요.</p>';
        this.ui.prev.disabled = true;
        this.ui.next.disabled = true;
        this.ui.done.disabled = true;
        this.ui.done.textContent = '검수완료';
        return;
      }
      const st = this.statusOf(it.id);
      const idx = this.spec.items.indexOf(it) + 1;
      this.ui.no.textContent = `항목 ${idx} / ${c.all}`;
      this.ui.pill.className = `pill ${st}`;
      this.ui.pill.textContent = STATUS[st];
      this.ui.left.textContent = `남은 것 ${c.left}`;
      this.ui.nt.textContent = it.title.replace(/\*\*|`|\[|\]/g, '');
      const sameSite = !it.url || (sameOrigin(it.url) && !it.outside);
      const where = it.url
        ? `${link(it.url, true)}${sameSite ? `<button class="tiny" type="button" data-act="reload" title="이 항목 주소를 처음부터 다시 열어요">${ICON.reload}처음부터</button>` : ''}`
        : '<span>화면 밖 확인</span>';
      const meta = `<div class="meta">${where}${it.env ? `<span>${inline(it.env)}</span>` : ''}${it.account ? `<span>${inline(it.account)}</span>` : ''}</div>`;
      const done = c.all > 0 && c.left === 0
        ? '<div class="allset">모든 항목을 검수완료했어요.<br><button class="btn red sm" type="button" data-act="export">AI에게 넘기기</button></div>'
        : c.todo === 0 && c.needs > 0
          ? `<div class="allset">다 봤어요. 추가 검토 ${c.needs}개를 AI에게 넘겨 주세요.<br><button class="btn red sm" type="button" data-act="export">AI에게 넘기기</button></div>`
          : '';
      const crossText = it.outside
        ? '결제창처럼 바깥 창이 열리는 항목이라 새 창에서 확인해 주세요. 확인한 뒤 여기로 돌아와 검수완료나 댓글을 남기면 돼요.'
        : '다른 주소의 화면이라 이 창에서는 빨간 표시를 붙일 수 없어요. 새 창에서 확인한 뒤 돌아와 검수완료나 댓글을 남겨 주세요.';
      const cross = it.url && !sameSite
        ? `<div class="warn">${crossText}<br><button class="btn dark sm" type="button" data-act="open-out">${ICON.out}새 창에서 열기</button></div>`
        : '';
      const situation = it.situation ? `<p class="sit">${inline(it.situation)}</p>` : '';
      const anyMark = it.steps.some((step) => step.marks.length) && sameSite;
      const legend = anyMark ? '<div class="legend"><span><i class="on"></i>화면에 빨간 표시 있음</span><span><i></i>지금 화면에 없음</span></div>' : '';
      const steps = it.steps.length ? `${legend}<ol class="steps">${it.steps.map((step, k) => {
        const marked = step.marks.length > 0 && sameSite;
        return `<li class="st" data-step="${k + 1}" data-act="step"><span class="n${marked ? '' : ' nomark'}">${k + 1}</span><div class="tx">${inline(step.text)}`
          + `${step.copy ? `<div class="cpy"><pre>${esc(step.copy)}</pre><button type="button" data-act="copy" data-step="${k}">이 내용 복사</button></div>` : ''}</div></li>`;
      }).join('')}</ol>` : '';
      const ai = it.ai ? this.aiHtml(it.ai) : '';
      const entry = this.entry(it.id);
      const thread = entry.comments.length ? entry.comments.map((cm) => `<div class="msg${cm.sys ? ' sys' : ''}"><div class="mh"><b>${esc(cm.by || '검수자')}</b><span>${esc(when(cm.at))}</span>`
        + `${cm.sys ? '' : `<button class="del" type="button" data-act="del" data-cid="${esc(cm.id)}" title="댓글 지우기" aria-label="댓글 지우기">×</button>`}</div>`
        + `<div class="mt">${inline(cm.text)}</div>${cm.pin ? `<button class="pin" type="button" data-act="pin-show" data-cid="${esc(cm.id)}">${ICON.pin}${esc(cm.pin.path)} · ${esc(cm.pin.desc)}</button>` : ''}</div>`).join('') : '';
      const nm = this.name();
      const pin = this.draftPin ? `<div class="draftpin">${ICON.pin}<span>${esc(this.draftPin.path)} · ${esc(this.draftPin.desc)}</span><button type="button" data-act="unpin">빼기</button></div>` : '';
      const composer = `<div class="th"><div class="thh">${entry.comments.length ? `댓글 ${entry.comments.length}` : '추가로 볼 것이 있으면 댓글을 남겨 주세요'}</div>${thread}`
        + `<div class="cp"><textarea data-role="draft" rows="2" placeholder="추가로 볼 것이나 고칠 것을 적어 주세요">${esc(this.draft)}</textarea>${pin}`
        + `<div class="cpr"><button class="btn ghost sm" type="button" data-act="pick">${ICON.pin}화면에서 위치 찍기</button><span class="sp"></span><button class="btn outline sm" type="button" data-act="comment">댓글 남기기</button></div>`
        + `${nm ? `<div class="me">${esc(nm)}님 이름으로 남겨요<button type="button" data-act="rename">바꾸기</button></div>` : ''}</div></div>`;
      this.ui.nb.innerHTML = `${done}<h3 class="it">${inline(it.title)}</h3>${meta}${cross}${situation}${steps}${ai}${composer}`;
      this.ui.nb.scrollTop = keep;
      this.fade(this.ui.nb);
      this.ui.prev.disabled = !this.neighbor(-1);
      this.ui.next.disabled = !this.neighbor(1);
      this.ui.done.disabled = false;
      this.ui.done.className = st === 'done' ? 'btn line' : 'btn ok';
      this.ui.done.innerHTML = st === 'done' ? '검수완료 취소' : `${ICON.check}검수완료`;
      if (typing) {
        const ta = this.ui.nb.querySelector('textarea[data-role="draft"]');
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      }
      this.updateSteps();
    }

    aiHtml(ai) {
      const result = String(ai.result || '');
      const cls = /어긋/.test(result) ? 'bad' : /못/.test(result) ? 'na' : 'ok';
      const lines = toList(ai.lines);
      return `<details class="ai ${cls}"><summary>AI 확인 · ${esc(result || '기록 있음')}${ai.at ? ` · ${esc(ai.at)}` : ''}</summary>${lines.length ? `<ul>${lines.map((x) => `<li>${inline(x)}</li>`).join('')}</ul>` : ''}</details>`;
    }

    buildTargets() {
      const it = this.current();
      const entry = it ? this.entry(it.id) : null;
      const key = it ? `${it.id}|${entry.comments.length}` : '';
      if (key === this.targetsFor) return;
      this.targetsFor = key;
      this.targets = [];
      if (!it) return;
      it.steps.forEach((step, k) => step.marks.forEach((mark) => {
        this.targets.push({ kind: 'step', step: k + 1, mark, label: mark.label ? `${k + 1} ${mark.label}` : String(k + 1), el: null, matches: 0 });
      }));
      entry.comments.forEach((cm) => {
        if (cm.pin) this.targets.push({ kind: 'pin', cid: cm.id, page: cm.pin.page, mark: { selector: cm.pin.selector, text: cm.pin.text }, label: '댓글', el: null, matches: 0 });
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
      const items = this.ui.nb.querySelectorAll('.st');
      items.forEach((li) => {
        const step = Number(li.dataset.step);
        const mine = this.targets.filter((t) => t.kind === 'step' && t.step === step);
        if (!mine.length) return;
        li.classList.toggle('on', mine.some((t) => t.el && t.visible));
      });
    }

    fade(el) {
      el.classList.toggle('more', el.scrollTop + el.clientHeight < el.scrollHeight - 2);
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

    placeCards() {
      if (this.markRects.length <= this.placed || this.isPhone() || this.userOpened) return;
      this.placed = this.markRects.length;
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const covered = (rect) => this.markRects.filter((m) => hit(m, rect));
      const nav = this.ui.nav.getBoundingClientRect();
      const onRight = covered(nav).length;
      if (onRight && !this.ui.nav.classList.contains('left')) {
        const leftRect = { left: 12, right: 12 + nav.width, top: nav.top, bottom: nav.bottom };
        if (covered(leftRect).length < onRight) this.ui.nav.classList.add('left');
      }
      if (this.state.fold.top) return;
      const top = this.ui.top.getBoundingClientRect();
      const under = covered(top);
      if (!under.length) return;
      const room = Math.min(...under.map((m) => m.top)) - top.top - 10;
      if (room >= 280) {
        this.ui.top.style.maxHeight = `${Math.floor(room)}px`;
        return;
      }
      if (this.firstShow) return;
      this.autoFolded = true;
      this.state.fold.top = true;
      this.ui.top.classList.add('fold');
      this.toast('빨간 표시를 가려서 검수판을 접었어요. 머리줄을 누르면 펼쳐져요');
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
      if (!el) return;
      const act = el.dataset.act;
      if (act === 'fold-top') {
        this.state.fold.top = !this.state.fold.top;
        this.autoFolded = false;
        if (!this.state.fold.top) {
          this.userOpened = true;
          this.ui.top.style.maxHeight = '';
        }
        this.applyView();
        this.save();
        this.schedule();
      } else if (act === 'fold-nav') {
        this.state.fold.nav = !this.state.fold.nav;
        this.applyView();
        this.save();
      } else if (act === 'mobile' || act === 'split') {
        if (act === 'mobile') this.state.view = this.state.view === 'mobile' ? 'auto' : 'mobile';
        else this.state.view = this.mode === 'split' ? 'full' : 'auto';
        this.applyView();
        this.save();
        this.placed = 0;
        this.ui.top.style.maxHeight = '';
        this.ui.nav.classList.remove('left');
        const said = { mobile: '휴대폰 폭(390px)으로 보고 있어요', split: '사이트 옆에 나란히 보고 있어요. 빨간 표시를 가리지 않아요', full: '사이트 위에 겹쳐 보고 있어요' };
        this.toast(said[this.mode]);
        setTimeout(() => this.tick(), 120);
      } else if (act === 'overview') {
        this.state.fold.top = false;
        this.userOpened = true;
        this.applyView();
        this.save();
      } else if (act === 'close') {
        this.confirm('검수판을 닫을까요?', '체크와 댓글은 이 브라우저에 남아 있어요. 검수 링크를 다시 열면 이어서 볼 수 있어요.', '닫기', () => this.destroy());
      } else if (act === 'tab') {
        this.state.tab = el.dataset.tab;
        this.ui.body.scrollTop = 0;
        this.save();
        this.renderTop();
      } else if (act === 'more') {
        const q = this.ui.body.querySelector(`.qt[data-q="${el.dataset.q}"]`);
        if (q) {
          const open = q.classList.toggle('clamp');
          el.textContent = open ? '더 보기' : '접기';
        }
      } else if (act === 'filter') {
        this.state.filter = el.dataset.f;
        this.save();
        this.renderAll();
      } else if (act === 'go') {
        this.go(el.dataset.id);
      } else if (act === 'prev' || act === 'next') {
        const n = this.neighbor(act === 'next' ? 1 : -1);
        if (n) this.go(n.id);
      } else if (act === 'done') {
        this.toggleDone();
      } else if (act === 'export') {
        this.exportModal();
      } else if (act === 'reload') {
        const it = this.current();
        if (it) this.go(it.id, { reload: true });
      } else if (act === 'open-out') {
        const it = this.current();
        if (it && it.url) window.open(it.url, '_blank', 'noopener');
      } else if (act === 'step') {
        this.focusStep(Number(el.dataset.step));
      } else if (act === 'copy') {
        const it = this.current();
        const step = it && it.steps[Number(el.dataset.step)];
        if (step && step.copy) this.copy(step.copy, '복사했어요. 화면의 입력칸에 붙여 넣어 주세요');
      } else if (act === 'comment') {
        this.comment();
      } else if (act === 'del') {
        this.deleteComment(el.dataset.cid);
      } else if (act === 'pick') {
        this.startPick();
      } else if (act === 'unpin') {
        this.draftPin = null;
        this.renderNav();
      } else if (act === 'pin-show') {
        this.showPin(el.dataset.cid);
      } else if (act === 'rename') {
        this.askName(() => this.renderNav(), true);
      } else if (act === 'modal-cancel') {
        this.closeModal(true);
      } else if (act === 'modal-ok') {
        this.finishModal();
      } else if (act === 'modal-copy') {
        const ta = this.ui.modal.querySelector('textarea');
        if (ta) this.copy(ta.value, '복사했어요. 이슈 댓글에 붙여 넣고 "댓글 단 거 고쳐줘"라고 적어 주세요');
      } else if (act === 'tip-ok') {
        local.put(TIP, '1');
        this.ui.tip.hidden = true;
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
        const it = this.current();
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

    toggleDone() {
      const it = this.current();
      if (!it) return;
      const entry = this.entry(it.id);
      if (entry.status === 'done') {
        entry.status = freshComments(entry).length ? 'needs' : 'todo';
        entry.at = Date.now();
        this.save();
        this.toast('검수완료를 취소했어요');
        this.renderAll();
        return;
      }
      entry.status = 'done';
      entry.at = Date.now();
      entry.by = this.name();
      this.save();
      const wraps = this.state.filter === 'left' || this.state.filter === 'needs';
      const next = this.neighbor(1) || (wraps ? this.firstMatching(this.state.filter, it.id) : null);
      if (next) {
        this.toast(`${it.no}번 검수완료 · 다음 항목으로 넘어가요`);
        setTimeout(() => this.go(next.id), 450);
      } else {
        this.toast(`${it.no}번 검수완료`);
        this.renderAll();
      }
    }

    comment() {
      const it = this.current();
      if (!it) return;
      const ta = this.ui.nb.querySelector('textarea[data-role="draft"]');
      const text = String(ta ? ta.value : this.draft).trim();
      if (!text) {
        this.toast('댓글 내용을 적어 주세요');
        if (ta) ta.focus();
        return;
      }
      this.draft = text;
      this.askName(() => {
        const entry = this.entry(it.id);
        entry.comments.push({ id: uid(), by: this.name() || '검수자', at: Date.now(), round: this.spec.round, text, pin: this.draftPin || null });
        entry.status = 'needs';
        entry.at = Date.now();
        this.draft = '';
        this.draftPin = null;
        this.targetsFor = '';
        this.save();
        this.renderAll();
        this.tick();
        this.toast('댓글을 남기고 추가 검토로 표시했어요');
      });
    }

    deleteComment(cid) {
      const it = this.current();
      if (!it) return;
      this.confirm('이 댓글을 지울까요?', '지운 댓글은 AI에게 넘기는 글에서도 빠져요.', '지우기', () => {
        const entry = this.entry(it.id);
        entry.comments = entry.comments.filter((cm) => cm.id !== cid);
        if (entry.status === 'needs' && !freshComments(entry).length) entry.status = 'todo';
        this.targetsFor = '';
        this.save();
        this.renderAll();
        this.tick();
        this.toast('댓글을 지웠어요');
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

    exportModal() {
      const text = buildExport(this.spec, this.state, this.name());
      const c = this.counts();
      this.modal(`<h3>AI에게 넘기기</h3><p>아래 글을 복사해서 이슈 댓글에 붙여 넣고 "댓글 단 거 다 고쳐줘"라고 적어 주세요. 추가 검토 ${c.needs}개를 고치고, 검수완료 ${c.done}개는 다음 검수판에서 빠져요.</p>`
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
      this.renderNav();
      const ta = this.ui.nb.querySelector('textarea[data-role="draft"]');
      if (ta) ta.focus();
      this.toast('위치를 붙였어요. 댓글을 적고 [댓글 남기기]를 눌러 주세요');
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
      const it = this.current();
      const cm = it && this.entry(it.id).comments.find((x) => x.id === cid);
      if (cm && cm.pin && pageKey(cm.pin.page) !== pageKey(this.href())) {
        this.openUrl(cm.pin.page);
        this.toast('댓글을 남긴 화면으로 옮겨요');
        return;
      }
      this.toast('지금 화면에서 그 자리를 찾지 못했어요');
    }

    showTip() {
      if (!this.spec || local.text(TIP)) return;
      const nav = this.ui.nav.getBoundingClientRect();
      this.ui.tip.innerHTML = '오른쪽 아래 <b>다음 ›</b>을 누르면 다음 검수 항목으로 넘어가고 빨간 표시가 따라가요. 다 봤으면 <b>검수완료</b>, 고칠 게 있으면 댓글을 남겨 주세요. 끝나면 오른쪽 위 빨간 상자의 <b>AI에게 넘기기</b>로 한 번에 보내요.<button type="button" data-act="tip-ok">알겠어요</button>';
      if (!this.isPhone()) this.ui.tip.style.bottom = `${Math.max(16, innerHeight - nav.bottom + 8)}px`;
      this.ui.tip.hidden = false;
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
        if (!options.quiet) flash('이 주소에 저장된 검수판이 없어요. 검수 링크를 먼저 열어 주세요');
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
  };
  window.qaReview = api;

  const readParam = () => {
    const pieces = `${String(location.hash || '').replace(/^#/, '')}&${String(location.search || '').replace(/^\?/, '')}`.split('&');
    const find = (key) => {
      const hit = pieces.find((p) => p === key || p.indexOf(`${key}=`) === 0);
      return hit == null ? null : attempt(() => decodeURIComponent(hit.slice(key.length + 1)), '');
    };
    const value = find(PARAM);
    if (value != null) return { value: value.trim(), item: find(ITEM_PARAM) || '' };
    const legacy = find(HASH.slice(0, -1));
    return legacy != null ? { value: legacy.trim(), item: '' } : null;
  };

  const dropParam = () => attempt(() => {
    const strip = (raw) => raw.split('&').filter((p) => p && !/^(qa|qa-item|qa-review)(=|$)/.test(p)).join('&');
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
        flash('검수판을 껐어요. 다시 보려면 주소 끝에 #qa=on 을 붙여 주세요');
        return true;
      }
      if (!param.value || param.value === 'on') {
        api.resume({ start: param.item });
        return true;
      }
      try {
        const spec = await decodeSpec(/^[0-2]\./.test(param.value) ? param.value : `2.${param.value}`);
        api.open(spec, { url: location.href.split('#')[0], start: param.item });
      } catch (e) {
        flash('검수 링크를 읽지 못했어요. 링크가 끝까지 복사됐는지 확인해 주세요');
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
