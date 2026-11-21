/* 페이지마다 있는 것만 켠다. 오티: 회전 뷰어와 설정 목록. 에디션: 지역 탭. 굿즈: 코스터. */

/* ---------- 오티 회전 뷰어 ----------
   턴테이블 24장(15°씩). 첫 장만 먼저 받고, 뷰어가 화면 가까이 오면 나머지 23장을 받는다. */
(() => {
  const stage = document.getElementById('turn');
  if (!stage) return;
  const range = document.getElementById('turn-angle');
  const out = document.getElementById('turn-deg');
  const traits = [...document.querySelectorAll('.trait')];
  const N = 24;
  const frames = [stage.querySelector('img')];
  let frame = 0;

  function load() {
    if (frames.length > 1) return;
    const first = frames[0];
    for (let i = 1; i < N; i++) {
      const n = String(i).padStart(2, '0');
      const im = new Image();
      im.alt = ''; im.draggable = false; im.decoding = 'async';
      im.width = 1072; im.height = 1228;
      im.sizes = first.sizes;
      im.srcset = `assets/img/turn/ot_${n}-640.webp 640w, assets/img/turn/ot_${n}-1072.webp 1072w`;
      im.src = `assets/img/turn/ot_${n}-1072.webp`;
      stage.appendChild(im);
      frames.push(im);
    }
  }

  function set(n) {
    load();
    const f = ((n % N) + N) % N;
    if (f === frame) return;
    frames[frame].classList.remove('is-on');
    frames[f].classList.add('is-on');
    frame = f;
    const deg = f * 15 + '°';
    stage.setAttribute('aria-valuenow', f * 15);
    stage.setAttribute('aria-valuetext', deg);
    range.value = f;
    out.textContent = deg;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { load(); io.disconnect(); } },
      { rootMargin: '400px 0px' });
    io.observe(stage);
  } else load();

  let drag = null;
  stage.addEventListener('pointerdown', e => {
    drag = { x: e.clientX, f: frame };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-drag');
  });
  stage.addEventListener('pointermove', e => {
    if (!drag) return;
    const step = Math.max(10, stage.getBoundingClientRect().width / 28);
    set(drag.f - Math.round((e.clientX - drag.x) / step));
  });
  const end = () => { drag = null; stage.classList.remove('is-drag'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'ArrowDown') set(frame + 1);
    else if (k === 'ArrowRight' || k === 'ArrowUp') set(frame - 1);
    else if (k === 'Home') set(0);
    else return;
    e.preventDefault();
  });
  range.addEventListener('input', () => set(parseInt(range.value, 10) || 0));

  traits.forEach(btn => btn.addEventListener('click', () => {
    traits.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    set(parseInt(btn.dataset.frame, 10) || 0);
  }));
})();

/* ---------- 에디션: 지역 탭 ---------- */
(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  if (!tabs.length) return;
  const panel = document.getElementById('region-panel');
  const pic = document.getElementById('region-img');
  const note = document.getElementById('region-note');

  // 다른 지역 사진은 미리 받아 둔다. 탭을 눌렀을 때 빈 칸이 보이지 않게.
  addEventListener('load', () => tabs.slice(1).forEach(t => {
    const im = new Image(); im.sizes = pic.sizes;
    im.srcset = `assets/img/${t.dataset.img}-640.webp 640w, assets/img/${t.dataset.img}-1072.webp 1072w`;
  }));

  function pick(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const k = tab.dataset.img;
    pic.srcset = `assets/img/${k}-640.webp 640w, assets/img/${k}-1072.webp 1072w`;
    pic.src = `assets/img/${k}-1072.webp`;
    pic.alt = tab.dataset.alt;
    note.textContent = tab.dataset.note;
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
  }

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => {
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      pick(tabs[j], true);
    });
  });
})();

/* ---------- 굿즈: 코스터 앞면 고르기, 뒤집기, 뒷면에 기록 남기기 ----------
   적는 대로 뒷면 세 줄에 손글씨로 들어간다. 줄보다 길면 글자 폭을 줄여 맞춘다. 저장하면 뒷면을 PNG로 내려받는다. */
