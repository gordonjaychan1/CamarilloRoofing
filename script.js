// Camarillo Roofing Solution: modern site (v2)

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

$('#year').textContent = new Date().getFullYear();

// ── Nav: solid pill once you scroll; mobile quick-action bar after the hero ──
const nav = $('#nav');
const actionBar = $('#actionBar');
let contactInView = false;
function onScroll() {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 40);
  actionBar.classList.toggle('show', y > window.innerHeight * 0.6 && !contactInView);
}
// Hide the quick-action bar while the estimate form is on screen so it never covers the form
new IntersectionObserver(([entry]) => { contactInView = entry.isIntersecting; onScroll(); }, { threshold: 0.15 })
  .observe(document.getElementById('contact'));
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Mobile menu ──
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');
function setMenu(open) {
  mobileMenu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  nav.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
menuBtn.addEventListener('click', () => setMenu(mobileMenu.hidden));
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !mobileMenu.hidden) setMenu(false); });

// ── Hero background video (skipped for reduced motion / data saver: poster stays) ──
const heroVideo = $('#heroVideo');
const heroPause = $('#heroPause');
const saveData = navigator.connection && navigator.connection.saveData;
if (!reduceMotion && !saveData) {
  heroVideo.preload = 'auto';
  heroVideo.play().catch(() => {});
}
heroVideo.addEventListener('playing', () => { heroPause.hidden = false; });
heroPause.addEventListener('click', () => {
  if (heroVideo.paused) { heroVideo.play(); heroPause.classList.remove('paused'); heroPause.setAttribute('aria-label', 'Pause background video'); }
  else { heroVideo.pause(); heroPause.classList.add('paused'); heroPause.setAttribute('aria-label', 'Play background video'); }
});

// ── Scroll reveal ──
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = $$('.reveal', entry.target.parentElement);
    const delay = Math.max(0, siblings.indexOf(entry.target)) * 70;
    setTimeout(() => entry.target.classList.add('in'), Math.min(delay, 350));
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal').forEach(el => revealObserver.observe(el));

// ── Service tiles pre-select the service in the estimate form ──
$$('[data-service]').forEach(tile => {
  tile.addEventListener('click', () => {
    const radio = $$('input[name="Service"]').find(r => r.value === tile.dataset.service);
    if (radio) radio.checked = true;
  });
});

// ── Video reel ──
const reelVideo = $('#reelVideo');
const reelPlay = $('#reelPlay');
const reelPlayer = $('.reel-player');
function playReel() {
  reelPlay.hidden = true;
  reelPlayer.classList.add('playing');
  reelVideo.controls = true;
  reelVideo.play().catch(() => {});
}
reelPlay.addEventListener('click', playReel);
$$('.reel-item').forEach(item => {
  item.addEventListener('click', () => {
    $$('.reel-item').forEach(i => i.classList.toggle('is-active', i === item));
    $('#reelTitle').textContent = item.dataset.title;
    reelVideo.poster = item.dataset.poster;
    reelVideo.src = item.dataset.src;
    playReel();
    if (window.innerWidth <= 1080) reelPlayer.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  });
});

// ── Project carousel: arrows, progress bar, drag to scroll ──
const shots = $('#shots');
const shotsBar = $('#shotsBar');
const prevBtn = $('#workPrev');
const nextBtn = $('#workNext');
function updateShots() {
  const max = shots.scrollWidth - shots.clientWidth;
  const pct = max > 0 ? shots.scrollLeft / max : 0;
  const visible = shots.clientWidth / shots.scrollWidth;
  shotsBar.style.width = `${Math.max(visible, 0.08) * 100 + pct * (1 - visible) * 100}%`;
  prevBtn.disabled = shots.scrollLeft < 8;
  nextBtn.disabled = shots.scrollLeft > max - 8;
}
shots.addEventListener('scroll', updateShots, { passive: true });
window.addEventListener('resize', updateShots);
updateShots();
const step = () => Math.max(shots.clientWidth * 0.7, 300);
prevBtn.addEventListener('click', () => shots.scrollBy({ left: -step(), behavior: 'smooth' }));
nextBtn.addEventListener('click', () => shots.scrollBy({ left: step(), behavior: 'smooth' }));

