// Prodavačka – hra na obchod. Všechno se ukládá jen v tomto zařízení (localStorage), nic se nikam neposílá.
(() => {
  'use strict';

  const KEY = 'prodavacka-v1';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);

  // ---------- barvy a smajlíci ----------
  const COLORS = [
    '#ffd6d6', '#ffb4a2', '#ffcf99', '#ffe680', '#fff3b0', '#d8f3a6', '#b7e4c7', '#a7f3d0',
    '#b5e8f7', '#a0c4ff', '#cdb4ff', '#f1c0e8', '#ffc6ff', '#e9d8c4', '#e5e5e5',
    '#e63946', '#f77f00', '#2a9d8f', '#3a86ff', '#8338ec', '#ff006e', '#6d4c41', '#264653',
  ];
  const EMOJI = (
    '🍎 🍏 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🧄 🧅 🥔 🍠 🍄 🥜 🌰 ' +
    '🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🥚 🍳 🧈 🥓 🥩 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🌮 🌯 🥗 🍝 🍜 🍲 🍣 🍱 🥟 🍙 🍚 ' +
    '🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍿 🥛 🍼 ☕ 🍵 🧃 🥤 🧋 💧 🧊 ' +
    '🧸 🪀 ⚽ 🏀 🎈 🎁 🎀 🪁 🚗 🚂 ✈️ 🚀 🦄 🐶 🐱 🐰 🐻 🐼 🦊 🐸 🐠 🦋 🌸 🌻 🌷 🌈 ⭐ 💎 👑 💍 ' +
    '🖍️ ✏️ 📚 📒 🎨 🧩 🎲 🎮 🎧 📱 💡 🧦 👕 👗 👟 🎩 🧢 👓 🎒 ☂️ 🧴 🧼 🧻 🪥 💊 🩹 🛒 🏷️ 💰 🎫'
  ).split(' ').filter(Boolean);

  // ---------- výchozí obchod ----------
  function defaults() {
    const cats = [
      { id: 'ovoce', name: 'Ovoce', emoji: '🍎', color: '#ffd6d6' },
      { id: 'zelenina', name: 'Zelenina', emoji: '🥕', color: '#d8f3a6' },
      { id: 'pecivo', name: 'Pečivo', emoji: '🥐', color: '#ffcf99' },
      { id: 'mlecne', name: 'Mléčné', emoji: '🧀', color: '#fff3b0' },
      { id: 'pití', name: 'Pití', emoji: '🧃', color: '#b5e8f7' },
      { id: 'sladkosti', name: 'Sladkosti', emoji: '🍭', color: '#f1c0e8' },
      { id: 'hracky', name: 'Hračky', emoji: '🧸', color: '#cdb4ff' },
    ];
    const P = (catId, name, emoji, price, sound = 'pip') => ({ id: uid(), catId, name, emoji, price, color: null, sound });
    const products = [
      P('ovoce', 'Jablko', '🍎', 5), P('ovoce', 'Banán', '🍌', 6), P('ovoce', 'Hruška', '🍐', 5), P('ovoce', 'Jahody', '🍓', 30),
      P('ovoce', 'Hrozny', '🍇', 25), P('ovoce', 'Pomeranč', '🍊', 8), P('ovoce', 'Meloun', '🍉', 40), P('ovoce', 'Třešně', '🍒', 20),
      P('zelenina', 'Mrkev', '🥕', 3), P('zelenina', 'Okurka', '🥒', 12), P('zelenina', 'Rajče', '🍅', 4), P('zelenina', 'Paprika', '🫑', 10),
      P('zelenina', 'Brokolice', '🥦', 25), P('zelenina', 'Brambory', '🥔', 15), P('zelenina', 'Kukuřice', '🌽', 10), P('zelenina', 'Salát', '🥬', 18),
      P('pecivo', 'Rohlík', '🥖', 3), P('pecivo', 'Chleba', '🍞', 35), P('pecivo', 'Croissant', '🥐', 15), P('pecivo', 'Preclík', '🥨', 12),
      P('mlecne', 'Mléko', '🥛', 22), P('mlecne', 'Sýr', '🧀', 40), P('mlecne', 'Vajíčko', '🥚', 5), P('mlecne', 'Máslo', '🧈', 55),
      P('pití', 'Džus', '🧃', 20), P('pití', 'Limonáda', '🥤', 25), P('pití', 'Voda', '💧', 10), P('pití', 'Čaj', '🍵', 15),
      P('sladkosti', 'Lízátko', '🍭', 10, 'cink'), P('sladkosti', 'Čokoláda', '🍫', 30, 'mnam'), P('sladkosti', 'Bonbon', '🍬', 5, 'cink'),
      P('sladkosti', 'Zmrzlina', '🍦', 25, 'mnam'), P('sladkosti', 'Dort', '🎂', 120, 'zvonek'), P('sladkosti', 'Sušenka', '🍪', 8, 'mnam'),
      P('hracky', 'Medvídek', '🧸', 150, 'zvonek'), P('hracky', 'Míč', '⚽', 80, 'boing'), P('hracky', 'Autíčko', '🚗', 60, 'boing'),
      P('hracky', 'Balónek', '🎈', 10, 'bublina'), P('hracky', 'Pastelky', '🖍️', 40, 'cink'),
    ];
    return {
      shop: { name: 'Můj obchůdek', subtitle: '', footer: 'Děkujeme za nákup! Přijďte zas.' },
      cur: 'Kč',
      cashier: '',
      cashiers: [],
      categories: cats,
      products,
      customers: [
        { id: uid(), name: 'Maminka', points: 0 },
        { id: uid(), name: 'Tatínek', points: 0 },
      ],
      rewards: [
        { id: uid(), name: 'Bonbon zdarma', cost: 10 },
        { id: uid(), name: 'Lízátko zdarma', cost: 20 },
        { id: uid(), name: 'Pusa od prodavačky', cost: 5 },
      ],
      pointsPerKc: 10,       // 1 bod za každých 10 Kč (0 = nedávat automaticky)
      receiptNo: 0,
      sound: true,
      printer: { energy: 'normal', chunk: 'normal' },
      cart: [],
      selCat: 'ovoce',
    };
  }

  // ---------- uložení ----------
  let S;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        S = Object.assign(defaults(), d);
        S.shop = Object.assign(defaults().shop, d.shop || {});
        S.printer = Object.assign(defaults().printer, d.printer || {});
        return;
      }
    } catch (e) { /* poškozená data – začneme znovu */ }
    S = defaults();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Nepovedlo se uložit 😕'); }
  }

  // ---------- pomocníci ----------
  const money = (v) => Receipt.money(v, S.cur);
  const parseNum = (v) => {
    const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const prod = (id) => S.products.find((p) => p.id === id);
  const cat = (id) => S.categories.find((c) => c.id === id);
  const tileColor = (p) => p.color || (cat(p.catId) || {}).color || '#e5e5e5';
  function isDark(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }
  function cartTotal() {
    return S.cart.reduce((s, c) => { const p = prod(c.pid); return s + (p ? p.price * c.qty : 0); }, 0);
  }
  function cartCount() { return S.cart.reduce((s, c) => s + c.qty, 0); }

  let toastT;
  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), ms);
  }

  // ---------- dialog ----------
  let onModalClose = null;
  function openModal(html, onClose) {
    // nový prvek pokaždé, aby se nehromadily staré posluchače kliknutí
    const old = $('#sheet');
    const view = html.slice(0, 60); // stejné okno překreslené znovu → zachovat posun
    const keepScroll = !$('#modal').classList.contains('hidden') && old.dataset.view === view ? old.scrollTop : 0;
    const fresh = old.cloneNode(false);
    fresh.dataset.view = view;
    fresh.classList.toggle('anim', $('#modal').classList.contains('hidden'));
    fresh.innerHTML = html;
    old.replaceWith(fresh);
    // krok v historii, aby gesto „zpět“ zavřelo okno, a ne celou hru
    if ($('#modal').classList.contains('hidden') && !(history.state && history.state.modal)) {
      try { history.pushState({ modal: 1 }, ''); } catch (e) { /* nic */ }
    }
    $('#modal').classList.remove('hidden');
    onModalClose = onClose || null;
    fresh.scrollTop = keepScroll;
  }
  function closeModal(fromBack) {
    if ($('#modal').classList.contains('hidden')) return;
    $('#modal').classList.add('hidden');
    const old = $('#sheet');
    old.replaceWith(old.cloneNode(false));
    const f = onModalClose; onModalClose = null;
    if (f) f();
    if (!fromBack && history.state && history.state.modal) {
      try { history.replaceState(null, ''); } catch (e) { /* nic */ }
    }
  }
  window.addEventListener('popstate', () => closeModal(true));
  $('#modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
    if (e.target.closest('[data-close]')) closeModal();
  });
  const head = (title) => `<h2>${title}<button class="x" data-close aria-label="Zavřít">✕</button></h2>`;

  // ---------- vykreslení hlavní obrazovky ----------
  let editMode = false;

  function renderTop() {
    $('#shopNameText').textContent = S.shop.name || 'Obchůdek';
    $('#cashierText').textContent = S.cashier || 'klepni a napiš jméno';
    $('#editBtn').classList.toggle('active', editMode);
    $('#editHint').classList.toggle('hidden', !editMode);
    const st = Printer.status();
    const dot = $('#printerDot');
    dot.className = 'dot ' + (st.busy ? 'busy' : st.connected ? 'on' : 'off');
  }

  function renderCats() {
    if (!S.categories.some((c) => c.id === S.selCat)) S.selCat = S.categories[0] ? S.categories[0].id : null;
    const html = S.categories.map((c) =>
      `<button class="cat ${c.id === S.selCat ? 'sel' : ''}" data-cat="${esc(c.id)}" style="background:${esc(c.color)};color:${isDark(c.color) ? '#fff' : '#2b2140'}">${esc(c.emoji)} ${esc(c.name)}${editMode ? ' ✏️' : ''}</button>`
    ).join('') + (editMode ? '<button class="cat add" data-addcat>＋ Nové oddělení</button>' : '');
    $('#cats').innerHTML = html;
  }

  function tileHtml(p, extra = '') {
    const col = tileColor(p);
    return `<button class="tile ${isDark(col) ? 'dark' : ''}" data-pid="${esc(p.id)}" style="background:${esc(col)}" ${extra}>
      ${editMode ? '<span class="pen">✏️</span>' : ''}
      <span class="emo">${esc(p.emoji || '🏷️')}</span>
      <span class="nm">${esc(p.name)}</span>
      <span class="pr">${esc(money(p.price))}</span>
    </button>`;
  }

  function renderTiles() {
    const list = S.products.filter((p) => p.catId === S.selCat);
    let html = list.map((p) => tileHtml(p)).join('');
    if (editMode || !list.length) html += `<button class="tile add" data-addprod><span class="emo">＋</span><span class="nm">Nové zboží</span></button>`;
    if (!S.categories.length) html = '<div class="empty">Nejdřív si v režimu úprav (✏️) založ oddělení.</div>';
    $('#tiles').innerHTML = html;
  }

  function renderCart() {
    const items = S.cart.map((c) => {
      const p = prod(c.pid); if (!p) return '';
      return `<div class="ci">
        <span class="e">${esc(p.emoji)}</span>
        <span class="t"><b>${esc(p.name)}</b><small>${esc(money(p.price))}</small></span>
        <span class="qty"><button data-dec="${esc(c.pid)}">−</button><span>${c.qty}</span><button data-inc="${esc(c.pid)}">+</button></span>
        <span class="sum">${esc(money(p.price * c.qty))}</span>
      </div>`;
    }).join('');
    $('#cartItems').innerHTML = items || '<div class="empty">Košík je prázdný.<br>Klepni na zboží 👆</div>';
    $('#cartCount').textContent = cartCount();
    $('#cartTotal').textContent = money(cartTotal());
    $('#cartTotalMini').textContent = money(cartTotal());
  }

  function renderAll() { renderTop(); renderCats(); renderTiles(); renderCart(); }

  // ---------- nákup ----------
  function addToCart(pid, tileEl) {
    const p = prod(pid); if (!p) return;
    Sound.play(p.sound);
    if (navigator.vibrate) try { navigator.vibrate(15); } catch (e) { /* nic */ }
    const c = S.cart.find((x) => x.pid === pid);
    if (c) c.qty++; else S.cart.push({ pid, qty: 1 });
    save(); renderCart();
    if (tileEl) {
      tileEl.classList.add('pop'); setTimeout(() => tileEl.classList.remove('pop'), 120);
      flyToCart(p.emoji, tileEl);
    }
  }

  function flyToCart(emoji, fromEl) {
    const a = fromEl.getBoundingClientRect();
    const b = $('#cartHead').getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'flyer'; f.textContent = emoji;
    f.style.left = (a.left + a.width / 2 - 20) + 'px';
    f.style.top = (a.top + a.height / 2 - 24) + 'px';
    document.body.appendChild(f);
    requestAnimationFrame(() => {
      f.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + 10 - a.top - a.height / 2}px) scale(.4)`;
      f.style.opacity = '0.2';
    });
    setTimeout(() => f.remove(), 600);
  }

  $('#tiles').addEventListener('click', (e) => {
    Sound.unlock();
    const t = e.target.closest('.tile'); if (!t) return;
    if (t.hasAttribute('data-addprod')) return editProduct(null);
    const pid = t.getAttribute('data-pid');
    if (editMode) editProduct(pid); else addToCart(pid, t);
  });

  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('.cat'); if (!b) return;
    Sound.fx('click');
    if (b.hasAttribute('data-addcat')) return editCategory(null);
    const id = b.getAttribute('data-cat');
    if (editMode && id === S.selCat) return editCategory(id);
    S.selCat = id; save(); renderCats(); renderTiles();
  });

  $('#cartItems').addEventListener('click', (e) => {
    const inc = e.target.closest('[data-inc]'); const dec = e.target.closest('[data-dec]');
    if (inc) { const c = S.cart.find((x) => x.pid === inc.dataset.inc); if (c) c.qty++; Sound.fx('click'); }
    if (dec) {
      const c = S.cart.find((x) => x.pid === dec.dataset.dec);
      if (c) { c.qty--; if (c.qty <= 0) S.cart = S.cart.filter((x) => x !== c); }
      Sound.fx('remove');
    }
    save(); renderCart();
  });

  $('#cartHead').addEventListener('click', () => $('#cart').classList.toggle('open'));
  $('#clearBtn').addEventListener('click', () => {
    if (!S.cart.length) return;
    S.cart = []; save(); renderCart(); Sound.fx('remove');
  });

  // ---------- úpravy zboží ----------
  function colorPicker(sel, allowNone) {
    return `<div class="swatches">${allowNone ? `<button class="sw ${!sel ? 'sel' : ''}" data-color="" title="Podle oddělení" style="background:repeating-linear-gradient(45deg,#fff 0 6px,#eee 6px 12px)"></button>` : ''}${
      COLORS.map((c) => `<button class="sw ${c === sel ? 'sel' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>`;
  }
  function emojiPicker(sel) {
    return `<div class="emogrid">${EMOJI.map((e) => `<button class="${e === sel ? 'sel' : ''}" data-emoji="${e}">${e}</button>`).join('')}</div>
      <label class="field"><span>…nebo vlož vlastní obrázek-smajlík</span><input id="fEmoji" maxlength="8" value="${esc(sel)}"></label>`;
  }

  function editProduct(pid) {
    const isNew = !pid;
    const p = isNew
      ? { id: uid(), catId: S.selCat, name: '', emoji: '🏷️', price: 10, color: null, sound: 'pip' }
      : JSON.parse(JSON.stringify(prod(pid)));
    if (!p) return;

    const draw = () => {
      openModal(`${head(isNew ? '＋ Nové zboží' : '✏️ Upravit zboží')}
        <div class="preview" id="pv"></div>
        <label class="field"><span>Název</span><input id="fName" maxlength="30" value="${esc(p.name)}" placeholder="např. Jablko"></label>
        <label class="field"><span>Cena (${esc(S.cur)})</span><input id="fPrice" inputmode="decimal" value="${esc(String(p.price).replace('.', ','))}"></label>
        <label class="field"><span>Oddělení</span><select id="fCat">${S.categories.map((c) => `<option value="${esc(c.id)}" ${c.id === p.catId ? 'selected' : ''}>${esc(c.emoji)} ${esc(c.name)}</option>`).join('')}</select></label>
        <h3>Obrázek</h3>${emojiPicker(p.emoji)}
        <h3>Barva dlaždice</h3>${colorPicker(p.color, true)}
        <h3>Zvuk po klepnutí</h3>
        <div class="chips">${Sound.list.map((s) => `<button class="chip ${s.id === p.sound ? 'sel' : ''}" data-sound="${s.id}">${s.label}</button>`).join('')}</div>
        <div class="row" style="margin-top:18px">
          ${isNew ? '' : '<button class="btn danger" id="del">🗑️ Smazat</button><button class="btn" id="dup">📄 Kopie</button>'}
          <button class="btn ok" id="ok">✔ Uložit</button>
        </div>`);
      const pv = () => { $('#pv').innerHTML = tileHtml(Object.assign({}, p, { name: p.name || 'Název', price: p.price })).replace('<span class="pen">✏️</span>', ''); };
      pv();
      $('#fName').addEventListener('input', (e) => { p.name = e.target.value; pv(); });
      $('#fPrice').addEventListener('input', (e) => { p.price = Math.max(0, parseNum(e.target.value)); pv(); });
      $('#fCat').addEventListener('change', (e) => { p.catId = e.target.value; pv(); });
      $('#fEmoji').addEventListener('input', (e) => { p.emoji = e.target.value.trim() || '🏷️'; pv(); });
      $('#sheet').addEventListener('click', (e) => {
        const em = e.target.closest('[data-emoji]');
        if (em) { p.emoji = em.dataset.emoji; $('#fEmoji').value = p.emoji; document.querySelectorAll('.emogrid .sel').forEach((x) => x.classList.remove('sel')); em.classList.add('sel'); pv(); }
        const co = e.target.closest('[data-color]');
        if (co) { p.color = co.dataset.color || null; document.querySelectorAll('.sw.sel').forEach((x) => x.classList.remove('sel')); co.classList.add('sel'); pv(); }
        const so = e.target.closest('[data-sound]');
        if (so) { p.sound = so.dataset.sound; Sound.play(p.sound); document.querySelectorAll('[data-sound].sel').forEach((x) => x.classList.remove('sel')); so.classList.add('sel'); }
      });
      $('#ok').addEventListener('click', () => {
        p.name = $('#fName').value.trim();
        if (!p.name) { toast('Napiš název zboží ✍️'); $('#fName').focus(); return; }
        p.price = Math.round(Math.max(0, parseNum($('#fPrice').value)) * 100) / 100;
        if (isNew) S.products.push(p);
        else S.products[S.products.findIndex((x) => x.id === p.id)] = p;
        S.selCat = p.catId;
        save(); closeModal(); renderAll(); Sound.fx('approved');
      });
      if (!isNew) {
        $('#del').addEventListener('click', () => {
          if (!confirm(`Opravdu smazat „${p.name}“?`)) return;
          S.products = S.products.filter((x) => x.id !== p.id);
          S.cart = S.cart.filter((c) => c.pid !== p.id);
          save(); closeModal(); renderAll();
        });
        $('#dup').addEventListener('click', () => {
          const c = Object.assign({}, prod(p.id), { id: uid(), name: p.name + ' 2' });
          S.products.push(c); save(); closeModal(); renderAll(); toast('Zkopírováno 📄');
        });
      }
    };
    draw();
  }

  function editCategory(cid) {
    const isNew = !cid;
    const c = isNew ? { id: uid(), name: '', emoji: '🛍️', color: COLORS[Math.floor(Math.random() * 14)] } : Object.assign({}, cat(cid));
    const count = S.products.filter((p) => p.catId === c.id).length;
    openModal(`${head(isNew ? '＋ Nové oddělení' : '✏️ Upravit oddělení')}
      <label class="field"><span>Název oddělení</span><input id="fName" maxlength="24" value="${esc(c.name)}" placeholder="např. Ovoce"></label>
      <h3>Obrázek</h3>${emojiPicker(c.emoji)}
      <h3>Barva</h3>${colorPicker(c.color, false)}
      <p class="hint">Barvu oddělení dostanou všechny jeho dlaždice, pokud jim nedáš vlastní.</p>
      <div class="row" style="margin-top:18px">
        ${isNew ? '' : `<button class="btn danger" id="del">🗑️ Smazat${count ? ` (i ${count} zboží)` : ''}</button>`}
        <button class="btn ok" id="ok">✔ Uložit</button>
      </div>`);
    $('#fEmoji').addEventListener('input', (e) => { c.emoji = e.target.value.trim() || '🛍️'; });
    $('#sheet').addEventListener('click', (e) => {
      const em = e.target.closest('[data-emoji]');
      if (em) { c.emoji = em.dataset.emoji; $('#fEmoji').value = c.emoji; document.querySelectorAll('.emogrid .sel').forEach((x) => x.classList.remove('sel')); em.classList.add('sel'); }
      const co = e.target.closest('[data-color]');
      if (co) { c.color = co.dataset.color; document.querySelectorAll('.sw.sel').forEach((x) => x.classList.remove('sel')); co.classList.add('sel'); }
    });
    $('#ok').addEventListener('click', () => {
      c.name = $('#fName').value.trim();
      if (!c.name) { toast('Napiš název oddělení ✍️'); return; }
      if (isNew) S.categories.push(c); else S.categories[S.categories.findIndex((x) => x.id === c.id)] = c;
      S.selCat = c.id; save(); closeModal(); renderAll();
    });
    if (!isNew) {
      $('#del').addEventListener('click', () => {
        if (!confirm(count ? `Smazat oddělení „${c.name}“ i s ${count} zbožím?` : `Smazat oddělení „${c.name}“?`)) return;
        const gone = new Set(S.products.filter((p) => p.catId === c.id).map((p) => p.id));
        S.products = S.products.filter((p) => !gone.has(p.id));
        S.cart = S.cart.filter((x) => !gone.has(x.pid));
        S.categories = S.categories.filter((x) => x.id !== c.id);
        save(); closeModal(); renderAll();
      });
    }
  }

  $('#editBtn').addEventListener('click', () => { editMode = !editMode; Sound.fx('click'); renderAll(); });

  // ---------- kdo obsluhuje ----------
  $('#cashierBtn').addEventListener('click', () => {
    openModal(`${head('🙋 Kdo dnes obsluhuje?')}
      <label class="field"><span>Jméno prodavačky / prodavače</span><input id="fName" maxlength="24" value="${esc(S.cashier)}" placeholder="např. Ema"></label>
      ${S.cashiers.length ? `<div class="chips">${S.cashiers.map((n) => `<button class="chip" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>` : ''}
      <div class="row" style="margin-top:16px"><button class="btn ok big" id="ok">✔ Hotovo</button></div>`);
    const inp = $('#fName'); setTimeout(() => inp.focus(), 50);
    $('#sheet').addEventListener('click', (e) => { const n = e.target.closest('[data-name]'); if (n) { inp.value = n.dataset.name; } });
    const done = () => {
      S.cashier = inp.value.trim();
      if (S.cashier) S.cashiers = [S.cashier, ...S.cashiers.filter((n) => n !== S.cashier)].slice(0, 8);
      save(); closeModal(); renderTop();
    };
    $('#ok').addEventListener('click', done);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
  });

  // ---------- název obchodu ----------
  $('#shopNameBtn').addEventListener('click', () => openShopSettings());
  function openShopSettings() {
    openModal(`${head('🏪 Můj obchod')}
      <label class="field"><span>Název obchodu (tiskne se nahoře na účtence)</span><input id="fName" maxlength="40" value="${esc(S.shop.name)}"></label>
      <label class="field"><span>Druhý řádek – adresa nebo heslo (nepovinné)</span><input id="fSub" maxlength="60" value="${esc(S.shop.subtitle)}" placeholder="např. Ulice Hraček 1"></label>
      <label class="field"><span>Text na konci účtenky</span><input id="fFoot" maxlength="80" value="${esc(S.shop.footer)}"></label>
      <label class="field"><span>Měna</span><input id="fCur" maxlength="6" value="${esc(S.cur)}"></label>
      <div class="row" style="margin-top:16px"><button class="btn ok big" id="ok">✔ Uložit</button></div>`);
    $('#ok').addEventListener('click', () => {
      S.shop.name = $('#fName').value.trim() || 'Obchůdek';
      S.shop.subtitle = $('#fSub').value.trim();
      S.shop.footer = $('#fFoot').value.trim();
      S.cur = $('#fCur').value.trim() || 'Kč';
      save(); closeModal(); renderAll();
    });
  }

  // ---------- placení ----------
  $('#payBtn').addEventListener('click', () => { Sound.unlock(); startCheckout(); });

  function startCheckout() {
    const total = Math.round(cartTotal() * 100) / 100;
    const pointsOnly = S.cart.length === 0;
    const auto = !pointsOnly && S.pointsPerKc > 0 ? Math.floor(total / S.pointsPerKc) : 0;
    const t = {
      total, pointsOnly,
      customerId: null,
      add: auto,
      use: 0,
      reward: null,
      payment: pointsOnly ? null : null,
      given: null,
    };
    stepPoints(t);
  }

  function stepPoints(t) {
    const cust = S.customers.find((c) => c.id === t.customerId);
    const balance = cust ? cust.points : null;
    const tooMuch = cust && t.use > balance + t.add;
    openModal(`${head(t.pointsOnly ? '⭐ Věrnostní body' : '💰 Placení')}
      ${t.pointsOnly ? '<p class="hint" style="text-align:center">Košík je prázdný – můžeš jen připsat nebo strhnout body.</p>' : `<div class="bigtotal">${esc(money(t.total))}</div>`}
      <h3>💳 Věrnostní karta zákazníka</h3>
      <div class="chips">
        <button class="chip ${!t.customerId ? 'sel' : ''}" data-cust="">Bez karty</button>
        ${S.customers.map((c) => `<button class="chip ${c.id === t.customerId ? 'sel' : ''}" data-cust="${esc(c.id)}">${esc(c.name)} <small>⭐${c.points}</small></button>`).join('')}
        <button class="chip" data-newcust>＋ Nová karta</button>
      </div>
      <div class="pointsbox">
        <b>⭐ Připsat body</b>
        <div class="stepper"><button data-add="-1">−</button><span class="val">${t.add ? '+' + t.add : '0'}</span><button data-add="1">+</button>
          <span class="quick"><button data-add="5">+5</button><button data-add="10">+10</button><button data-add="0">0</button></span></div>
        <div style="height:12px"></div>
        <b>🎁 Strhnout body (odměna)</b>
        <div class="chips" style="margin:6px 0">${S.rewards.map((r) => `<button class="chip ${t.reward === r.name ? 'sel' : ''}" data-reward="${esc(r.id)}">${esc(r.name)} <small>−${r.cost}</small></button>`).join('')}</div>
        <div class="stepper"><button data-use="-1">−</button><span class="val">${t.use ? '−' + t.use : '0'}</span><button data-use="1">+</button>
          <span class="quick"><button data-use="5">+5</button><button data-use="10">+10</button><button data-use="0">0</button></span></div>
        ${cust ? `<p class="hint">Na kartě je teď ⭐ ${balance}, po nákupu bude ⭐ ${balance + t.add - t.use}.</p>` : ''}
        ${tooMuch ? '<p class="hint" style="color:var(--warn)">Na kartě není dost bodů 😮</p>' : ''}
      </div>
      ${t.pointsOnly ? `<div class="row" style="margin-top:16px"><button class="btn ok big" id="next" ${tooMuch || (!t.add && !t.use) ? 'disabled' : ''}>✔ Hotovo</button></div>` : `
      <h3>Jak zákazník platí?</h3>
      <div class="paygrid">
        <button class="payopt" data-pay="card"><span class="e">💳</span>Kartou</button>
        <button class="payopt" data-pay="cash"><span class="e">💵</span>Hotově</button>
      </div>`}`);

    const sheet = $('#sheet');
    sheet.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-cust')) { t.customerId = b.dataset.cust || null; Sound.fx('click'); return stepPoints(t); }
      if (b.hasAttribute('data-newcust')) {
        const n = prompt('Jméno na nové věrnostní kartě:');
        if (n && n.trim()) { const c = { id: uid(), name: n.trim().slice(0, 24), points: 0 }; S.customers.push(c); save(); t.customerId = c.id; }
        return stepPoints(t);
      }
      if (b.hasAttribute('data-add')) { const v = +b.dataset.add; t.add = v === 0 ? 0 : Math.max(0, t.add + v); Sound.fx('click'); return stepPoints(t); }
      if (b.hasAttribute('data-use')) { const v = +b.dataset.use; t.use = v === 0 ? 0 : Math.max(0, t.use + v); t.reward = null; Sound.fx('click'); return stepPoints(t); }
      if (b.hasAttribute('data-reward')) {
        const r = S.rewards.find((x) => x.id === b.dataset.reward);
        if (t.reward === r.name) { t.reward = null; t.use = 0; } else { t.reward = r.name; t.use = r.cost; }
        Sound.play('cink'); return stepPoints(t);
      }
      if (b.hasAttribute('data-pay')) {
        if (tooMuch) { Sound.fx('error'); toast('Na kartě není dost bodů'); return; }
        t.payment = b.dataset.pay;
        return t.payment === 'card' ? stepCard(t) : stepCash(t);
      }
      if (b.id === 'next') return finish(t);
    });
  }

  function stepCard(t) {
    openModal(`${head('💳 Platba kartou')}
      <div class="bigtotal">${esc(money(t.total))}</div>
      <div class="cardanim"><span class="terminal">📟</span><p class="hint" id="cardMsg">Přilož kartu k terminálu</p></div>
      <div class="row"><button class="btn ghost" id="back">← Zpět</button><button class="btn primary big" id="tap">💳 Přiložit kartu</button></div>`);
    $('#back').addEventListener('click', () => stepPoints(t));
    $('#tap').addEventListener('click', () => {
      $('#tap').disabled = true; $('#back').disabled = true;
      Sound.fx('card');
      const msg = $('#cardMsg');
      msg.textContent = 'Komunikuji s bankou…';
      // když se okno zavře během „placení“, nákup se nedokončí
      const t1 = setTimeout(() => { Sound.fx('approved'); msg.textContent = '✅ Platba schválena'; }, 1300);
      const t2 = setTimeout(() => { onModalClose = null; finish(t); }, 2100);
      onModalClose = () => { clearTimeout(t1); clearTimeout(t2); };
    });
  }

  function stepCash(t) {
    let entry = '';
    const draw = () => {
      const given = parseNum(entry);
      const change = Math.round((given - t.total) * 100) / 100;
      const ok = entry !== '' && change >= 0;
      openModal(`${head('💵 Platba hotově')}
        <div class="bigtotal">${esc(money(t.total))}</div>
        <p class="hint" style="text-align:center">Kolik ti zákazník dal?</p>
        <div class="cashshow">${entry ? esc(money(given)) : '–'}</div>
        <div class="quick" style="justify-content:center">
          <button data-bill="exact">Přesně</button>${[10, 20, 50, 100, 200, 500, 1000, 2000].map((b) => `<button data-bill="${b}">${b}</button>`).join('')}
        </div>
        <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-k="${n}">${n}</button>`).join('')}<button data-k="C">C</button><button data-k="0">0</button><button data-k="⌫">⌫</button></div>
        ${entry ? `<div class="change ${ok ? '' : 'bad'}">${ok ? `Vrátit: ${esc(money(change))}` : `Chybí ještě ${esc(money(-change))}`}</div>` : ''}
        <div class="row" style="margin-top:12px"><button class="btn ghost" id="back">← Zpět</button><button class="btn ok big" id="ok" ${ok ? '' : 'disabled'}>✔ Zaplaceno</button></div>`);
      $('#sheet').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.k) {
          const k = b.dataset.k;
          if (k === 'C') entry = ''; else if (k === '⌫') entry = entry.slice(0, -1); else if (entry.length < 6) entry = (entry + k).replace(/^0+(?=\d)/, '');
          Sound.fx('click'); return draw();
        }
        if (b.dataset.bill) {
          entry = b.dataset.bill === 'exact' ? String(t.total) : String(parseNum(entry) + +b.dataset.bill);
          Sound.fx('click'); return draw();
        }
        if (b.id === 'back') return stepPoints(t);
        if (b.id === 'ok') { t.given = given; t.change = change; return finish(t); }
      });
    };
    draw();
  }

  // dokončení nákupu: body na kartu, číslo účtenky, vykreslení účtenky
  function finish(t) {
    const cust = S.customers.find((c) => c.id === t.customerId);
    let before = null, after = null;
    if (cust) { before = cust.points; cust.points = Math.max(0, cust.points + t.add - t.use); after = cust.points; }
    S.receiptNo = (S.receiptNo || 0) + 1;
    const data = {
      shop: S.shop, cur: S.cur, cashier: S.cashier, no: S.receiptNo, date: new Date(),
      items: S.cart.map((c) => { const p = prod(c.pid); return p ? { name: p.name, emoji: p.emoji, qty: c.qty, price: p.price } : null; }).filter(Boolean),
      total: t.total, payment: t.payment, given: t.payment === 'cash' ? t.given : null, change: t.change,
      customer: cust ? { name: cust.name, before, after } : null,
      pointsAdded: t.add, pointsUsed: t.use, reward: t.reward,
    };
    S.cart = [];
    S.lastReceipt = Object.assign({}, data, { date: data.date.toISOString() });
    save(); renderCart();
    Sound.fx('kaching');
    showReceipt(data, true);
  }

  function showReceipt(data, fresh) {
    const canvas = Receipt.render(data);
    const url = canvas.toDataURL('image/png');
    openModal(`${head(fresh ? '🎉 Hotovo!' : '🧾 Poslední účtenka')}
      ${fresh ? '<div class="done">Děkujeme za nákup!</div>' : ''}
      <img class="receiptImg" src="${url}" alt="Účtenka">
      <p class="hint" id="printMsg" style="text-align:center"></p>
      <div class="row" style="margin-top:10px">
        <button class="btn primary big" id="print">🖨️ Vytisknout účtenku</button>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn ok big" data-close>${fresh ? '🙋 Další zákazník' : 'Zavřít'}</button></div>`);
    $('#print').addEventListener('click', async () => {
      const btn = $('#print');
      btn.disabled = true;
      const msg = $('#printMsg'); // když okno mezitím zavře, píše se do odpojeného prvku – tisk běží dál
      const ok = await printWithUi(canvas, (m) => { msg.textContent = m; });
      btn.disabled = false;
      if (ok) btn.textContent = '🖨️ Vytisknout znovu';
    });
  }

  // tisk s hláškami; když tiskárna není připojená, vyvolá výběr tiskárny
  async function printWithUi(canvas, say) {
    const st = Printer.status();
    if (!st.supported) { say('Tisk funguje jen v Chrome na Androidu (nebo v počítači). Otevři hru v Chrome.'); Sound.fx('error'); return false; }
    try {
      if (!st.connected && !Printer.hasDevice()) { say('Vyber tiskárnu ze seznamu…'); await Printer.connect(); }
      say('Tisknu… 🖨️');
      Sound.fx('printer');
      await Printer.printCanvas(canvas, {
        energy: S.printer.energy, chunk: S.printer.chunk,
        onProgress: (f) => say(`Tisknu… ${Math.round(f * 100)} %`),
      });
      say('✅ Vytištěno!');
      return true;
    } catch (e) {
      if (!/busy/.test(String(e && e.message))) Sound.fx('error');
      say(printError(e));
      return false;
    } finally { renderTop(); }
  }

  function printError(e) {
    const m = String((e && (e.name + ' ' + e.message)) || e);
    if (/busy/.test(m)) return 'Ještě tisknu, chvilku počkej 🙂';
    if (/notprinter/.test(m)) return 'Tohle zařízení není tiskárna. Zkus to znovu a vyber „MX05“ (nebo podobně).';
    if (/NotFoundError|cancel/i.test(m)) return 'Tiskárna nebyla vybrána. Zkus to znovu a vyber „MX05“ (nebo podobně).';
    if (/nobt/.test(m)) return 'Tento prohlížeč neumí Bluetooth. Použij Chrome.';
    if (/NetworkError|lost|GATT|disconnect/i.test(m)) return 'Spojení s tiskárnou se přerušilo. Je zapnutá a blízko? Zkus to znovu.';
    if (/SecurityError/i.test(m)) return 'Prohlížeč nepovolil Bluetooth. Je stránka otevřená přes https?';
    return 'Tisk se nepovedl: ' + m;
  }

  // ---------- tiskárna ----------
  $('#printerBtn').addEventListener('click', openPrinter);
  function openPrinter() {
    const st = Printer.status();
    const opt = (key, val, label) => `<button class="chip ${S.printer[key] === val ? 'sel' : ''}" data-p="${key}" data-v="${val}">${label}</button>`;
    openModal(`${head('🖨️ Tiskárna')}
      <p style="font-weight:800;font-size:18px">${st.connected ? `✅ Připojeno: ${esc(st.name)}` : st.supported ? '⚪ Tiskárna není připojená' : '⚠️ Tento prohlížeč neumí Bluetooth – otevři hru v Chrome.'}</p>
      ${st.outOfPaper ? '<p class="hint" style="color:var(--warn)">Došel papír? 🧻</p>' : ''}
      <div class="row">
        <button class="btn primary" id="conn" ${st.supported ? '' : 'disabled'}>🔗 ${st.connected ? 'Připojit jinou' : 'Připojit tiskárnu'}</button>
        <button class="btn" id="test" ${st.supported ? '' : 'disabled'}>🧪 Zkušební tisk</button>
      </div>
      <p class="hint" id="printMsg"></p>
      <h3>Sytost tisku</h3>
      <div class="chips">${opt('energy', 'light', '☁️ Světlá')}${opt('energy', 'normal', '🙂 Normální')}${opt('energy', 'dark', '🌑 Tmavá')}</div>
      <h3>Přenos dat</h3>
      <div class="chips">${opt('chunk', 'normal', '🚀 Normální')}${opt('chunk', 'slow', '🐢 Pomalý')}</div>
      <p class="hint">Když tiskárna tiskne nesmysly nebo jen kus účtenky, přepni na „Pomalý“.</p>
      <h3>Jak na to</h3>
      <p class="hint">1. Zapni tiskárnu a na tabletu Bluetooth.<br>
      2. Zavři aplikaci FunPrint (tiskárna umí mluvit jen s jednou aplikací naráz).<br>
      3. Klepni na „Připojit tiskárnu“ a vyber ze seznamu „MX05“ (nebo podobný název).<br>
      4. Tiskárnu nepáruj v nastavení Androidu – stačí ji vybrat tady.<br>
      Nevidíš ji v seznamu? <button class="minibtn" id="all">Ukázat všechna zařízení</button></p>
      ${st.connected ? '<div class="row"><button class="btn ghost" id="disc">Odpojit</button></div>' : ''}`);
    const msgEl = $('#printMsg');
    const say = (m) => { msgEl.textContent = m; };
    $('#sheet').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]');
      if (b) { S.printer[b.dataset.p] = b.dataset.v; save(); Sound.fx('click'); openPrinter(); }
    });
    const doConnect = async (all) => {
      try { say('Hledám tiskárnu…'); await Printer.connect(all); Sound.fx('approved'); openPrinter(); toast('Tiskárna připojena 🖨️'); }
      catch (e) { say(printError(e)); }
      renderTop();
    };
    $('#conn').addEventListener('click', () => doConnect(false));
    $('#all').addEventListener('click', () => doConnect(true));
    $('#test').addEventListener('click', async () => {
      const data = {
        shop: S.shop, cur: S.cur, cashier: S.cashier, no: 0, date: new Date(),
        items: [{ name: 'Zkušební jablko', emoji: '🍎', qty: 2, price: 5 }], total: 10, payment: 'card',
        customer: null, pointsAdded: 1, pointsUsed: 0, reward: null,
      };
      const tb = $('#test');
      tb.disabled = true;
      await printWithUi(Receipt.render(data), say);
      tb.disabled = false;
    });
    const disc = $('#disc');
    if (disc) disc.addEventListener('click', () => { Printer.disconnect(); openPrinter(); renderTop(); });
  }
  Printer.onChange(() => renderTop());

  // ---------- nastavení ----------
  $('#settingsBtn').addEventListener('click', openSettings);
  function openSettings() {
    openModal(`${head('⚙️ Nastavení')}
      <div class="row"><button class="btn" id="shop">🏪 Název obchodu a účtenka</button></div>
      <div class="row" style="margin-top:8px"><button class="btn" id="cards">💳 Věrnostní karty</button><button class="btn" id="rewards">🎁 Odměny</button></div>
      <div class="row" style="margin-top:8px"><button class="btn" id="last" ${S.lastReceipt ? '' : 'disabled'}>🧾 Poslední účtenka</button></div>
      <h3>⭐ Body za nákup</h3>
      <label class="field"><span>1 bod za každých … ${esc(S.cur)} (0 = body jen ručně)</span><input id="fPer" inputmode="numeric" value="${S.pointsPerKc}"></label>
      <h3>🔊 Zvuky</h3>
      <div class="chips"><button class="chip ${S.sound ? 'sel' : ''}" data-snd="1">Zapnuté</button><button class="chip ${!S.sound ? 'sel' : ''}" data-snd="0">Vypnuté</button></div>
      <h3>💾 Záloha</h3>
      <p class="hint">Všechno je uložené jen v tomto zařízení. Zálohu si můžeš stáhnout jako soubor a později nahrát zpět.</p>
      <div class="row"><button class="btn" id="exp">⬇️ Stáhnout zálohu</button><button class="btn" id="imp">⬆️ Nahrát zálohu</button></div>
      <input type="file" id="impFile" accept=".json,application/json" class="hidden">
      <div class="row" style="margin-top:8px"><button class="btn danger" id="reset">♻️ Začít úplně znovu</button></div>`);
    $('#fPer').addEventListener('change', (e) => { S.pointsPerKc = Math.max(0, Math.round(parseNum(e.target.value))); save(); });
    $('#sheet').addEventListener('click', (e) => {
      const s = e.target.closest('[data-snd]');
      if (s) { S.sound = s.dataset.snd === '1'; Sound.setEnabled(S.sound); save(); openSettings(); }
    });
    $('#shop').addEventListener('click', openShopSettings);
    $('#cards').addEventListener('click', openCustomers);
    $('#rewards').addEventListener('click', openRewards);
    $('#last').addEventListener('click', () => { const d = Object.assign({}, S.lastReceipt, { date: new Date(S.lastReceipt.date) }); showReceipt(d, false); });
    $('#exp').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'prodavacka-zaloha.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
    $('#imp').addEventListener('click', () => $('#impFile').click());
    $('#impFile').addEventListener('change', async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (!d || !Array.isArray(d.products) || !Array.isArray(d.categories)) throw new Error('bad');
        localStorage.setItem(KEY, JSON.stringify(d)); load(); Sound.setEnabled(S.sound); closeModal(); renderAll(); toast('Záloha nahrána ✅');
      } catch (err) { toast('Tohle není záloha Prodavačky 😕'); }
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm('Opravdu smazat všechno vlastní zboží, karty a nastavení a začít od začátku?')) return;
      S = defaults(); save(); closeModal(); renderAll();
    });
  }

  function openCustomers() {
    openModal(`${head('💳 Věrnostní karty')}
      <div class="list">${S.customers.map((c) => `<div class="li"><b>${esc(c.name)}</b><span>⭐</span>
        <input data-pts="${esc(c.id)}" inputmode="numeric" value="${c.points}" style="width:80px;font:inherit;font-weight:800;font-size:18px;padding:6px;border-radius:10px;border:2px solid var(--line)">
        <button class="minibtn" data-ren="${esc(c.id)}">✏️</button><button class="minibtn" data-delc="${esc(c.id)}">🗑️</button></div>`).join('') || '<p class="hint">Zatím žádné karty.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="add">＋ Nová karta</button><button class="btn ok" data-close>✔ Hotovo</button></div>`);
    $('#sheet').addEventListener('change', (e) => {
      const i = e.target.closest('[data-pts]');
      if (i) { const c = S.customers.find((x) => x.id === i.dataset.pts); c.points = Math.max(0, Math.round(parseNum(i.value))); save(); }
    });
    $('#sheet').addEventListener('click', (e) => {
      const r = e.target.closest('[data-ren]'); const d = e.target.closest('[data-delc]');
      if (r) { const c = S.customers.find((x) => x.id === r.dataset.ren); const n = prompt('Nové jméno:', c.name); if (n && n.trim()) { c.name = n.trim().slice(0, 24); save(); openCustomers(); } }
      if (d) { const c = S.customers.find((x) => x.id === d.dataset.delc); if (confirm(`Smazat kartu „${c.name}“?`)) { S.customers = S.customers.filter((x) => x !== c); save(); openCustomers(); } }
      if (e.target.id === 'add') { const n = prompt('Jméno na kartě:'); if (n && n.trim()) { S.customers.push({ id: uid(), name: n.trim().slice(0, 24), points: 0 }); save(); openCustomers(); } }
    });
  }

  function openRewards() {
    openModal(`${head('🎁 Odměny za body')}
      <p class="hint">Za kolik bodů si zákazník může odměnu vybrat.</p>
      <div class="list">${S.rewards.map((r) => `<div class="li"><b>${esc(r.name)}</b><span>−${r.cost} ⭐</span>
        <button class="minibtn" data-edr="${esc(r.id)}">✏️</button><button class="minibtn" data-delr="${esc(r.id)}">🗑️</button></div>`).join('') || '<p class="hint">Zatím žádné odměny.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="add">＋ Nová odměna</button><button class="btn ok" data-close>✔ Hotovo</button></div>`);
    const ask = (r) => {
      const n = prompt('Název odměny:', r ? r.name : ''); if (!n || !n.trim()) return null;
      const c = prompt('Kolik bodů stojí?', r ? r.cost : 10); if (c === null) return null;
      const cost = Math.max(1, Math.round(parseNum(c)));
      return { name: n.trim().slice(0, 30), cost };
    };
    $('#sheet').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edr]'); const d = e.target.closest('[data-delr]');
      if (ed) { const r = S.rewards.find((x) => x.id === ed.dataset.edr); const v = ask(r); if (v) { Object.assign(r, v); save(); openRewards(); } }
      if (d) { S.rewards = S.rewards.filter((x) => x.id !== d.dataset.delr); save(); openRewards(); }
      if (e.target.id === 'add') { const v = ask(null); if (v) { S.rewards.push(Object.assign({ id: uid() }, v)); save(); openRewards(); } }
    });
  }

  // ---------- start ----------
  load();
  Sound.setEnabled(S.sound);
  renderAll();
  document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline režim není nutný */ });
  }
})();
