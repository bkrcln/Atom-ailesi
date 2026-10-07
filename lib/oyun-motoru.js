/*
 * Atom Ailesi oyun motoru
 * ------------------------------------------------------------
 * Tuval (canvas) çizimleri ve dört oyun bölümünün mantığı.
 * React bileşeni (components/Oyun.js) sayfaya HTML iskeletini koyar,
 * ardından oyunuBaslat() çağrılır. Dönen fonksiyon, sayfadan çıkılırken
 * tüm döngüleri ve dinleyicileri temizler.
 */

export function oyunuBaslat(ayar = {}) {
  const { baslangicYildiz = 0, kaydet: kaydetCb } = ayar;
  const ac = new AbortController();
  const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn, { signal: ac.signal }); };
  let durdu = false;
  let rafId = 0;

  /* ---------- Ortak araçlar ---------- */
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPD = RM ? 0.35 : 1;
  const TAU = Math.PI * 2;
  const COL = { proton: '#FF5A6E', neutron: '#4D8BFF', electron: '#FFD23F', green: '#34D399', gluon: '#F5B83D', photon: '#4FE3F0', violet: '#B57BFF', orange: '#FF9F43', pink: '#FF7AC6', dark: '#1A1D47' };
  const QCOL = [COL.proton, COL.green, COL.neutron]; // renk yükü: kırmızı, yeşil, mavi
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = s => s < .5 ? 2 * s * s : 1 - Math.pow(-2 * s + 2, 2) / 2;
  const easeBack = s => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(s - 1, 3) + c1 * Math.pow(s - 1, 2); };
  const blinkAt = (t, ph) => ((t + ph * 3.7) % 4.2) < .13;
  const now = () => performance.now() / 1000;
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  function distSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy || 1;
    const s = clamp(((px - x1) * dx + (py - y1) * dy) / L2, 0, 1);
    return Math.hypot(px - (x1 + dx * s), py - (y1 + dy * s));
  }

  class Stage {
    constructor(id) { this.c = $(id); this.ctx = this.c.getContext('2d'); this.w = 1; this.h = 1; }
    fit() {
      const r = this.c.getBoundingClientRect();
      if (!r.width) return;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.round(r.width * d); this.c.height = Math.round(r.height * d);
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    pt(e) { const r = this.c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    clear() { this.ctx.clearRect(0, 0, this.w, this.h); }
  }

  /* Yüzlü, sevimli parçacık */
  function ball(ctx, x, y, r, color, o = {}) {
    if (r <= .5) return;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.glow) { ctx.shadowColor = color; ctx.shadowBlur = o.glow; }
    const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    g.addColorStop(0, mix(color, '#ffffff', .42)); g.addColorStop(1, color);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1.2, r * .09); ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.stroke();
    if (r >= 9 && o.face !== false) face(ctx, x, y, r, o);
    ctx.restore();
  }
  function face(ctx, x, y, r, o) {
    const ex = r * .34, ey = y - r * .1, er = r * .21;
    for (const s of [-1, 1]) {
      const cx = x + s * ex;
      if (o.blink) {
        ctx.strokeStyle = COL.dark; ctx.lineWidth = Math.max(1, r * .07); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx - er * .8, ey); ctx.lineTo(cx + er * .8, ey); ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = COL.dark; ctx.beginPath(); ctx.arc(cx, ey + er * .12, er * .58, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + er * .22, ey - er * .16, er * .2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,130,170,.5)';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * .58, y + r * .22, r * .14, r * .09, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = COL.dark; ctx.lineWidth = Math.max(1.2, r * .08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + r * .1, r * .27, .18 * Math.PI, .82 * Math.PI); ctx.stroke();
  }
  /* Gluon yayı */
  function spring(ctx, x1, y1, x2, y2, coils, amp, color, width) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const N = Math.max(60, coils * 20);
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const s = i / N, th = s * coils * TAU, a = amp * Math.min(1, Math.sin(Math.PI * s) * 4);
      const along = s * L + a * Math.sin(th) * .9, perp = -a * Math.cos(th);
      const px = x1 + ux * along + nx * perp, py = y1 + uy * along + ny * perp;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.stroke();
  }
  /* Foton dalgası (kuyruk geriye doğru) */
  function wave(ctx, x, y, ang, len, amp, cycles, color, width, phase) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath();
    for (let i = 0; i <= 44; i++) {
      const s = i / 44, py = Math.sin(s * cycles * TAU + phase) * amp * Math.sin(Math.PI * s);
      if (i) ctx.lineTo(-s * len, py); else ctx.moveTo(-s * len, py);
    }
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.stroke();
    ctx.restore();
  }
  function label(ctx, text, x, y, color, size = 15) {
    ctx.save();
    ctx.font = `800 ${size}px "Baloo 2","Trebuchet MS",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(22,26,69,.9)'; ctx.strokeText(text, x, y);
    ctx.fillStyle = color; ctx.fillText(text, x, y);
    ctx.restore();
  }

  /* Ses */
  let actx = null, soundOn = true;
  function tone(f, d, type = 'triangle', delay = 0, vol = .1) {
    if (!soundOn || durdu) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + delay;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
      o.connect(g).connect(actx.destination); o.start(t0); o.stop(t0 + d + .05);
    } catch (e) { /* ses desteklenmiyor */ }
  }
  const sfx = {
    click: () => tone(520, .07, 'triangle', 0, .05),
    pop: () => tone(680, .12),
    remove: () => tone(340, .12),
    good: () => { tone(523, .14); tone(659, .14, 'triangle', .11); tone(784, .26, 'triangle', .22); },
    bad: () => tone(196, .22, 'sawtooth', 0, .045),
    jump: () => { tone(440, .1, 'sine'); tone(880, .18, 'sine', .07); },
    emit: () => tone(1175, .3, 'sine', 0, .07)
  };
  on($('soundBtn'), 'click', e => {
    soundOn = !soundOn;
    e.currentTarget.textContent = soundOn ? '🔊' : '🔇';
    e.currentTarget.setAttribute('aria-pressed', soundOn);
    e.currentTarget.setAttribute('aria-label', soundOn ? 'Sesi kapat' : 'Sesi aç');
  });

  /* Yıldızlar ve kayıt */
  let stars = baslangicYildiz;
  $('starCount').textContent = stars;
  function addStars(n) {
    if (n <= 0) return;
    stars += n; $('starCount').textContent = stars;
    const el = $('stars'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
  function kaydet(kayit) {
    if (!kaydetCb) return;
    try { kaydetCb(kayit); } catch (e) { /* kayıt hatası oyunu durdurmasın */ }
  }

  /* Konfeti */
  const conf = { c: $('confetti'), parts: [], running: false };
  conf.ctx = conf.c.getContext('2d');
  function confetti() {
    if (RM) return;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    conf.c.width = innerWidth * d; conf.c.height = innerHeight * d; conf.ctx.setTransform(d, 0, 0, d, 0, 0);
    const cols = [COL.proton, COL.neutron, COL.electron, COL.green, COL.photon, COL.violet];
    for (let i = 0; i < 150; i++) conf.parts.push({ x: innerWidth / 2 + rand(-60, 60), y: innerHeight * .35, vx: rand(-8, 8), vy: rand(-14, -4), r: rand(5, 9), c: cols[i % cols.length], rot: rand(0, TAU), vr: rand(-.3, .3), round: Math.random() < .5 });
    if (!conf.running) { conf.running = true; requestAnimationFrame(confStep); }
  }
  function confStep() {
    const ctx = conf.ctx; ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (durdu) { conf.running = false; return; }
    conf.parts = conf.parts.filter(p => p.y < innerHeight + 30);
    for (const p of conf.parts) {
      p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.r * .55, 0, TAU); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    }
    if (conf.parts.length) requestAnimationFrame(confStep); else { conf.running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  /* ---------- 1. ATOMU KEŞFET ---------- */
  const CHARS = {
    proton: { name: 'Anne Proton', color: COL.proton, role: 'Çekirdeğin pozitif annesi (+)',
      text: 'Her zaman pozitiftir ve herkese moral verir. Evin adını o belirler: çekirdekte kaç proton varsa atomun adı ona göre konur. Bu evde 3 proton var, yani bu atomun adı Lityum!',
      fact: 'Anne Proton\'un kucağında üç minik kuark bebek yaşar. "Protonun içi" düğmesine bas ve onları gör.' },
    neutron: { name: 'Baba Nötron', color: COL.neutron, role: 'Çekirdeğin sakin babası (0)',
      text: 'Nötrdür, yani yükü yoktur ve kimsenin tarafını tutmaz. Protonların arasında durup çekirdek evini dengede ve sağlam tutar.',
      fact: 'Baba Nötron, Anne Proton ile neredeyse aynı ağırlıktadır. Bu evde 4 nötron var.' },
    electron: { name: 'Elektron Kardeşler', color: COL.electron, role: 'Halka yollardaki hızlı kardeşler (−)',
      text: 'Eksi yüklüdürler, minicik ve çok hızlıdırlar. Çekirdeğin çevresindeki halka yollarda nöbet tutarlar. Anne Proton\'a doğru çekildikleri için evden hiç kopmazlar.',
      fact: 'Kuantum gözlüğünü tak! Elektronun yeri tam belli olmaz, bir bulut gibi görünür. Buna olasılık bulutu denir. Küçük oklar da elektronların dönüşünü yani spinini gösterir.' },
    quark: { name: 'Kuark Bebekler', color: COL.green, role: 'Proton ve nötronun içindeki bebekler',
      text: 'Her proton ve nötronun içinde üç bebek vardır. Adları Yukarı (u) ve Aşağı (d). Protonda iki Yukarı bir Aşağı, nötronda bir Yukarı iki Aşağı bebek yaşar.',
      fact: 'Kuarkların renk yükü vardır: kırmızı, yeşil ve mavi. Renkleri sürekli el değiştirir ama üç renk hep birlikte kalır.' },
    gluon: { name: 'Gluon Dede', color: COL.gluon, role: 'Herkesi birbirine bağlayan dede',
      text: 'Yay gibi kıvırcık sakalıyla kuark bebekleri birbirine bağlar. Bir bebek uzaklaşmaya kalkarsa sakalı gerilir, parlar ve onu şefkatle geri çeker.',
      fact: 'Gluon adı İngilizce "glue", yani yapıştırıcı kelimesinden gelir. Kuarklar asla tek başına dolaşamaz.' },
    photon: { name: 'Foton Postacı', color: COL.photon, role: 'Işık hızında haber taşıyan postacı',
      text: 'Çekirdekle elektronlar arasında koşturup haber taşır. Bu sayede elektronlar çekirdeğe bağlı kalır. Kesikli mavi çizgide giden dalgacıklar odur!',
      fact: 'Işık da fotonlardan oluşur. Bir elektron foton yakalayınca üst kata zıplar, aşağı inerken de yeni bir foton saçar. "Foton yakala" oyununda dene!' }
  };
  const CAPTIONS = {
    atom: 'Elektron Kardeşler halka yollarda dönüyor, çekirdekteki aile hiç durmadan kıpırdıyor. Bir parçacığa dokun ya da aile üyelerinden birini seç.',
    quantum: 'Kuantum gözlüğü takılı! Elektronun yeri kesin değil. Her parıltı, elektronu bulabileceğimiz bir yer. Bak, her bakışta başka yerde!',
    proton: 'Anne Proton\'un içi: iki Yukarı (u) ve bir Aşağı (d) kuark bebek. Gluon Dede\'nin yay sakalı onları bir arada tutuyor, renkleri de sürekli el değiştiriyor.',
    neutron: 'Baba Nötron\'un içi: bir Yukarı (u) ve iki Aşağı (d) kuark bebek. Arada bir beliren minik çiftler, bir an doğup kaybolan sanal kuarklar.'
  };

  const ex = { stage: new Stage('cv-kesfet'), quantum: false, qv: 0, view: 'atom', anim: null, sel: null,
    dots: [], meas: [], measT: 0, ePos: [], nucPos: [], qPos: [], springs: [], re: 10, rn: 10, q: null };
  const NUC = [{ t: 'n', a: 0, d: 0, ph: rand(0, TAU) }];
  for (let i = 0; i < 6; i++) NUC.push({ t: i % 2 ? 'n' : 'p', a: i * TAU / 6 + .3, d: 1, ph: rand(0, TAU) });
  const ORB = [
    { rx: .2, ry: .085, tilt: -.5, sp: 1.5, ph: 0, spin: 1, shell: 1 },
    { rx: .2, ry: .085, tilt: .65, sp: 1.25, ph: 2.2, spin: -1, shell: 1 },
    { rx: .43, ry: .165, tilt: -.22, sp: .75, ph: 1, spin: 1, shell: 2 }
  ];
  function sampleShell(shell) {
    const a = rand(0, TAU), r = shell === 1 ? Math.abs(.19 + gauss() * .065) : Math.abs(.37 + gauss() * .07);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  function makeQuarks(kind) {
    const fl = kind === 'proton' ? ['u', 'u', 'd'] : ['u', 'd', 'd'];
    return { kind, time: 0, nextSwap: 1, nextTug: 2.4, nextSea: .7, pulses: [], sea: [],
      qs: fl.map((f, i) => ({ f, ci: i, prev: i, ct: 1, ph: rand(0, TAU), tug: -10 })) };
  }
  function tugAmount(q, qq) {
    const tt = q.time - qq.tug;
    if (tt < 0 || tt > 2) return 0;
    if (tt < .6) return Math.sin(tt / .6 * Math.PI / 2);
    return Math.exp(-4 * (tt - .6)) * Math.cos(9 * (tt - .6));
  }
  function updateQuarks(dt) {
    const q = ex.q; if (!q) return;
    q.time += dt * SPD;
    if (q.time > q.nextSwap) {
      const i = Math.floor(rand(0, 3)), j = (i + 1 + Math.floor(rand(0, 2))) % 3;
      q.pulses.push({ i, j, s: 0, c: QCOL[q.qs[i].ci] });
      q.nextSwap = q.time + rand(1.3, 2.1);
    }
    q.pulses = q.pulses.filter(p => {
      p.s += dt * SPD / .6;
      if (p.s >= 1) {
        const a = q.qs[p.i], b = q.qs[p.j];
        a.prev = a.ci; b.prev = b.ci; [a.ci, b.ci] = [b.ci, a.ci]; a.ct = 0; b.ct = 0;
        return false;
      }
      return true;
    });
    q.qs.forEach(qq => { qq.ct = Math.min(1, qq.ct + dt * 2.5); });
    if (q.time > q.nextTug) { q.qs[Math.floor(rand(0, 3))].tug = q.time; q.nextTug = q.time + rand(3, 4.5); }
    if (q.time > q.nextSea) { q.sea.push({ x: rand(-.25, .25), y: rand(-.2, .3), a: rand(0, TAU), born: q.time }); q.nextSea = q.time + rand(.9, 1.6); }
    q.sea = q.sea.filter(s => q.time - s.born < 1);
  }
  function updateDots(dt) {
    if (ex.qv > .05) {
      const n = Math.round(dt * 620);
      for (let i = 0; i < n; i++) { const p = sampleShell(Math.random() < .64 ? 1 : 2); ex.dots.push({ x: p.x, y: p.y, age: 0, life: rand(.5, 1.1) }); }
    }
    ex.dots.forEach(d => { d.age += dt; });
    ex.dots = ex.dots.filter(d => d.age < d.life);
    if (ex.dots.length > 1800) ex.dots.splice(0, ex.dots.length - 1800);
    ex.measT -= dt;
    if (ex.measT <= 0) { ex.measT = .45 / SPD; ex.meas = ORB.map(o => sampleShell(o.shell)); }
  }
  function selRing(ctx, x, y, r, t, color) {
    ctx.save(); ctx.strokeStyle = color || '#fff'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
    ctx.lineDashOffset = -t * 20;
    ctx.beginPath(); ctx.arc(x, y, r + 6 + Math.sin(t * 5) * 2, 0, TAU); ctx.stroke(); ctx.restore();
  }
  function drawAtom(ctx, t, alpha, sc) {
    const st = ex.stage, cx = st.w / 2, cy = st.h / 2, M = Math.min(st.w * .96, st.h * 1.12), tt = t * SPD, qv = ex.qv;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(sc, sc);
    const hz = ctx.createRadialGradient(0, 0, M * .05, 0, 0, M * .48);
    hz.addColorStop(0, `rgba(255,210,63,${.14 + qv * .1})`); hz.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = hz; ctx.beginPath(); ctx.arc(0, 0, M * .48, 0, TAU); ctx.fill();
    ctx.save(); ctx.shadowColor = COL.electron; ctx.shadowBlur = 10; ctx.strokeStyle = COL.electron;
    ctx.lineWidth = ex.sel === 'electron' ? 3.5 : 2.5;
    for (const o of ORB) {
      ctx.save(); ctx.rotate(o.tilt); ctx.globalAlpha = alpha * (1 - qv * .88) * .9;
      ctx.beginPath(); ctx.ellipse(0, 0, o.rx * M, o.ry * M, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    if (qv > .02) {
      for (const d of ex.dots) {
        const a = (1 - d.age / d.life) * qv;
        ctx.fillStyle = `rgba(255,226,120,${a * .85})`;
        ctx.beginPath(); ctx.arc(d.x * M, d.y * M, 2.1, 0, TAU); ctx.fill();
      }
    }
    ex.ePos = ORB.map((o, i) => {
      if (qv > .5 && ex.meas[i]) return { x: ex.meas[i].x * M, y: ex.meas[i].y * M };
      const a = o.ph + tt * o.sp, lx = Math.cos(a) * o.rx * M, ly = Math.sin(a) * o.ry * M;
      return { x: lx * Math.cos(o.tilt) - ly * Math.sin(o.tilt), y: lx * Math.sin(o.tilt) + ly * Math.cos(o.tilt) };
    });
    const e2 = ex.ePos[2], ang = Math.atan2(e2.y, e2.x);
    ctx.save(); ctx.setLineDash([7, 7]); ctx.lineDashOffset = -t * 22;
    ctx.strokeStyle = 'rgba(130,165,255,.8)'; ctx.lineWidth = ex.sel === 'photon' ? 4 : 2.2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(e2.x, e2.y); ctx.stroke(); ctx.restore();
    for (let k = 0; k < 2; k++) {
      const s = (tt * .45 + k * .5) % 1, sx = e2.x * s, sy = e2.y * s;
      if (s > .15 && s < .92) {
        wave(ctx, sx, sy, ang, 26, 5, 2.5, COL.photon, ex.sel === 'photon' ? 3.2 : 2.2, t * 9);
        ctx.fillStyle = COL.photon; ctx.beginPath(); ctx.arc(sx, sy, 3.6, 0, TAU); ctx.fill();
      }
    }
    const rn = M * .048, jig = RM ? .4 : 1;
    ex.rn = rn;
    ex.nucPos = NUC.map(n => {
      const jx = (Math.sin(tt * 7 + n.ph) * .08 + Math.sin(tt * 11.3 + n.ph * 1.7) * .05) * rn * jig;
      const jy = (Math.cos(tt * 6.1 + n.ph * 1.3) * .08 + Math.cos(tt * 9.7 + n.ph) * .05) * rn * jig;
      return { x: Math.cos(n.a) * n.d * rn * 1.85 + jx, y: Math.sin(n.a) * n.d * rn * 1.85 + jy, t: n.t, ph: n.ph };
    });
    [...ex.nucPos].sort((a, b) => a.y - b.y).forEach(n => {
      ball(ctx, n.x, n.y, rn, n.t === 'p' ? COL.proton : COL.neutron, { blink: blinkAt(t, n.ph) });
      if ((ex.sel === 'proton' && n.t === 'p') || (ex.sel === 'neutron' && n.t === 'n')) selRing(ctx, n.x, n.y, rn, t);
    });
    const re = Math.max(9, M * .032); ex.re = re;
    ex.ePos.forEach((p, i) => {
      if (qv > .5) {
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, re * 2.4);
        halo.addColorStop(0, 'rgba(255,226,120,.45)'); halo.addColorStop(1, 'rgba(255,226,120,0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(p.x, p.y, re * 2.4, 0, TAU); ctx.fill();
      }
      ball(ctx, p.x, p.y, re, COL.electron, { glow: 16, blink: blinkAt(t, i + 2), alpha: qv > .5 ? .85 : 1 });
      const sx = p.x + re * 1.35, sy = p.y, dir = ORB[i].spin, L = re * .9;
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy + dir * L); ctx.lineTo(sx, sy - dir * L); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, sy - dir * (L + 4)); ctx.lineTo(sx - 4, sy - dir * (L - 2)); ctx.lineTo(sx + 4, sy - dir * (L - 2)); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (ex.sel === 'electron') selRing(ctx, p.x, p.y, re, t, COL.electron);
    });
    ctx.restore();
  }
  function drawInside(ctx, t, alpha, sc) {
    const q = ex.q; if (!q) return;
    const st = ex.stage, cx = st.w / 2, cy = st.h / 2, M = Math.min(st.w, st.h), R = M * .4;
    const base = q.kind === 'proton' ? COL.proton : COL.neutron;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.scale(sc, sc);
    const g = ctx.createRadialGradient(0, 0, R * .2, 0, 0, R);
    g.addColorStop(0, base + '44'); g.addColorStop(1, base + '18');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.shadowColor = base; ctx.shadowBlur = 18; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke(); ctx.restore();
    label(ctx, q.kind === 'proton' ? 'Anne Proton\'un içi' : 'Baba Nötron\'un içi', 0, -R - 16 > -cy + 14 ? -R - 16 : -R + 22, '#fff', 17);
    const qr = R * .18, tw = R * .035 * (RM ? .5 : 1);
    const pos = q.qs.map((qq, i) => {
      const a = -Math.PI / 2 + i * TAU / 3, bx = Math.cos(a) * R * .42, by = Math.sin(a) * R * .42;
      const wx = (Math.sin(q.time * 1.7 + qq.ph) + Math.sin(q.time * 2.9 + qq.ph * 2) * .6) * tw;
      const wy = (Math.cos(q.time * 1.3 + qq.ph) + Math.cos(q.time * 3.1 + qq.ph) * .5) * tw;
      const tg = tugAmount(q, qq) * R * .2;
      return { x: bx + wx + Math.cos(a) * tg, y: by + wy + Math.sin(a) * tg };
    });
    const rest = R * .42 * Math.sqrt(3);
    const pairs = [[0, 1], [1, 2], [2, 0]];
    ex.springs = [];
    for (const [i, j] of pairs) {
      const A = pos[i], B = pos[j], L = Math.hypot(B.x - A.x, B.y - A.y), str = clamp((L - rest) / (rest * .2), 0, 1);
      ctx.save(); ctx.shadowColor = COL.electron; ctx.shadowBlur = 6 + str * 16;
      spring(ctx, A.x, A.y, B.x, B.y, 9, R * .032, mix(COL.electron, '#ffffff', str * .65), (ex.sel === 'gluon' ? 3.6 : 2.4) + str * 1.6);
      ctx.restore();
      ex.springs.push([cx + A.x * sc, cy + A.y * sc, cx + B.x * sc, cy + B.y * sc]);
    }
    for (const p of q.pulses) {
      const A = pos[p.i], B = pos[p.j], x = A.x + (B.x - A.x) * p.s, y = A.y + (B.y - A.y) * p.s;
      ctx.save(); ctx.shadowColor = p.c; ctx.shadowBlur = 16; ctx.fillStyle = mix(p.c, '#ffffff', .3);
      ctx.beginPath(); ctx.arc(x, y, R * .04, 0, TAU); ctx.fill(); ctx.restore();
    }
    for (const s of q.sea) {
      const age = q.time - s.born, k = Math.sin(Math.PI * clamp(age, 0, 1));
      const x = s.x * R, y = s.y * R, off = R * .05 * (1 + age), ox = Math.cos(s.a) * off, oy = Math.sin(s.a) * off;
      ctx.save(); ctx.globalAlpha *= k * .9;
      ctx.fillStyle = '#E8ECFF'; ctx.beginPath(); ctx.arc(x - ox, y - oy, R * .03, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#E8ECFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + ox, y + oy, R * .03, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    ex.qPos = [];
    q.qs.forEach((qq, i) => {
      const p = pos[i], color = mix(QCOL[qq.prev], QCOL[qq.ci], ease(qq.ct));
      ball(ctx, p.x, p.y, qr, color, { glow: ex.sel === 'quark' ? 26 : 12, blink: blinkAt(t, qq.ph) });
      label(ctx, qq.f === 'u' ? 'u  Yukarı' : 'd  Aşağı', p.x, i === 0 ? p.y - qr - 15 : p.y + qr + 15, '#fff', 15);
      if (ex.sel === 'quark') selRing(ctx, p.x, p.y, qr, t);
      ex.qPos.push({ x: cx + p.x * sc, y: cy + p.y * sc, r: qr * sc });
    });
    ctx.restore();
  }
  ex.draw = (t, dt) => {
    const st = ex.stage, ctx = st.ctx; st.clear();
    ex.qv += ((ex.quantum ? 1 : 0) - ex.qv) * Math.min(1, dt * 3);
    updateDots(dt); updateQuarks(dt);
    if (ex.anim) {
      ex.anim.s = Math.min(1, ex.anim.s + dt / .8);
      const e = ease(ex.anim.s);
      if (ex.anim.to !== 'atom') { drawAtom(ctx, t, 1 - e, 1 + e * 4); drawInside(ctx, t, e, .3 + .7 * e); }
      else { drawInside(ctx, t, 1 - e, 1 - .7 * e); drawAtom(ctx, t, e, 5 - 4 * e); }
      if (ex.anim.s >= 1) ex.anim = null;
    } else if (ex.view === 'atom') drawAtom(ctx, t, 1, 1);
    else drawInside(ctx, t, 1, 1);
  };
  function setCaption() {
    $('kCaption').textContent = ex.view === 'atom' ? (ex.quantum ? CAPTIONS.quantum : CAPTIONS.atom) : CAPTIONS[ex.view];
  }
  function goInside(kind) {
    if (ex.view === kind) return;
    ex.q = makeQuarks(kind);
    if (ex.view === 'atom') ex.anim = { to: kind, s: RM ? 1 : 0 };
    ex.view = kind;
    $('backBtn').hidden = false;
    setCaption(); sfx.click();
  }
  function goAtom() {
    if (ex.view === 'atom') return;
    ex.anim = { to: 'atom', s: RM ? 1 : 0 };
    ex.view = 'atom';
    $('backBtn').hidden = true;
    setCaption(); sfx.click();
  }
  function drawPortrait(key) {
    const cv = $('portrait'), d = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = 84 * d; cv.height = 84 * d;
    const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, 84, 84);
    switch (key) {
      case 'proton': ball(ctx, 42, 42, 30, COL.proton); break;
      case 'neutron': ball(ctx, 42, 42, 30, COL.neutron); break;
      case 'electron': ball(ctx, 30, 48, 18, COL.electron, { glow: 10 }); ball(ctx, 59, 32, 14, COL.electron, { glow: 10 }); break;
      case 'quark': ball(ctx, 42, 24, 16, QCOL[0]); ball(ctx, 23, 57, 16, QCOL[1]); ball(ctx, 61, 57, 16, QCOL[2]); break;
      case 'gluon':
        ball(ctx, 42, 36, 26, COL.gluon);
        ctx.save(); ctx.shadowColor = COL.electron; ctx.shadowBlur = 6; spring(ctx, 14, 68, 70, 68, 6, 7, '#FFF3C4', 3.2); ctx.restore();
        break;
      case 'photon': wave(ctx, 50, 42, 0, 44, 8, 2.5, COL.photon, 3, 0); ball(ctx, 56, 42, 20, COL.photon, { glow: 12 }); break;
      default: ball(ctx, 31, 44, 21, COL.proton); ball(ctx, 55, 40, 21, COL.neutron);
    }
  }
  function select(key, stay) {
    ex.sel = key;
    const c = CHARS[key];
    const card = $('charCard');
    if (c) {
      card.style.setProperty('--c', c.color);
      $('charName').textContent = c.name; $('charRole').textContent = c.role;
      $('charText').textContent = c.text; $('charFact').textContent = c.fact;
    } else {
      card.style.removeProperty('--c');
      $('charName').textContent = 'Atom Ailesi'; $('charRole').textContent = 'Bir aile üyesine dokun';
      $('charText').textContent = 'Atomun içinde koca bir aile yaşar. Her birinin ayrı bir görevi vardır ve hep birlikte çalışırlar. Hareket eden parçacıklara dokun ya da aile üyelerinden birini seç.';
      $('charFact').textContent = '';
    }
    drawPortrait(key);
    document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.key === key));
    if (stay) return;
    if (key === 'quark' || key === 'gluon') { if (ex.view === 'atom') goInside('proton'); }
    else if (key && ex.view !== 'atom') goAtom();
  }
  const chipBox = $('chips');
  chipBox.innerHTML = '';
  Object.entries(CHARS).forEach(([k, c]) => {
    const b = document.createElement('button');
    b.className = 'chip'; b.dataset.key = k; b.textContent = c.name; b.style.setProperty('--c', c.color);
    b.setAttribute('aria-pressed', 'false'); b.type = 'button';
    b.addEventListener('click', () => { sfx.pop(); select(ex.sel === k ? null : k); });
    chipBox.appendChild(b);
  });
  on(ex.stage.c, 'click', e => {
    if (ex.anim) return;
    const p = ex.stage.pt(e), cx = ex.stage.w / 2, cy = ex.stage.h / 2;
    let hit = null;
    if (ex.view === 'atom') {
      if (ex.ePos.some(q => Math.hypot(p.x - cx - q.x, p.y - cy - q.y) < ex.re + 10)) hit = 'electron';
      if (!hit) { const n = ex.nucPos.find(q => Math.hypot(p.x - cx - q.x, p.y - cy - q.y) < ex.rn + 3); if (n) hit = n.t === 'p' ? 'proton' : 'neutron'; }
      if (!hit && ex.ePos[2] && distSeg(p.x, p.y, cx, cy, cx + ex.ePos[2].x, cy + ex.ePos[2].y) < 10) hit = 'photon';
    } else {
      if (ex.qPos.some(q => Math.hypot(p.x - q.x, p.y - q.y) < q.r + 6)) hit = 'quark';
      if (!hit && ex.springs.some(s => distSeg(p.x, p.y, ...s) < 12)) hit = 'gluon';
    }
    if (hit) { sfx.pop(); select(hit); }
  });
  on($('quantumBtn'), 'click', e => {
    ex.quantum = !ex.quantum;
    e.currentTarget.setAttribute('aria-pressed', ex.quantum);
    e.currentTarget.textContent = ex.quantum ? 'Kuantum gözlüğünü çıkar' : 'Kuantum gözlüğünü tak';
    if (ex.view !== 'atom') goAtom();
    sfx.jump(); setCaption();
    if (ex.quantum) select('electron', true);
  });
  on($('insideP'), 'click', () => { goInside('proton'); select('quark', true); });
  on($('insideN'), 'click', () => { goInside('neutron'); select('quark', true); });
  on($('backBtn'), 'click', goAtom);

  /* ---------- 2. ATOM KUR ---------- */
  const EL = [null, ['Hidrojen', 'H'], ['Helyum', 'He'], ['Lityum', 'Li'], ['Berilyum', 'Be'], ['Bor', 'B'], ['Karbon', 'C'], ['Azot', 'N'], ['Oksijen', 'O'], ['Flor', 'F'], ['Neon', 'Ne']];
  const LV = [{ z: 1, n: 0 }, { z: 2, n: 2 }, { z: 3, n: 4 }, { z: 6, n: 6 }, { z: 8, n: 8 }];
  const MAX = { p: 10, n: 12, e: 12 };
  const NAMES = { p: 'Anne Proton', n: 'Baba Nötron', e: 'Elektron Kardeş' };
  const bd = { stage: new Stage('cv-kur'), nuc: [], el: [], lvl: 0, hint: false, solved: false };
  function cnt() { return { p: bd.nuc.filter(x => x.t === 'p').length, n: bd.nuc.filter(x => x.t === 'n').length, e: bd.el.length }; }
  function fb(id, text, cls) { const el = $(id); el.textContent = text; el.className = 'feedback' + (cls ? ' ' + cls : '') + (id === 'qExp' ? ' exp' : ''); }
  function change(type, d) {
    const c = cnt();
    if (d > 0) {
      if (c[type] >= MAX[type]) { fb('mFeedback', `En fazla ${MAX[type]} ${NAMES[type]} ekleyebilirsin.`, 'bad'); return; }
      if (type === 'e') bd.el.push({ born: now(), ph: rand(0, 5) }); else bd.nuc.push({ t: type, born: now(), ph: rand(0, TAU) });
      sfx.pop();
    } else {
      if (!c[type]) return;
      if (type === 'e') bd.el.pop(); else bd.nuc.splice(bd.nuc.map(x => x.t).lastIndexOf(type), 1);
      sfx.remove();
    }
    updateReadout();
  }
  function updateReadout() {
    const c = cnt();
    $('cP').textContent = c.p; $('cN').textContent = c.n; $('cE').textContent = c.e;
    $('tZ').textContent = c.p;
    $('tSym').textContent = c.p ? EL[c.p][1] : '?';
    $('tName').textContent = c.p ? EL[c.p][0] : 'Boş ev';
    const ch = $('charge'), q = c.p - c.e;
    if (!c.p && !c.n && !c.e) { ch.textContent = 'Ev boş. Anne Proton ekleyerek başla!'; ch.className = 'charge'; }
    else if (!c.p) { ch.textContent = 'Evin adını koymak için Anne Proton gerekli!'; ch.className = 'charge pos'; }
    else if (q === 0) { ch.textContent = 'Yük: 0. Atom nötr, herkes mutlu!'; ch.className = 'charge ok'; }
    else if (q > 0) { ch.textContent = `Yük: +${q}. ${q} elektron eksik, ev pozitif kaldı.`; ch.className = 'charge pos'; }
    else { ch.textContent = `Yük: −${-q}. ${-q} elektron fazla, ev negatif oldu.`; ch.className = 'charge neg'; }
  }
  function loadLevel() {
    const L = LV[bd.lvl], name = EL[L.z][0];
    $('mLevel').textContent = `Görev ${bd.lvl + 1} / ${LV.length}`;
    $('mTitle').textContent = `${name} atomu kur`;
    $('mText').textContent = (L.n ? `${L.z} proton ve ${L.n} nötron koy.` : `${L.z} proton koy. Bu evde Baba Nötron yok!`) + ' Atomun nötr olması için kaç Elektron Kardeş gerekir? Onu sen bul!';
    bd.hint = false; bd.solved = false;
    fb('mFeedback', ''); $('nextBtn').hidden = true; $('checkBtn').hidden = false; $('hintBtn').hidden = false;
  }
  on($('checkBtn'), 'click', () => {
    if (bd.solved) return;
    const L = LV[bd.lvl], c = cnt();
    if (c.p !== L.z) { fb('mFeedback', c.p ? `Şu an ${EL[c.p][0]} kurdun. Evin adını protonlar belirler, ${L.z} proton olmalı.` : `Önce Anne Proton ekle. ${L.z} proton gerekli.`, 'bad'); sfx.bad(); return; }
    if (c.n !== L.n) { fb('mFeedback', `Protonlar doğru! Şimdi nötronlara bak: ${L.n} nötron olmalı, sende ${c.n} var.`, 'bad'); sfx.bad(); return; }
    if (c.e !== L.z) { fb('mFeedback', c.e < L.z ? 'Az kaldı! Elektron eksik, atom pozitif kaldı.' : 'Az kaldı! Elektron fazla, atom negatif oldu.', 'bad'); sfx.bad(); return; }
    bd.solved = true;
    const s = bd.hint ? 2 : 3; addStars(s); sfx.good(); confetti();
    kaydet({ oyun: 'kur', yildiz: s, puan: L.z });
    fb('mFeedback', `Harika! ${EL[L.z][0]} atomu hazır, aile çok mutlu. ${s} yıldız kazandın!`, 'good');
    $('checkBtn').hidden = true; $('hintBtn').hidden = true;
    $('nextBtn').hidden = false;
    $('nextBtn').textContent = bd.lvl < LV.length - 1 ? 'Sonraki görev' : 'Baştan başla';
    $('nextBtn').focus();
  });
  on($('hintBtn'), 'click', () => {
    bd.hint = true; sfx.click();
    fb('mFeedback', 'İpucu: Elektron Kardeşlerin sayısı Anne Protonların sayısına eşit olursa artılar ve eksiler birbirini dengeler, atom nötr olur.', '');
  });
  on($('nextBtn'), 'click', () => {
    bd.lvl = bd.lvl < LV.length - 1 ? bd.lvl + 1 : 0;
    bd.nuc = []; bd.el = []; updateReadout(); loadLevel(); sfx.click();
  });
  on($('clearBtn'), 'click', () => { bd.nuc = []; bd.el = []; updateReadout(); sfx.remove(); });
  document.querySelectorAll('.step').forEach(b => on(b, 'click', () => change(b.dataset.type, +b.dataset.d)));
  bd.draw = (t) => {
    const st = bd.stage, ctx = st.ctx; st.clear();
    const cx = st.w / 2, cy = st.h / 2, M = Math.min(st.w, st.h), c = cnt(), N = bd.nuc.length, tt = t * SPD;
    const rn = M * (N <= 4 ? .05 : N <= 10 ? .04 : .032);
    const cr = rn * 1.15 * Math.sqrt(Math.max(N - 1, 0)) + rn;
    const s1 = Math.max(cr + M * .07, M * .16), shells = [s1, s1 + M * .1, s1 + M * .19];
    const nSh = c.e > 10 ? 3 : c.e > 2 ? 2 : 1;
    ctx.save(); ctx.strokeStyle = COL.electron; ctx.shadowColor = COL.electron;
    for (let k = 0; k < 3; k++) {
      const used = k < nSh && c.e > 0;
      ctx.globalAlpha = used ? .55 : .14; ctx.shadowBlur = used ? 8 : 0; ctx.lineWidth = used ? 2.4 : 1.5;
      ctx.setLineDash(used ? [] : [6, 8]);
      ctx.beginPath(); ctx.arc(cx, cy, shells[k], 0, TAU); ctx.stroke();
    }
    ctx.restore();
    if (!N && !c.e) {
      ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, M * .09, 0, TAU); ctx.stroke(); ctx.restore();
      label(ctx, 'Çekirdek evi', cx, cy, 'rgba(255,255,255,.75)', 16);
    }
    for (let i = N - 1; i >= 0; i--) {
      const n = bd.nuc[i], a = i * 2.39996, r = rn * 1.15 * Math.sqrt(i);
      const k = RM ? 1 : easeBack(clamp((t - n.born) / .35, 0, 1));
      const jx = Math.sin(tt * 6 + n.ph) * rn * .06, jy = Math.cos(tt * 5 + n.ph) * rn * .06;
      ball(ctx, cx + Math.cos(a) * r + jx, cy + Math.sin(a) * r + jy, rn * k, n.t === 'p' ? COL.proton : COL.neutron, { blink: blinkAt(t, n.ph) });
    }
    const re = Math.max(9, M * .03);
    bd.el.forEach((e, i) => {
      const sh = i < 2 ? 0 : i < 10 ? 1 : 2, idx = sh === 0 ? i : sh === 1 ? i - 2 : i - 10;
      const count = sh === 0 ? Math.min(c.e, 2) : sh === 1 ? Math.min(c.e - 2, 8) : c.e - 10;
      const sp = [.9, .6, .45][sh] * SPD * (sh === 1 ? -1 : 1), a = tt * sp + idx * TAU / count + sh * .4;
      const k = RM ? 1 : easeBack(clamp((t - e.born) / .35, 0, 1));
      ball(ctx, cx + Math.cos(a) * shells[sh], cy + Math.sin(a) * shells[sh], re * k, COL.electron, { glow: 14, blink: blinkAt(t, e.ph) });
    });
  };

  /* ---------- 3. FOTON YAKALA ---------- */
  const PT = [
    { c: COL.photon, name: 'Camgöbeği', jump: 2, w: .36 },
    { c: COL.violet, name: 'Mor', jump: 3, w: .26 },
    { c: COL.orange, name: 'Turuncu', jump: 0, w: .19 },
    { c: COL.pink, name: 'Pembe', jump: 0, w: .19 }
  ];
  const fg = { stage: new Stage('cv-foton'), running: false, time: 45, score: 0, photons: [], lvl: 1, upUntil: 0, upColor: null, spawn: 0, ea: 0, floats: [], bursts: [], emits: [] };
  function pickType() { let r = Math.random(); for (const p of PT) { if ((r -= p.w) <= 0) return p; } return PT[0]; }
  function fgGeom() { const st = fg.stage, M = Math.min(st.w, st.h); return { cx: st.w / 2, cy: st.h / 2, M, rings: [M * .13, M * .25, M * .37] }; }
  function ePos() { const g = fgGeom(), R = g.rings[fg.lvl - 1]; return { x: g.cx + Math.cos(fg.ea) * R, y: g.cy + Math.sin(fg.ea) * R }; }
  function floatText(text, x, y, c) { fg.floats.push({ text, x, y, c, age: 0 }); }
  function burst(x, y, c) { fg.bursts.push({ x, y, c, age: 0 }); }
  on(fg.stage.c, 'pointerdown', e => {
    const p = fg.stage.pt(e);
    let best = null, bd2 = 36 * 36;
    for (const ph of fg.photons) { if (ph.rejected) continue; const d2 = (ph.x - p.x) ** 2 + (ph.y - p.y) ** 2; if (d2 < bd2) { bd2 = d2; best = ph; } }
    if (best) catchPhoton(best);
  });
  function catchPhoton(ph) {
    if (!ph.type.jump) {
      ph.rejected = true; floatText(`${ph.type.name} uymadı!`, ph.x, ph.y - 18, ph.type.c); sfx.bad();
      $('fCaption').textContent = `${ph.type.name} fotonun enerjisi katlar arasındaki farka uymuyor. Elektron onu alamaz, foton yoluna devam ediyor.`;
      return;
    }
    if (fg.lvl !== 1) { floatText('Önce elektron insin!', ph.x, ph.y - 18, '#fff'); return; }
    fg.photons = fg.photons.filter(x => x !== ph);
    const from = ePos(); burst(from.x, from.y, ph.type.c);
    fg.lvl = ph.type.jump; fg.upUntil = now() + 1.1; fg.upColor = ph.type.c;
    const to = ePos(); burst(to.x, to.y, ph.type.c); sfx.jump();
    if (fg.running) {
      const pts = ph.type.jump === 3 ? 2 : 1; fg.score += pts; $('fScore').textContent = fg.score;
      floatText(`+${pts}`, to.x, to.y - 22, ph.type.c);
    } else floatText('Zıpladı!', to.x, to.y - 22, ph.type.c);
    $('fCaption').textContent = `Kuantum sıçraması! Minik Elektron ${ph.type.jump}. kata aradaki yoldan geçmeden, bir anda zıpladı.`;
  }
  function startGame() {
    fg.running = true; fg.time = 45; fg.score = 0; fg.photons = []; fg.lvl = 1; fg.spawn = 0;
    $('fScore').textContent = 0; $('fTime').textContent = 45;
    $('fStart').disabled = true; $('fStart').textContent = 'Oyun sürüyor';
    fb('fFeedback', ''); sfx.click();
    $('fCaption').textContent = 'Süre başladı! Camgöbeği ve mor fotonları yakala.';
  }
  function endGame() {
    fg.running = false;
    const s = Math.min(5, Math.floor(fg.score / 3)); addStars(s);
    kaydet({ oyun: 'foton', yildiz: s, puan: fg.score });
    fb('fFeedback', `Süre bitti! ${fg.score} puan topladın` + (s ? ` ve ${s} yıldız kazandın.` : '. Bir daha dene, yıldızlar seni bekliyor!'), s ? 'good' : '');
    $('fStart').disabled = false; $('fStart').textContent = 'Tekrar oyna';
    if (s >= 3) { confetti(); sfx.good(); }
    $('fCaption').textContent = 'Alıştırma modundasın. İstediğin kadar foton yakalayabilirsin.';
  }
  on($('fStart'), 'click', startGame);
  fg.draw = (t, dt) => {
    const st = fg.stage, ctx = st.ctx; st.clear();
    const g = fgGeom(), ringCol = [COL.electron, COL.photon, COL.violet];
    if (fg.running) { fg.time -= dt; $('fTime').textContent = Math.max(0, Math.ceil(fg.time)); if (fg.time <= 0) endGame(); }
    fg.ea += dt * 1.1 * SPD;
    if (fg.lvl > 1 && now() > fg.upUntil) {
      const p = ePos();
      fg.emits.push({ x: p.x, y: p.y, ang: fg.ea, c: fg.upColor });
      fg.lvl = 1; const q = ePos(); burst(q.x, q.y, fg.upColor); burst(p.x, p.y, fg.upColor);
      floatText('Işık saçtı!', p.x, p.y - 22, '#fff'); sfx.emit();
      $('fCaption').textContent = 'Minik Elektron geri indi ve fazla enerjisini yeni bir foton olarak saçtı. İşte ışık böyle doğar!';
    }
    fg.spawn -= dt;
    if (fg.spawn <= 0) {
      fg.spawn = fg.running ? rand(.7, 1.1) : rand(1.3, 1.8);
      fg.photons.push({ x: -30, y: rand(st.h * .12, st.h * .88), vy: rand(-14, 14), type: pickType(), ph: rand(0, TAU), rejected: false });
    }
    const speed = Math.max(110, st.w / 5.5);
    fg.photons.forEach(p => { p.x += speed * dt; p.y = clamp(p.y + p.vy * dt, 20, st.h - 20); });
    fg.photons = fg.photons.filter(p => p.x < st.w + 60);
    g.rings.forEach((R, k) => {
      ctx.save(); ctx.strokeStyle = ringCol[k]; ctx.shadowColor = ringCol[k]; ctx.shadowBlur = 8;
      ctx.globalAlpha = fg.lvl === k + 1 ? .85 : .45; ctx.lineWidth = fg.lvl === k + 1 ? 3 : 2;
      ctx.beginPath(); ctx.arc(g.cx, g.cy, R, 0, TAU); ctx.stroke(); ctx.restore();
      label(ctx, `${k + 1}. kat`, g.cx + R * Math.cos(-.95), g.cy + R * Math.sin(-.95) - 12, ringCol[k], 14);
    });
    const rn = Math.max(9, g.M * .036);
    [[-.55, -.4, 'p'], [.55, -.35, 'n'], [-.45, .5, 'n'], [.5, .45, 'p']].forEach(([ox, oy, ty], i) => {
      const j = Math.sin(t * 6 * SPD + i * 2) * rn * .06;
      ball(ctx, g.cx + ox * rn * 1.6 + j, g.cy + oy * rn * 1.6, rn, ty === 'p' ? COL.proton : COL.neutron, { blink: blinkAt(t, i) });
    });
    for (const p of fg.photons) {
      ctx.save(); if (p.rejected) ctx.globalAlpha = .35;
      wave(ctx, p.x - 10, p.y, 0, 50, 7, 2.5, p.type.c, 3, t * 10 + p.ph);
      ball(ctx, p.x, p.y, 13, p.type.c, { glow: 16, blink: blinkAt(t, p.ph) });
      ctx.restore();
    }
    fg.emits.forEach(e => { e.x += Math.cos(e.ang) * 260 * dt; e.y += Math.sin(e.ang) * 260 * dt; });
    fg.emits = fg.emits.filter(e => e.x > -60 && e.x < st.w + 60 && e.y > -60 && e.y < st.h + 60);
    for (const e of fg.emits) { wave(ctx, e.x, e.y, e.ang, 46, 7, 2.5, e.c, 3, t * 10); ctx.save(); ctx.shadowColor = e.c; ctx.shadowBlur = 18; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, TAU); ctx.fill(); ctx.restore(); }
    const ep = ePos(), er = Math.max(11, g.M * .036);
    ball(ctx, ep.x, ep.y, er, COL.electron, { glow: fg.lvl > 1 ? 30 : 14, blink: blinkAt(t, 9) });
    fg.bursts.forEach(b => { b.age += dt; });
    fg.bursts = fg.bursts.filter(b => b.age < .5);
    for (const b of fg.bursts) {
      ctx.save(); ctx.globalAlpha = 1 - b.age / .5; ctx.strokeStyle = b.c; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, 10 + b.age * 70, 0, TAU); ctx.stroke(); ctx.restore();
    }
    fg.floats.forEach(f => { f.age += dt; });
    fg.floats = fg.floats.filter(f => f.age < 1.1);
    for (const f of fg.floats) { ctx.save(); ctx.globalAlpha = 1 - f.age / 1.1; label(ctx, f.text, f.x, f.y - f.age * 30, f.c, 18); ctx.restore(); }
  };

  /* ---------- 4. BİLGİ YARIŞMASI ---------- */
  const QZ = [
    { q: 'Atomun ortasındaki, protonlarla nötronların birlikte yaşadığı eve ne denir?', a: ['Çekirdek', 'Yörünge', 'Foton', 'Molekül'], x: 'Anne Protonlar ve Baba Nötronlar çekirdek evinde birlikte yaşar.' },
    { q: 'Anne Proton\'un yükü nedir?', a: ['Pozitif (+)', 'Negatif (−)', 'Nötr (0)'], x: 'Anne Proton hep pozitiftir ve herkese moral verir.' },
    { q: 'Bir atomun adını ne belirler?', a: ['Proton sayısı', 'Elektron sayısı', 'Nötron sayısı', 'Atomun rengi'], x: 'Çekirdekte 6 proton varsa o atom karbondur, 8 proton varsa oksijendir.' },
    { q: 'Baba Nötron çekirdekte ne iş yapar?', a: ['Çekirdeği dengede ve sağlam tutar', 'Işık taşır', 'Halka yollarda koşar'], x: 'Nötr olduğu için kimsenin tarafını tutmaz ve çekirdek evini sağlam tutar.' },
    { q: 'Elektron Kardeşler neden çekirdekten kopmaz?', a: ['Eksi yüklü oldukları için artı yüklü protonlara çekilirler', 'Gluon Dede onları tutar', 'Çok ağır oldukları için'], x: 'Zıt yükler birbirini çeker. Foton Postacı da bu çekimin haberini taşır.' },
    { q: 'Kuantum gözlüğüyle bakınca elektron nasıl görünür?', a: ['Bir olasılık bulutu gibi', 'Hiç kıpırdamayan bir top gibi', 'Kare bir kutu gibi'], x: 'Elektronun yeri kesin bilinemez, sadece nerede bulunma ihtimalinin yüksek olduğunu biliriz.' },
    { q: 'Bir protonun içinde kaç kuark bebek vardır?', a: ['3', '1', '5', '10'], x: 'Protonda iki Yukarı (u) ve bir Aşağı (d) kuark bebek vardır.' },
    { q: 'Kuark bebekleri birbirine kim bağlar?', a: ['Gluon Dede', 'Foton Postacı', 'Elektron Kardeşler'], x: 'Gluon Dede\'nin yay gibi sakalı, uzaklaşmaya çalışan bebeği geri çeker.' },
    { q: 'Elektron bir foton yakalayıp üst kata zıplar. Geri inerken ne olur?', a: ['Işık saçar, yani yeni bir foton yollar', 'Kaybolup gider', 'Protona dönüşür'], x: 'Fazla enerjisini ışık olarak verir. Neon lambaların ve havai fişeklerin renkli ışıkları da böyle oluşur.' }
  ];
  const PRAISE = ['Aferin, doğru!', 'Süpersin!', 'Harika, bildin!', 'Tam isabet!'];
  const qz = { i: 0, score: 0, answered: false };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function renderProgress() {
    $('qProgress').innerHTML = QZ.map((_, i) => `<span class="${i < qz.i ? 'done' : i === qz.i ? 'now' : ''}"></span>`).join('');
  }
  function renderQ() {
    const Q = QZ[qz.i];
    qz.answered = false;
    $('qLevel').textContent = `Soru ${qz.i + 1} / ${QZ.length}`;
    renderProgress();
    $('qText').textContent = Q.q;
    const box = $('qOpts'); box.innerHTML = '';
    shuffle(Q.a.map((t, k) => ({ t, ok: k === 0 }))).forEach(o => {
      const b = document.createElement('button'); b.className = 'opt'; b.type = 'button'; b.textContent = o.t; b.dataset.ok = o.ok;
      b.addEventListener('click', () => answer(b));
      box.appendChild(b);
    });
    fb('qExp', ''); $('qNext').hidden = true;
  }
  function answer(btn) {
    if (qz.answered) return;
    qz.answered = true;
    const Q = QZ[qz.i], ok = btn.dataset.ok === 'true';
    document.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.ok === 'true') b.classList.add('correct'); });
    if (ok) { qz.score++; addStars(1); sfx.good(); fb('qExp', `${PRAISE[qz.i % PRAISE.length]} ${Q.x}`, 'good'); }
    else { btn.classList.add('wrong'); sfx.bad(); fb('qExp', `Doğru cevap: ${Q.a[0]}. ${Q.x}`, 'bad'); }
    $('qNext').hidden = false;
    $('qNext').textContent = qz.i < QZ.length - 1 ? 'Sonraki soru' : 'Sonucu gör';
    $('qNext').focus();
  }
  on($('qNext'), 'click', () => {
    if (qz.i === -1) { qz.i = 0; qz.score = 0; renderQ(); return; }
    if (qz.i < QZ.length - 1) { qz.i++; renderQ(); return; }
    qz.i = QZ.length; renderProgress();
    kaydet({ oyun: 'yarisma', yildiz: qz.score, puan: qz.score });
    $('qLevel').textContent = 'Yarışma bitti';
    $('qText').textContent = `${QZ.length} sorudan ${qz.score} tanesini doğru bildin!`;
    $('qOpts').innerHTML = '';
    const good = qz.score >= 7;
    fb('qExp', good ? 'Atom Ailesi seninle gurur duyuyor. Artık gerçek bir atom kâşifisin!' : 'Atomu keşfet bölümüne bir göz at, sonra yeniden dene. Aile seni bekliyor!', good ? 'good' : '');
    if (good) confetti();
    qz.i = -1; $('qNext').textContent = 'Yeniden başla';
  });

  /* ---------- Sekmeler ve ana döngü ---------- */
  const MODS = { kesfet: ex, kur: bd, foton: fg };
  const tabs = [...document.querySelectorAll('.tab')];
  let active = 'kesfet';
  function fitActive() { const m = MODS[active]; if (m && m.stage) m.stage.fit(); }
  function showTab(name) {
    active = name;
    tabs.forEach(b => {
      const acik = b.dataset.tab === name;
      b.setAttribute('aria-selected', acik); b.tabIndex = acik ? 0 : -1;
      const panel = $('p-' + b.dataset.tab); if (panel) panel.hidden = !acik;
    });
    fitActive();
  }
  tabs.forEach(b => on(b, 'click', () => { if (b.dataset.tab !== active) sfx.click(); showTab(b.dataset.tab); }));
  on(document.querySelector('.tabs'), 'keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = tabs.findIndex(b => b.dataset.tab === active);
    const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    showTab(tabs[j].dataset.tab); tabs[j].focus();
  });
  on(window, 'resize', fitActive);
  let ro = null;
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(fitActive);
    [ex, bd, fg].forEach(m => ro.observe(m.stage.c));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!durdu) fitActive(); });

  let last = performance.now();
  function loop(ts) {
    if (durdu) return;
    const dt = Math.min(.05, Math.max(0, (ts - last) / 1000)); last = ts;
    const m = MODS[active]; if (m && m.draw) m.draw(ts / 1000, dt);
    rafId = requestAnimationFrame(loop);
  }

  select(null); setCaption();
  updateReadout(); loadLevel();
  renderQ();
  $('fCaption').textContent = 'Alıştırma modundasın: fotonlara dokunarak dene. Hazır olunca "Oyunu başlat" düğmesine bas.';
  showTab('kesfet');
  rafId = requestAnimationFrame(loop);

  /* Temizlik: sayfadan çıkınca her şeyi durdur */
  return () => {
    durdu = true;
    cancelAnimationFrame(rafId);
    ac.abort();
    if (ro) ro.disconnect();
    chipBox.innerHTML = '';
    conf.parts = [];
    if (actx && actx.close) actx.close().catch(() => {});
  };
}