let drag = null;
shots.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') return;
  drag = { x: e.clientX, left: shots.scrollLeft, moved: false };
});
window.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (Math.abs(dx) > 6 && !drag.moved) { drag.moved = true; shots.classList.add('dragging'); }
  if (drag.moved) shots.scrollLeft = drag.left - dx;
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  const moved = drag.moved;
  drag = null;
  if (moved) {
    shots.classList.remove('dragging');
    // Snap to the nearest card after a drag
    const cards = $$('.shot', shots);
    const edge = parseFloat(getComputedStyle(shots).scrollPaddingLeft) || 0;
    const target = cards.reduce((best, c) => {
      const d = Math.abs(c.offsetLeft - edge - shots.scrollLeft);
      return d < best.d ? { c, d } : best;
    }, { c: null, d: Infinity }).c;
    if (target) shots.scrollTo({ left: target.offsetLeft - edge, behavior: 'smooth' });
  }
});

// ── Photo viewer ──
const viewer = $('#viewer');
const viewerImg = $('#viewerImg');
const shotButtons = $$('.shot');
let viewerIndex = 0;
function showShot(i) {
  viewerIndex = (i + shotButtons.length) % shotButtons.length;
  const btn = shotButtons[viewerIndex];
  viewerImg.src = btn.dataset.full;
  viewerImg.alt = $('img', btn).alt;
  $('#viewerCap').textContent = `${btn.textContent.trim()}  ·  ${viewerIndex + 1} / ${shotButtons.length}`;
}
shotButtons.forEach((btn, i) => btn.addEventListener('click', () => { showShot(i); viewer.showModal(); }));
$('#viewerClose').addEventListener('click', () => viewer.close());
$('#viewerPrev').addEventListener('click', () => showShot(viewerIndex - 1));
$('#viewerNext').addEventListener('click', () => showShot(viewerIndex + 1));
viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showShot(viewerIndex - 1);
  if (e.key === 'ArrowRight') showShot(viewerIndex + 1);
});
viewer.addEventListener('close', () => { viewerImg.src = ''; });

// ── Estimate form: emails the request through FormSubmit ──
const FORM_EMAIL = 'camarilloroofingsolution@yahoo.com';
const form = $('#contactForm');
const formButton = $('#formButton');
const formStatus = $('#formStatus');
const buttonHTML = formButton.innerHTML;

form.addEventListener('submit', async e => {
  e.preventDefault();
  let firstInvalid = null;
  $$('input[required]', form).forEach(input => {
    const bad = !input.checkValidity();
    input.closest('.field').classList.toggle('invalid', bad);
    if (bad && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) {
    formStatus.className = 'form-status err';
    formStatus.textContent = 'Please add your name and a valid email.';
    firstInvalid.focus();
    return;
  }

  const data = new FormData(form);
  data.append('_subject', `New estimate request from ${data.get('Name')}`);
  data.append('_template', 'table');

  formButton.disabled = true;
  formButton.textContent = 'Sending…';
  formStatus.className = 'form-status';
  formStatus.textContent = '';
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${FORM_EMAIL}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data
    });
    const result = await res.json();
    if (!res.ok || String(result.success) !== 'true') throw new Error(result.message);
    formStatus.className = 'form-status ok';
    formStatus.textContent = "✓ Request sent! We'll be in touch within 24 hours.";
    form.reset();
  } catch (err) {
    formStatus.className = 'form-status err';
    formStatus.innerHTML = 'Sorry, that didn\'t go through. Please call or text <a href="tel:+17077167720">(707) 716-7720</a>.';
  } finally {
    formButton.disabled = false;
    formButton.innerHTML = buttonHTML;
  }
});
$$('input[required]', form).forEach(input =>
  input.addEventListener('input', () => input.closest('.field').classList.remove('invalid'))
);
