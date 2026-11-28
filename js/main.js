(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.matchMedia('(min-width: 901px)').matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  // maps t from [inMin,inMax] to [0,1], clamped
  const progressBetween = (t, inMin, inMax) => clamp((t - inMin) / (inMax - inMin), 0, 1);

  /* ---------- nav scroll state + burger ---------- */
  const nav = document.getElementById('nav');
  const navBurger = document.getElementById('navBurger');
  const navLinks = document.getElementById('navLinks');

  navBurger?.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
  });
  navLinks?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navLinks.classList.remove('is-open'));
  });

  /* ---------- progress rail + nav bg ---------- */
  const progressRail = document.getElementById('progressRail');
  function updateGlobalScrollUI() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressRail.style.width = pct + '%';
    nav.classList.toggle('is-scrolled', scrollTop > 10);
  }

  /* ---------- HERO / ABOUT pin animation ---------- */
  const heroPin = document.getElementById('hero');
  const headlineA = document.getElementById('headlineA');
  const headlineB = document.getElementById('headlineB');
  const heroCta = document.getElementById('heroCta');
  const heroPhoto = document.getElementById('heroPhoto');
  const heroMark = document.getElementById('heroMark');
  const heroScrim = document.getElementById('heroScrim');

  function updateHero() {
    if (!heroPin) return;
    if (!isDesktop() || reduceMotion) {
      headlineA.style.transform = 'none';
      headlineB.style.transform = 'translateX(-100%)';
      heroCta.style.opacity = 1;
      heroCta.style.transform = 'none';
      heroPhoto.style.transform = 'none';
      if (heroMark) heroMark.style.transform = 'none';
      if (heroScrim) heroScrim.style.opacity = 0;
      return;
    }
    const rect = heroPin.getBoundingClientRect();
    const total = rect.height - window.innerHeight; // scrollable runway inside pin
    if (total <= 0) return;
    const t = clamp(-rect.top / total, 0, 1);

    // CTA fades out early, before the slide starts
    const ctaOut = progressBetween(t, 0.04, 0.16);
    heroCta.style.opacity = String(1 - ctaOut);
    heroCta.style.transform = `translate(-50%,${ctaOut * 14}px)`;

    // headline swap: both slides move together, A exits left, B enters from right
    const slide = progressBetween(t, 0.18, 0.5);
    const slidePct = -slide * 100;
    headlineA.style.transform = `translateX(${slidePct}%)`;
    headlineB.style.transform = `translateX(${slidePct}%)`;

    // photo: continuous rightward pan + zoom for the whole pinned duration
    heroPhoto.style.transform =
      `translate(-50%,-50%) translateX(${lerp(0, 9, t)}vw) scale(${lerp(1, 1.4, t)})`;

    // logo mark drifts left across the stage as the headline swaps
    heroMark.style.transform = `translateX(${lerp(0, -160, slide)}px)`;
    heroMark.style.opacity = String(0.85 - progressBetween(t, 0.65, 0.9) * 0.85);

    // fade the whole hero to black right before it releases into the next section
    if (heroScrim) heroScrim.style.opacity = String(progressBetween(t, 0.86, 1));
  }

  /* ---------- WORK gallery horizontal scroll-jack ---------- */
  const workPin = document.getElementById('work');
  const workTrack = document.getElementById('workTrack');
  const workProgressBar = document.getElementById('workProgressBar');

  function updateWork() {
    if (!workPin || !workTrack) return;
    if (!isDesktop() || reduceMotion) {
      workTrack.style.transform = 'none';
      if (workProgressBar) workProgressBar.style.width = '0%';
      return;
    }
    const rect = workPin.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return;
    const t = clamp(-rect.top / total, 0, 1);

    const maxTranslate = Math.max(0, workTrack.scrollWidth - window.innerWidth);
    workTrack.style.transform = `translateX(${-maxTranslate * t}px)`;
    if (workProgressBar) workProgressBar.style.width = (t * 100) + '%';
  }

  /* ---------- nav active section ---------- */
  const sectionIds = ['highlights', 'work', 'experience', 'contact'];
  const navAnchors = {};
  document.querySelectorAll('.nav__links a').forEach(a => {
    navAnchors[a.dataset.nav] = a;
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        Object.values(navAnchors).forEach(a => a.classList.remove('active'));
        const key = entry.target.id === 'hero' ? 'about' : entry.target.id;
        navAnchors[key]?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  [heroPin, ...sectionIds.map(id => document.getElementById(id))]
    .filter(Boolean)
    .forEach(el => sectionObserver.observe(el));

  /* ---------- reveal-on-scroll (timeline, cert row, contact) ---------- */
  const revealTargets = document.querySelectorAll('.timeline__item, .cert-row, .contact__copy, .contact__doc');
  if (reduceMotion) {
    revealTargets.forEach(el => el.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    revealTargets.forEach(el => revealObserver.observe(el));
  }

  /* ---------- rAF scroll loop ---------- */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateGlobalScrollUI();
        updateHero();
        updateWork();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
