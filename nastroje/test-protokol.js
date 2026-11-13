// Kontrola bajtů pro tiskárnu proti známým hodnotám z rbaron/catprinter a NaitLee/Cat-Printer.
// Spuštění: node nastroje/test-protokol.js  (ze složky Prodavacka)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sent = [];
let notifyHandler = null;
const fakeTx = {
  async writeValueWithoutResponse(b) { sent.push(Uint8Array.from(b)); },
};
const fakeRx = {
  async startNotifications() {},
  addEventListener(_, fn) { notifyHandler = fn; },
};
const fakeDevice = {
  name: 'MX05',
  addEventListener() {}, removeEventListener() {},
  gatt: {
    connected: false,
    async connect() {
      this.connected = true;
      return { async getPrimaryService(u) { if (u !== 0xae30) throw new Error('svc'); return { async getCharacteristic(c) { return c === 0xae01 ? fakeTx : fakeRx; } }; } };
    },
    disconnect() { this.connected = false; },
  },
};
let requestOpts = null;
const ctx = {
  navigator: { bluetooth: { async requestDevice(o) { requestOpts = o; return fakeDevice; } } },
  setTimeout, console, Uint8Array, Promise,
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'printer.js'), 'utf8') + '\nthis.Printer = Printer;', ctx);
const P = ctx.Printer;
const { crc8, packet, buildJob } = P._internal;

const hex = (a) => Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(' ');
let fails = 0;
function eq(name, got, want) {
  const ok = got === want;
  if (!ok) fails++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
}

// známé pakety (rbaron/catprinter cmds.py)
eq('get state', hex(packet(0xa3, [0])), '51 78 a3 00 01 00 00 00 ff');
eq('dpi 200', hex(packet(0xa4, [0x32])), '51 78 a4 00 01 00 32 9e ff');
eq('lattice start', hex(packet(0xa6, [0xaa, 0x55, 0x17, 0x38, 0x44, 0x5f, 0x5f, 0x5f, 0x44, 0x38, 0x2c])), '51 78 a6 00 0b 00 aa 55 17 38 44 5f 5f 5f 44 38 2c a1 ff');
eq('lattice end', hex(packet(0xa6, [0xaa, 0x55, 0x17, 0, 0, 0, 0, 0, 0, 0, 0x17])), '51 78 a6 00 0b 00 aa 55 17 00 00 00 00 00 00 00 17 11 ff');
eq('feed 0x30', hex(packet(0xa1, [0x30, 0x00])), '51 78 a1 00 02 00 30 00 f9 ff');
// NaitLee: flow-control pauza 51 78 ae 01 01 00 10 70 ff → CRC(10) = 70
eq('crc8(0x10)', crc8([0x10]).toString(16), '70');

// bitové pořadí: první (nejlevější) bod černý → bit 0 prvního bajtu
const fakeCanvas = (w, h, blackXs) => ({
  width: w, height: h,
  getContext() {
    return {
      getImageData() {
        const d = new Uint8ClampedArray(w * h * 4).fill(255);
        for (const x of blackXs) { d[x * 4] = d[x * 4 + 1] = d[x * 4 + 2] = 0; }
        return { data: d };
      },
    };
  },
});
const lines = P._internal.canvasToLines(fakeCanvas(384, 1, [0, 9, 383]));
eq('bit order byte0', lines[0][0].toString(2), '1');
eq('bit order byte1', lines[0][1].toString(2), '10');
eq('bit order byte47', lines[0][47].toString(2), '10000000');
eq('line length', String(lines[0].length), '48');

// celá úloha
const job = buildJob(lines, { energy: 'normal', feedLines: 3 });
const cmds = job.map((p) => p[2].toString(16));
eq('job order', cmds.join(','), 'a3,a4,bd,af,be,a9,a6,a2,a6,bd,a2,a2,a2,a3');
eq('energy LE 24000', hex(job[3].slice(6, 8)), 'c0 5d');

(async () => {
  await P.connect();
  eq('filters include af30 + MX prefix', String(JSON.stringify(requestOpts.filters).includes('"namePrefix":"MX"') && requestOpts.optionalServices.includes(0xae30)), 'true');
  // tisk 200 řádků v normálním režimu: žádný zápis nad 180 B a pakety se nedělí
  const many = Array.from({ length: 200 }, () => new Uint8Array(48));
  sent.length = 0;
  await P._internal.concat([]); // jen kontrola, že existuje
  const canvas = fakeCanvas(384, 200, []);
  await P.printCanvas(canvas, { energy: 'dark', chunk: 'normal', feedLines: 10 });
  const all = P._internal.concat(sent);
  const expected = P._internal.concat(buildJob(P._internal.canvasToLines(canvas), { energy: 'dark', feedLines: 10 }));
  eq('normal: bytes identical', String(all.length === expected.length && all.every((b, i) => b === expected[i])), 'true');
  eq('normal: max write <= 180', String(Math.max(...sent.map((s) => s.length)) <= 180), 'true');
  eq('normal: every write starts with packet header', String(sent.every((s) => s[0] === 0x51 && s[1] === 0x78)), 'true');

  sent.length = 0;
  await P.printCanvas(fakeCanvas(384, 5, []), { chunk: 'slow', feedLines: 2 });
  eq('slow: max write <= 20', String(Math.max(...sent.map((s) => s.length)) <= 20), 'true');

  // pauza od tiskárny: po XOff se čeká na XOn
  sent.length = 0;
  const ev = (bytes) => ({ target: { value: new DataView(Uint8Array.from(bytes).buffer) } });
  notifyHandler(ev([0x51, 0x78, 0xae, 0x01, 0x01, 0x00, 0x10, 0x70, 0xff]));
  const pr = P.printCanvas(fakeCanvas(384, 2, []), { feedLines: 1 });
  await new Promise((r) => setTimeout(r, 300));
  eq('paused: nothing sent yet', String(sent.length), '0');
  notifyHandler(ev([0x51, 0x78, 0xae, 0x01, 0x01, 0x00, 0x00, 0x00, 0xff]));
  await pr;
  eq('resumed: sent', String(sent.length > 0), 'true');

  console.log(fails ? `\n${fails} chyb` : '\nVše v pořádku ✅');
  process.exit(fails ? 1 : 0);
})();
