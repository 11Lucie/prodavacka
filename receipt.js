// Vykreslení účtenky do obrázku 384 bodů širokého (šířka papíru tiskárny) a převod na černobílou.
const Receipt = (() => {
  const W = 384;
  const PAD = 6;
  const FONT = '"Segoe UI", Roboto, "Noto Sans", Arial, sans-serif';

  function money(v, cur) {
    const n = Math.round(v * 100) / 100;
    const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
    return `${s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${cur}`;
  }

  function dateText(d) {
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}  ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // jednoduché „kreslítko“ shora dolů
  function makePen(ctx) {
    let y = 4;
    const font = (size, bold) => `${bold ? '800' : '500'} ${size}px ${FONT}`;

    function wrap(text, maxW) {
      const words = String(text).split(/\s+/);
      const lines = [];
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (ctx.measureText(t).width <= maxW || !cur) cur = t;
        else { lines.push(cur); cur = w; }
      }
      if (cur) lines.push(cur);
      // příliš dlouhé slovo rozsekat
      const out = [];
      for (const l of lines) {
        if (ctx.measureText(l).width <= maxW) { out.push(l); continue; }
        let part = '';
        for (const ch of Array.from(l)) {
          if (ctx.measureText(part + ch).width > maxW && part) { out.push(part); part = ch; } else part += ch;
        }
        if (part) out.push(part);
      }
      return out;
    }

    return {
      get y() { return y; },
      space(h) { y += h; },
      text(t, { size = 22, bold = false, align = 'left', lh = 1.25 } = {}) {
        ctx.font = font(size, bold);
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
        for (const line of wrap(t, W - PAD * 2)) {
          const w = ctx.measureText(line).width;
          const x = align === 'center' ? (W - w) / 2 : align === 'right' ? W - PAD - w : PAD;
          ctx.fillText(line, x, y);
          y += Math.round(size * lh);
        }
      },
      // levý text (může se zalomit) + pravý text na posledním řádku
      cols(left, right, { size = 22, bold = false } = {}) {
        ctx.font = font(size, bold);
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000';
        const rw = ctx.measureText(right).width;
        const lines = wrap(left, W - PAD * 2 - rw - 12);
        lines.forEach((line, i) => {
          ctx.fillText(line, PAD, y);
          if (i === lines.length - 1) ctx.fillText(right, W - PAD - rw, y);
          y += Math.round(size * 1.25);
        });
      },
      dashed() {
        y += 6;
        ctx.fillStyle = '#000';
        for (let x = PAD; x < W - PAD; x += 12) ctx.fillRect(x, y, 7, 2);
        y += 10;
      },
      solid(h = 3) {
        y += 6; ctx.fillStyle = '#000'; ctx.fillRect(PAD, y, W - PAD * 2, h); y += h + 8;
      },
      stars() {
        ctx.font = font(18, true); ctx.textBaseline = 'top'; ctx.fillStyle = '#000';
        const t = '★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★';
        ctx.fillText(t, (W - ctx.measureText(t).width) / 2, y); y += 24;
      },
      barcode(seed) {
        // hravý „čárový kód“ z čísla účtenky
        y += 6;
        const h = 54;
        let x = 52;
        let s = (seed * 2654435761) >>> 0;
        ctx.fillStyle = '#000';
        ctx.fillRect(x, y, 3, h); x += 6; ctx.fillRect(x, y, 3, h); x += 6;
        while (x < W - 64) {
          s = (s * 1103515245 + 12345) >>> 0;
          const bw = 2 + ((s >> 16) % 4);
          const gap = 2 + ((s >> 20) % 3);
          ctx.fillRect(x, y, bw, h);
          x += bw + gap;
        }
        ctx.fillRect(x, y, 3, h); x += 6; ctx.fillRect(x, y, 3, h);
        y += h + 4;
      },
    };
  }

  // Atkinsonův rozptyl: text zůstane ostrý, smajlíci a šedé plochy dostanou tečkování
  function toBlackWhite(canvas) {
    const ctx = canvas.getContext('2d');
    const { width: w, height: h } = canvas;
    const im = ctx.getImageData(0, 0, w, h);
    const d = im.data;
    const g = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = d[i * 4 + 3] / 255;
      const lum = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      g[i] = 255 - a * (255 - lum);
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const old = g[i];
        const nv = old < 128 ? 0 : 255;
        const err = (old - nv) / 8;
        g[i] = nv;
        if (x + 1 < w) g[i + 1] += err;
        if (x + 2 < w) g[i + 2] += err;
        if (y + 1 < h) {
          if (x > 0) g[i + w - 1] += err;
          g[i + w] += err;
          if (x + 1 < w) g[i + w + 1] += err;
        }
        if (y + 2 < h) g[i + 2 * w] += err;
      }
    }
    for (let i = 0; i < w * h; i++) {
      const v = g[i] < 128 ? 0 : 255;
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(im, 0, 0);
    return canvas;
  }

  /**
   * data = {
   *   shop: {name, subtitle, footer}, cur, cashier, no, date,
   *   items: [{name, emoji, qty, price}], total,
   *   payment: 'card'|'cash'|null, given, change,
   *   customer: {name, before, after}|null, pointsAdded, pointsUsed, reward
   * }
   */
  function render(data) {
    const big = document.createElement('canvas');
    big.width = W; big.height = 4000;
    const ctx = big.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, big.height);
    const pen = makePen(ctx);
    const cur = data.cur || 'Kč';

    pen.stars();
    pen.text(data.shop.name || 'Obchůdek', { size: 36, bold: true, align: 'center', lh: 1.15 });
    if (data.shop.subtitle) pen.text(data.shop.subtitle, { size: 20, align: 'center' });
    pen.stars();
    pen.space(4);
    if (data.cashier) pen.text(`Dnes vás obsluhuje: ${data.cashier}`, { size: 22, bold: true, align: 'center' });
    pen.text(dateText(data.date), { size: 20, align: 'center' });
    pen.text(`Účtenka č. ${String(data.no).padStart(4, '0')}`, { size: 20, align: 'center' });

    if (data.items.length) {
      pen.dashed();
      for (const it of data.items) {
        const line = it.qty > 1 ? `${it.qty}× ${it.name}` : it.name;
        pen.cols(line, money(it.qty * it.price, cur), { size: 23 });
        if (it.qty > 1) pen.text(`   ${it.qty} × ${money(it.price, cur)}`, { size: 18 });
      }
      pen.solid();
      pen.cols('CELKEM', money(data.total, cur), { size: 32, bold: true });
      pen.space(2);
      if (data.payment === 'card') {
        pen.text('Zaplaceno kartou', { size: 22 });
      } else if (data.payment === 'cash') {
        pen.text('Zaplaceno hotově', { size: 22 });
        if (data.given != null) {
          pen.cols('Přijato', money(data.given, cur), { size: 22 });
          pen.cols('Vráceno', money(data.change || 0, cur), { size: 22 });
        }
      }
    }

    const hasPoints = data.pointsAdded || data.pointsUsed || data.customer;
    if (hasPoints) {
      pen.dashed();
      pen.text('⭐ VĚRNOSTNÍ BODY ⭐', { size: 24, bold: true, align: 'center' });
      if (data.customer) pen.cols('Karta', data.customer.name, { size: 22 });
      if (data.pointsAdded) pen.cols('Získané body', `+${data.pointsAdded}`, { size: 24, bold: true });
      if (data.pointsUsed) {
        if (data.reward) pen.cols(`Odměna: ${data.reward}`, `−${data.pointsUsed}`, { size: 22, bold: true });
        else pen.cols('Uplatněné body', `−${data.pointsUsed}`, { size: 24, bold: true });
      }
      if (data.customer) pen.cols('Body celkem', String(data.customer.after), { size: 24, bold: true });
    }

    pen.dashed();
    if (data.shop.footer) pen.text(data.shop.footer, { size: 22, bold: true, align: 'center' });
    pen.text('😊', { size: 44, align: 'center', lh: 1.1 });
    pen.barcode(data.no || 1);
    pen.text('Toto je jen hra – nejde o skutečný doklad.', { size: 15, align: 'center' });
    pen.space(8);

    const out = document.createElement('canvas');
    out.width = W; out.height = Math.ceil(pen.y);
    out.getContext('2d').drawImage(big, 0, 0);
    return toBlackWhite(out);
  }

  return { render, money, W };
})();