(() => {
  const flip = document.getElementById('flip');
  if (!flip) return;
  const front = document.getElementById('coaster-front');
  const hint = document.getElementById('flip-hint');
  const chips = [...document.querySelectorAll('.chips .chip')];
  const inputs = [...document.querySelectorAll('#note input[data-ink]')];
  const status = document.getElementById('note-status');
  const save = document.getElementById('note-save');
  const LINE = { x: 34, w: 46, size: 7.4, y: { after: 42.6, date: 54.6, with: 66.6 } };   // 도안(99mm) 좌표
  const PEN = '"Nanum Pen Script", "Apple SD Gothic Neo", cursive';

  function setFlipped(on) {
    flip.setAttribute('aria-pressed', String(on));
    flip.setAttribute('aria-label', on ? '코스터 앞면 보기' : '코스터 뒤집어 뒷면 보기');
    hint.textContent = on ? '다시 누르면 앞면' : '눌러서 뒤집기';
  }
  flip.addEventListener('click', () => setFlipped(flip.getAttribute('aria-pressed') !== 'true'));
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(o => o.setAttribute('aria-pressed', String(o === c)));
    front.src = `assets/svg/ot_coaster_front_${c.dataset.front}.svg`;
    front.alt = c.dataset.alt;
    setFlipped(false);
  }));

  if (!inputs.length) return;
  const dateInput = inputs.find(i => i.name === 'date');
  if (dateInput && !dateInput.value) {
    const d = new Date();
    dateInput.value = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function ink(input) {
    const t = document.getElementById(input.dataset.ink);
    t.textContent = input.value.trim();
    t.removeAttribute('textLength'); t.removeAttribute('lengthAdjust');
    try {
      if (t.getComputedTextLength() > LINE.w) { t.setAttribute('textLength', LINE.w); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
    } catch (e) { /* 화면에 없을 때는 길이를 못 잴 수 있다 */ }
  }
  inputs.forEach(i => {
    ink(i);
    i.addEventListener('input', () => ink(i));
    i.addEventListener('focus', () => setFlipped(true));
  });
  if (document.fonts) document.fonts.load(`20px ${PEN}`, '오늘밤기록').then(() => inputs.forEach(ink)).catch(() => {});

  save.addEventListener('click', async () => {
    status.textContent = '이미지를 만드는 중이에요';
    try {
      const S = 1200, k = S / 99;
      const c = document.createElement('canvas'); c.width = c.height = S;
      const x = c.getContext('2d');
      const art = new Image(); art.src = 'assets/svg/ot_coaster_back.svg';
      await art.decode();
      x.drawImage(art, 0, 0, S, S);
      if (document.fonts) await document.fonts.load(`${LINE.size * k}px ${PEN}`, inputs.map(i => i.value).join('') || '가');
      x.fillStyle = '#1f2a22';
      x.font = `${LINE.size * k}px ${PEN}`;
      for (const i of inputs) {
        const v = i.value.trim();
        if (!v) continue;
        const w = x.measureText(v).width, max = LINE.w * k;
        x.save(); x.translate(LINE.x * k, LINE.y[i.name] * k);
        if (w > max) x.scale(max / w, 1);
        x.fillText(v, 0, 0); x.restore();
      }
      const blob = await new Promise(r => c.toBlob(r, 'image/png'));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'extra-time-coaster.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      status.textContent = '저장했어요. 오늘 밤의 코스터예요.';
    } catch (e) {
      status.textContent = '이미지를 만들지 못했어요. 한 번 더 눌러 주세요.';
    }
  });
})();

/* ---------- 스크롤 연출 공통 ----------
   매 프레임 한 번만 계산한다. 움직임 줄이기 설정이면 연출 없이 마지막 장면을 보여 준다. */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.max(0, Math.min(1, v));
function onScrollFrame(fn) {
  let raf = 0;
  const run = () => { raf = 0; fn(); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(run); }, { passive: true });
  addEventListener('resize', run);
  run();
}

/* ---------- 에디션: 장소 카드의 깊이 ----------
   같은 카메라로 렌더한 배경 판과 오티 판이 서로 다른 속도로 움직인다. 카드가 화면 가운데 오면 두 판이 원래 자리에서 맞물린다. */
(() => {
  const cards = [...document.querySelectorAll('[data-depth]')];
  if (!cards.length || reduceMotion) return;
  onScrollFrame(() => {
    const vh = innerHeight;
    for (const c of cards) {
      const r = c.querySelector('.place-card__bg').getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const q = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      c.style.setProperty('--bg-y', (q * -2.5).toFixed(2) + '%');
      c.style.setProperty('--fig-y', (q * -7).toFixed(2) + '%');
      c.style.setProperty('--sc', (1.1 - .04 * (1 - Math.abs(q))).toFixed(4));
    }
  });
})();

/* ---------- 굿즈: 맥주잔에 빛이 지나간다 ----------
   잔이 화면 아래 10%에 닿을 때 시작해서 위 20%에 이를 때 다 밝아진다. */
(() => {
  const f = document.querySelector('[data-sweep]');
  if (!f || reduceMotion) return;
  onScrollFrame(() => {
    const vh = innerHeight, top = f.getBoundingClientRect().top;
    f.style.setProperty('--sweep', clamp01((vh * .9 - top) / (vh * .7)).toFixed(3));
  });
})();

/* ---------- 굿즈 끝: 불 끄기 ----------
   스크롤 40%까지 조명이 꺼지고 시그니처 라인만 남는다. 45%를 넘으면 오티가 마지막 기록을 남기고 노트북을 덮는다.
   다 덮으면 라인까지 꺼진다. 위로 되돌아가면 처음 상태로. */
(() => {
  const sec = document.getElementById('close');
  if (!sec || !window.PixelOT) return;
  const LINE = '오늘 기록 끝. 불 끕니다', START = '마지막 손님이 일어났어요';
  const ot = window.PixelOT(document.getElementById('ot-close'), {
    log: document.getElementById('close-log'),
    logText: document.getElementById('close-log-text'),
  });
  if (reduceMotion) { sec.classList.add('is-off'); ot.finish(LINE); return; }
  sec.classList.add('is-live');
  let state = 'on';
  onScrollFrame(() => {
    const r = sec.getBoundingClientRect(), span = r.height - innerHeight;
    const p = span > 0 ? clamp01(-r.top / span) : 0;
    sec.style.setProperty('--dim', clamp01(p / .4).toFixed(3));
    if (state === 'on' && p > .45) {
      state = 'closing';
      ot.play(LINE, () => {
        if (state !== 'closing') return;
        state = 'off'; sec.classList.add('is-off'); ot.setStill(true);
      });
    } else if (state !== 'on' && p < .2) {
      state = 'on'; sec.classList.remove('is-off'); ot.reset(START);
    }
  });
})();
