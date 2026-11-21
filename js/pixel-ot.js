/* 픽셀 오티
   그리기 규칙은 versions/extra-time-ot-pixel-v1-20261120/source/ot_pixel.html을 그대로 옮겼다.
   어두운 바탕에서 묻히지 않도록 make_gif.py의 OUTLINE(#6b7266) 한 칸 테두리를 두른다. */
(() => {
  const btn = document.getElementById('ot');
  if (!btn) return;
  const cvs = btn.querySelector('canvas'), ctx = cvs.getContext('2d', { willReadFrequently: true });
  const log = document.getElementById('log'), logText = document.getElementById('logText');
  const brand = btn.parentElement;
  const W = 32, H = 34, OX = 4, OY = 6;
  const OUTLINE = [0x6b, 0x72, 0x66];
  const C = {
    ear:'#2f3830', earHi:'#435043', hole:'#0b120d', head:'#252d27', headHi:'#323c34', rim:'#3c4a3f',
    lit:'#334036', line:'#d8d0b8', glow:'#fff1c4', shirt:'#2f6a46', shirtHi:'#3c7c55', shorts:'#22513a',
    arm:'#252d27', stripe:'#d8d0b8', lid:'#474c47', lidHi:'#5d635c', base:'#a9aea6', baseDk:'#5d625b',
    logo:'#e5be46'
  };
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(OX + x, OY + y, w, h); };
  const rm = (x, y, w, h, c) => { r(x, y, w, h, c); r(24 - x - w, y, w, h, c); };

  const EAR = [[1,4,7],[2,3,8],[3,2,8],[4,2,8],[5,2,7],[6,3,6]];
  const HOLE = [[3,4,5],[4,4,6],[5,5,5]];

  function outline() {
    const img = ctx.getImageData(0, 0, W, H), d = img.data;
    const filled = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) filled[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (filled[i]) continue;
      if ((x > 0 && filled[i - 1]) || (x < W - 1 && filled[i + 1]) ||
          (y > 0 && filled[i - W]) || (y < H - 1 && filled[i + W])) {
        d[i * 4] = OUTLINE[0]; d[i * 4 + 1] = OUTLINE[1]; d[i * 4 + 2] = OUTLINE[2]; d[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function draw(s) {
    ctx.clearRect(0, 0, W, H);
    const hy = s.hy;
    // 발
    rm(8, 24, 3, 2, C.arm); rm(9, 24, 2, 1, C.stripe);
    // 반바지
    r(8, 22, 8, 1, C.shorts); rm(8, 23, 3, 1, C.shorts);
    // 상의
    r(8, 17, 8, 5, C.shirt); r(10, 17, 1, 5, C.shirtHi); r(13, 17, 1, 5, C.shirtHi);
    rm(7, 17, 1, 2, C.shirt);
    r(10, 17, 1, 1, C.line); r(13, 17, 1, 1, C.line); r(11, 18, 2, 1, C.line);
    // 팔
    if (!s.lap || s.lap.lid === 0) rm(6, 19, 2, 3, C.arm);
    else rm(6, 19, 2, 2, C.arm);
    // 귀
    for (const [y, a, b] of EAR) rm(a, y + hy, b - a + 1, 1, y === 1 ? C.earHi : C.ear);
    for (const y of [2, 3, 4]) rm(EAR[y - 1][1], y + hy, 1, 1, C.earHi);
    for (const [y, a, b] of HOLE) rm(a, y + hy, b - a + 1, 1, C.hole);
    // 머리
    for (let y = 3; y <= 16; y++) for (let x = 5; x <= 18; x++) {
      const dx = x + .5 - 12, dy = y + .5 - 10, dd = dx * dx + dy * dy;
      if (dd > 49.5) continue;
      let c = C.head;
      if (dx + dy < -5.5 && dd < 36) c = C.headHi;
      else if (dd > 38 && dx > 1.5 && dy < 2) c = C.rim;
      if (s.glow && y >= 12 && dd < 46) c = C.lit;
      r(x, y + hy, 1, 1, c);
    }
    // 얼굴선
    const lc = s.glow ? (s.blink ? C.glow : C.line) : C.line;
    rm(5, 10 + hy, 4, 1, lc); rm(9, 11 + hy, 1, 1, lc); r(10, 12 + hy, 4, 1, lc);
    // 노트북 (뒷면이 보는 쪽을 향한다)
    if (s.lap) {
      const { by, lid } = s.lap;
      r(5, by, 14, 1, C.base); r(5, by + 1, 14, 1, C.baseDk);
      if (lid > 0) {
        r(5, by - 2 + s.dL, 2, 2, C.arm); r(17, by - 2 + s.dR, 2, 2, C.arm);
        const top = by - lid;
        r(7, top, 10, lid, C.lid); r(7, top, 10, 1, C.lidHi);
        if (lid >= 7) {
          ctx.globalAlpha = s.logoA;
          rm(8, top + 3, 2, 1, C.logo); rm(10, top + 4, 1, 1, C.logo); r(11, top + 5, 2, 1, C.logo);
          ctx.globalAlpha = 1;
        }
      }
    }
    outline();
    // 불티는 테두리 밖에 또렷하게만 (GIF와 같은 규칙)
    for (const p of sparks) if (p.life >= 3) r(p.x, p.y, 1, 1, p.c);
  }

  const MSGS = [
    '경기 끝. 마지막 테이블 기록 중',
    '오늘의 장소 MONZA, 레이스가 끝난 밤',
    '남은 사람 둘. 오티는 아직 안 가요',
    'BERNABÉU 경기 뒤 이야기 저장 중',
    '연장전 다시 보기 메모 중',
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let mode = 'idle', t = 0, f = 0, msg = 0, target = '', typed = 0, sparks = [];
  const s = { hy: 0, lap: null, glow: false, blink: false, dL: 0, dR: 0, logoA: 1 };

  function start() {
    if (mode === 'type') { mode = 'close'; f = 0; return; }
    if (mode !== 'idle') return;
    mode = 'open'; f = 0; typed = 0;
    target = MSGS[msg++ % MSGS.length];
    logText.textContent = '';
    log.classList.add('is-live');
    btn.setAttribute('aria-pressed', 'true');
    wake();
  }

  function tick() {
    t++;
    sparks = sparks.map(p => ({ ...p, y: p.y - 1, life: p.life - 1 })).filter(p => p.life > 0);
    s.glow = false; s.dL = 0; s.dR = 0;
    if (mode === 'idle') {
      s.lap = null;
      s.hy = reduce.matches ? 0 : (Math.floor(t / 8) % 2);
    } else if (mode === 'open') {
      f++;
      if (f <= 3) s.lap = { by: 26 - f, lid: 0 };
      else s.lap = { by: 23, lid: Math.min(8, f - 3) };
      s.hy = f > 3 ? 1 : 0;
      if (s.lap.lid === 8) { mode = 'type'; f = 0; }
    } else if (mode === 'type') {
      f++;
      s.lap = { by: 23, lid: 8 };
      s.glow = true; s.blink = f % 6 < 3;
      const k = Math.random();
      s.dL = k < .45 ? -1 : 0; s.dR = k > .55 ? -1 : 0;
      s.hy = Math.random() < .18 ? 0 : 1;
      s.logoA = .65 + .35 * Math.abs(Math.sin(f / 3));
      if (!reduce.matches && Math.random() < .7) {
        sparks.push({ x: 7 + Math.floor(Math.random() * 10), y: 14, life: 6,
          c: Math.random() < .5 ? C.logo : C.line });
      }
      if (typed < target.length) { typed++; logText.textContent = target.slice(0, typed); }
      else if (f > target.length + 16) { mode = 'close'; f = 0; }
    } else if (mode === 'close') {
      f++;
      const lid = 8 - f;
      if (lid >= 0) s.lap = { by: 23, lid };
      else s.lap = { by: 23 + (f - 8), lid: 0 };
      s.hy = lid > 0 ? 1 : 0;
      if (logText.textContent.length < target.length) logText.textContent = target;
      if (s.lap.by > 26) { mode = 'idle'; s.lap = null; btn.setAttribute('aria-pressed', 'false'); }
    }
    draw(s);
  }

  /* 크기: 로고 폭의 30%에 가장 가까운 정수 배율(한 칸 3–7px). 정수라야 픽셀 경계가 뭉개지지 않는다. */
  function fit() {
    const w = brand.getBoundingClientRect().width;
    const cell = Math.max(3, Math.min(7, Math.round(w * 0.3 / W)));
    btn.style.setProperty('--ot-w', W * cell + 'px');
    btn.style.setProperty('--ot-h', H * cell + 'px');
  }
  fit();
  new ResizeObserver(fit).observe(brand);

  /* 화면 밖이거나 탭이 숨으면 멈춘다. */
  let timer = 0, visible = true;
  function wake() { if (!timer && visible && !document.hidden) timer = setInterval(tick, 90); }
  function sleep() { clearInterval(timer); timer = 0; }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? wake() : sleep(); })
    .observe(btn);
  document.addEventListener('visibilitychange', () => document.hidden ? sleep() : wake());

  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', start);
  draw(s);
  wake();
})();
