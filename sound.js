// Zvuky vyrobené přímo v prohlížeči (Web Audio) – žádné soubory, nic se nestahuje.
const Sound = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // jeden tón: frekvence, začátek (s), délka (s), tvar vlny, hlasitost, klouzání na frekvenci
  function tone(freq, at, dur, type = 'sine', vol = 0.25, slideTo = null) {
    const a = ac(); if (!a) return;
    const t0 = a.currentTime + at;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(at, dur, vol = 0.2) {
    const a = ac(); if (!a) return;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource();
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 3000;
    g.gain.value = vol;
    s.buffer = buf;
    s.connect(f).connect(g).connect(a.destination);
    s.start(a.currentTime + at);
  }

  const sounds = {
    pip:      { label: '📟 Píp (pokladna)', play: () => tone(1850, 0, 0.12, 'square', 0.12) },
    cink:     { label: '🔔 Cink', play: () => { tone(1320, 0, 0.35, 'triangle', 0.3); tone(1980, 0.0, 0.25, 'sine', 0.12); } },
    bublina:  { label: '🫧 Bublina', play: () => tone(300, 0, 0.18, 'sine', 0.35, 900) },
    zvonek:   { label: '🎵 Zvoneček', play: () => { tone(1047, 0, 0.12, 'triangle', 0.25); tone(1319, 0.1, 0.12, 'triangle', 0.25); tone(1568, 0.2, 0.22, 'triangle', 0.25); } },
    boing:    { label: '🦘 Boing', play: () => tone(180, 0, 0.35, 'sine', 0.4, 520) },
    mnam:     { label: '😋 Mňam', play: () => { tone(500, 0, 0.12, 'sawtooth', 0.12, 350); tone(450, 0.14, 0.18, 'sawtooth', 0.12, 300); } },
  };

  // zvuky pro pokladnu
  const fx = {
    remove: () => tone(500, 0, 0.12, 'sine', 0.2, 250),
    kaching: () => { noise(0, 0.08, 0.25); tone(1568, 0.06, 0.18, 'triangle', 0.3); tone(2093, 0.16, 0.5, 'triangle', 0.3); tone(2637, 0.16, 0.5, 'sine', 0.12); },
    card: () => { tone(1000, 0, 0.08, 'square', 0.1); tone(1000, 0.14, 0.08, 'square', 0.1); },
    approved: () => { tone(880, 0, 0.12, 'sine', 0.25); tone(1320, 0.12, 0.28, 'sine', 0.25); },
    printer: () => { for (let i = 0; i < 6; i++) noise(i * 0.09, 0.06, 0.08); },
    click: () => tone(900, 0, 0.04, 'square', 0.06),
    error: () => { tone(300, 0, 0.18, 'square', 0.12); tone(220, 0.2, 0.25, 'square', 0.12); },
  };

  return {
    list: Object.entries(sounds).map(([id, s]) => ({ id, label: s.label })),
    play(id) { if (!enabled) return; (sounds[id] || sounds.pip).play(); },
    fx(name) { if (!enabled) return; fx[name] && fx[name](); },
    setEnabled(v) { enabled = !!v; },
    unlock() { ac(); },
  };
})();
