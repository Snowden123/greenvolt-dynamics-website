const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const header = document.getElementById('siteHeader');
const progress = document.getElementById('progress');

// hero headline: split into words for staggered rise
(function(){
  const h = document.getElementById('heroTitle'); if (!h) return;
  let i = 0;
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3){
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t.trim()){ frag.appendChild(document.createTextNode(t)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = t; s.style.animationDelay = (0.2 + i++ * 0.07) + 's';
          w.appendChild(s); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(h);
})();

// reveal
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold:.15 });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
// clip-path hidden images never count as intersecting, so watch their parent instead
const ioImg = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ e.target.querySelectorAll(':scope > [data-reveal-img]').forEach(el => el.classList.add('is-visible')); ioImg.unobserve(e.target); }
}), { threshold:.2 });
new Set([...document.querySelectorAll('[data-reveal-img]')].map(el => el.parentElement)).forEach(p => ioImg.observe(p));

// count-up
const co = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; co.unobserve(e.target);
  const el = e.target, t = +el.dataset.countTo, d = 1200, s = performance.now();
  if (reduce){ el.textContent = t; return; }
  const tick = now => { const p = Math.min((now-s)/d,1); el.textContent = Math.round(t*(1-Math.pow(1-p,3))); if (p<1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}), { threshold:.5 });
document.querySelectorAll('[data-count-to]').forEach(el => co.observe(el));

// nav highlight
const links = [...document.querySelectorAll('.pill-nav a')];
const hashLinks = links.filter(a => a.getAttribute('href').startsWith('#') && a.getAttribute('href').length > 1);
const sections = hashLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const so = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting){ hashLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }
}), { rootMargin:'-45% 0px -50% 0px' });
sections.forEach(s => so.observe(s));

// parallax + progress (one rAF loop)
const px = [...document.querySelectorAll('[data-parallax]')];
const pbg = [...document.querySelectorAll('[data-parallax-bg]')];
const pimg = [...document.querySelectorAll('[data-parallax-img]')];
let ticking = false;
function frame(){
  const vh = innerHeight, y = scrollY;
  if (header) header.classList.toggle('scrolled', y > 40);
  const max = document.documentElement.scrollHeight - vh;
  if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
  if (!reduce){
    const move = (el, k) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = (r.top + r.height/2) - vh/2;
      el.style.transform = 'translate3d(0,' + (-c * k).toFixed(1) + 'px,0)';
    };
    px.forEach(el => move(el, +el.dataset.parallax));
    pbg.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = (r.top + r.height/2) - vh/2;
      const lim = Math.max(0,(el.offsetHeight - el.parentElement.offsetHeight)/2); el.style.transform = 'translate3d(0,' + Math.max(-lim,Math.min(lim,-c * +el.dataset.parallaxBg)).toFixed(1) + 'px,0)';
    });
    pimg.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const c = (r.top + r.height/2) - vh/2;
      const lim = Math.max(0,(el.offsetHeight - el.parentElement.offsetHeight)/2); el.style.transform = 'translate3d(0,' + Math.max(-lim,Math.min(lim,-c * +el.dataset.parallaxImg)).toFixed(1) + 'px,0)';
    });
  }
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(frame); } }, { passive:true });
addEventListener('resize', frame);
frame();

// card tilt
if (!reduce && matchMedia('(hover:hover)').matches){
  document.querySelectorAll('[data-tilt]').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width - .5, y = (e.clientY - r.top)/r.height - .5;
      c.style.transform = 'perspective(800px) rotateY(' + (x*7).toFixed(2) + 'deg) rotateX(' + (-y*7).toFixed(2) + 'deg) translateY(-4px)';
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

// mobile menu
(function(){
  const b = document.getElementById('menuBtn'), n = document.getElementById('pillNav');
  if (!b || !n) return;
  const set = open => { n.classList.toggle('open', open); b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); b.classList.toggle('x', open); };
  b.addEventListener('click', () => set(!n.classList.contains('open')));
  n.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  addEventListener('resize', () => { if (innerWidth > 900) set(false); });
})();
