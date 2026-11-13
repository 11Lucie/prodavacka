// Tisk na malou termotiskárnu („cat printer“ – MX05, MX06, GB01… aplikace FunPrint) přes Web Bluetooth.
// Protokol: pakety 51 78 CMD 00 LEN_lo LEN_hi DATA… CRC8 FF, šířka řádku 384 bodů = 48 bajtů,
// nejlevější bod = nejnižší bit, 1 = černá. Ověřeno podle NaitLee/Cat-Printer, kitty-printer, rbaron/catprinter.
const Printer = (() => {
  const SVC_PRINT = 0xae30;   // služba pro tisk
  const SVC_ADV = 0xaf30;     // služba, kterou tiskárna ohlašuje
  const CH_TX = 0xae01;       // zápis
  const CH_RX = 0xae02;       // oznámení (stav, pauza)
  const WIDTH = 384;
  const BYTES_PER_LINE = WIDTH / 8;

  const CMD = {
    feed: 0xa1, bitmap: 0xa2, state: 0xa3, dpi: 0xa4, lattice: 0xa6,
    update: 0xa9, flow: 0xae, energy: 0xaf, speed: 0xbd, applyEnergy: 0xbe,
  };
  const LATTICE_START = [0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c];
  const LATTICE_END = [0xaa, 0x55, 0x17, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x17];

  const ENERGY = { light: 12000, normal: 24000, dark: 40000 };
  const CHUNK = { normal: 180, slow: 20 };

  // CRC-8, polynom 0x07, start 0 (CRC-8/SMBus)
  const CRC_TABLE = (() => {
    const t = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let b = 0; b < 8; b++) c = (c & 0x80) ? ((c << 1) ^ 0x07) & 0xff : (c << 1) & 0xff;
      t[i] = c;
    }
    return t;
  })();
  function crc8(data) {
    let c = 0;
    for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff];
    return c;
  }

  function packet(cmd, payload) {
    const p = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
    const out = new Uint8Array(8 + p.length);
    out.set([0x51, 0x78, cmd, 0x00, p.length & 0xff, (p.length >> 8) & 0xff], 0);
    out.set(p, 6);
    out[6 + p.length] = crc8(p);
    out[7 + p.length] = 0xff;
    return out;
  }
  const u16 = (v) => [v & 0xff, (v >> 8) & 0xff]; // little-endian

  // ---------- stav spojení ----------
  let device = null, tx = null, rx = null;
  let paused = false;
  let lastState = 0;
  let busy = false;
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => { try { fn(status()); } catch (e) { /* nic */ } });

  function status() {
    return {
      supported: !!navigator.bluetooth,
      connected: !!(device && device.gatt && device.gatt.connected && tx),
      name: device ? (device.name || 'tiskárna') : null,
      busy,
      outOfPaper: !!(lastState & 0x01),
      overheat: !!(lastState & 0x04),
      lowPower: !!(lastState & 0x08),
    };
  }

  function onNotify(ev) {
    const v = new Uint8Array(ev.target.value.buffer.slice(ev.target.value.byteOffset, ev.target.value.byteOffset + ev.target.value.byteLength));
    if (v.length >= 7 && v[0] === 0x51 && v[1] === 0x78) {
      if (v[2] === CMD.flow || v[2] === CMD.state) {
        paused = !!(v[6] & 0x10);
        if (v[2] === CMD.state) { lastState = v[6]; emit(); }
      }
    }
  }

  function onDisconnect() {
    tx = null; rx = null; paused = false;
    emit();
  }

  async function setup() {
    const server = await device.gatt.connect();
    const svc = await server.getPrimaryService(SVC_PRINT);
    tx = await svc.getCharacteristic(CH_TX);
    try {
      rx = await svc.getCharacteristic(CH_RX);
      await rx.startNotifications();
      rx.addEventListener('characteristicvaluechanged', onNotify);
    } catch (e) {
      rx = null; // bez oznámení to taky jde, jen bez hlídání pauzy
    }
    emit();
  }

  async function connect(showAll = false) {
    if (!navigator.bluetooth) throw new Error('nobt');
    const opts = showAll
      ? { acceptAllDevices: true, optionalServices: [SVC_PRINT, SVC_ADV] }
      : {
        filters: [
          { services: [SVC_ADV] }, { services: [SVC_PRINT] },
          { namePrefix: 'MX' }, { namePrefix: 'GB' }, { namePrefix: 'GT' },
          { namePrefix: 'YT' }, { namePrefix: 'PD' }, { namePrefix: '_ZZ' },
        ],
        optionalServices: [SVC_PRINT, SVC_ADV],
      };
    const d = await navigator.bluetooth.requestDevice(opts);
    if (device && device !== d) disconnect();
    device = d;
    device.removeEventListener('gattserverdisconnected', onDisconnect);
    device.addEventListener('gattserverdisconnected', onDisconnect);
    try {
      await setup();
    } catch (e) {
      // špatné zařízení nebo nepovedené spojení: zapomenout ho, ať se příště znovu nabídne seznam
      try { d.removeEventListener('gattserverdisconnected', onDisconnect); if (d.gatt.connected) d.gatt.disconnect(); } catch (x) { /* nic */ }
      device = null; tx = null; rx = null; emit();
      if (e && e.name === 'NotFoundError') throw new Error('notprinter');
      throw e;
    }
    return status();
  }

  async function ensureConnected() {
    if (status().connected) return;
    if (!device) throw new Error('nodevice');
    await setup(); // znovu připojit stejnou tiskárnu (bez výběru)
  }

  function disconnect() {
    try { if (device && device.gatt.connected) device.gatt.disconnect(); } catch (e) { /* nic */ }
    tx = null; rx = null;
    emit();
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function write(bytes) {
    if (tx.writeValueWithoutResponse) await tx.writeValueWithoutResponse(bytes);
    else await tx.writeValue(bytes);
  }

  // Odeslání po kouscích. V „normálním“ režimu se pakety nedělí (max ~180 B na zápis),
  // v „pomalém“ jde všechno po 20 bajtech (to projde vždy).
  async function sendAll(packets, chunkMode, onProgress) {
    const limit = CHUNK[chunkMode] || CHUNK.normal;
    const writes = [];
    if (limit <= 20) {
      const all = concat(packets);
      for (let i = 0; i < all.length; i += limit) writes.push(all.subarray(i, i + limit));
    } else {
      let buf = [];
      let size = 0;
      for (const p of packets) {
        if (size + p.length > limit && size > 0) { writes.push(concat(buf)); buf = []; size = 0; }
        buf.push(p); size += p.length;
      }
      if (size) writes.push(concat(buf));
    }
    for (let i = 0; i < writes.length; i++) {
      let waited = 0;
      while (paused && waited < 15000) { await sleep(100); waited += 100; }
      paused = false;
      if (!status().connected) throw new Error('lost');
      await write(writes[i]);
      await sleep(limit <= 20 ? 12 : 22);
      if (onProgress && i % 10 === 0) try { onProgress(i / writes.length); } catch (e) { /* chyba v zobrazení nesmí zastavit tisk */ }
    }
    if (onProgress) try { onProgress(1); } catch (e) { /* nic */ }
  }

  function concat(arrs) {
    let n = 0; for (const a of arrs) n += a.length;
    const out = new Uint8Array(n); let o = 0;
    for (const a of arrs) { out.set(a, o); o += a.length; }
    return out;
  }

  // canvas (šířka 384) → řádky po 48 bajtech; černá = 1, nejlevější bod = bit 0
  function canvasToLines(canvas) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const img = ctx.getImageData(0, 0, width, height).data;
    const lines = [];
    for (let y = 0; y < height; y++) {
      const line = new Uint8Array(BYTES_PER_LINE);
      for (let x = 0; x < Math.min(width, WIDTH); x++) {
        const i = (y * width + x) * 4;
        if (img[i + 3] > 127 && img[i] < 128) line[x >> 3] |= 1 << (x & 7);
      }
      lines.push(line);
    }
    return lines;
  }

  function buildJob(lines, { energy = 'normal', feedLines = 90 } = {}) {
    const e = ENERGY[energy] || ENERGY.normal;
    const p = [];
    p.push(packet(CMD.state, [0x00]));
    p.push(packet(CMD.dpi, [50]));          // 200 dpi
    p.push(packet(CMD.speed, [32]));
    p.push(packet(CMD.energy, u16(e)));
    p.push(packet(CMD.applyEnergy, [0x01]));
    p.push(packet(CMD.update, [0x00]));
    p.push(packet(CMD.lattice, LATTICE_START));
    for (const l of lines) p.push(packet(CMD.bitmap, l));
    p.push(packet(CMD.lattice, LATTICE_END));
    p.push(packet(CMD.speed, [8]));
    // MX05 má potíže s příkazem „posuň papír“ – posun proto děláme prázdnými řádky
    const blank = new Uint8Array(BYTES_PER_LINE);
    for (let i = 0; i < feedLines; i++) p.push(packet(CMD.bitmap, blank));
    p.push(packet(CMD.state, [0x00]));
    return p;
  }

  async function printCanvas(canvas, opts = {}) {
    if (busy) throw new Error('busy');
    busy = true; emit();
    try {
      await ensureConnected();
      const job = buildJob(canvasToLines(canvas), opts);
      await sendAll(job, opts.chunk, opts.onProgress);
      await sleep(400);
    } finally {
      busy = false; emit();
    }
  }

  return {
    WIDTH,
    connect, disconnect, printCanvas, status,
    hasDevice: () => !!device,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async available() {
      if (!navigator.bluetooth) return false;
      try { return await navigator.bluetooth.getAvailability(); } catch (e) { return true; }
    },
    // pro testy
    _internal: { crc8, packet, canvasToLines, buildJob, concat },
  };
})();
