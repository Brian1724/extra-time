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

/* ---------- 굿즈: 코스터 앞면 고르기와 뒤집기 ---------- */
(() => {
  const flip = document.getElementById('flip');
  if (!flip) return;
  const front = document.getElementById('coaster-front');
  const hint = document.getElementById('flip-hint');
  const chips = [...document.querySelectorAll('.chips .chip')];

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
})();
