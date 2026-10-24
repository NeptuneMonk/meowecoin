/* ==========================================================================
   Meowecoin concept site: progressive-enhancement JS (no dependencies)
   ========================================================================== */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  /* ---------- Placeholder social links: don't jump to top ---------- */
  document.querySelectorAll('.socials a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero floating cat/doge background ---------- */
  var bg = document.querySelector('.hero-bg');
  if (bg && !reduceMotion) {
    var glyphs = ['🐾', '🐱', 'Ð', '🪙', '🐾', '✦', '🐕', '😺'];
    var count = window.innerWidth < 600 ? 10 : 18;
    for (var i = 0; i < count; i++) {
      var s = document.createElement('span');
      s.className = 'floater';
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.fontSize = (14 + Math.random() * 22).toFixed(0) + 'px';
      s.style.animationDuration = (14 + Math.random() * 16).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 30).toFixed(1) + 's';
      s.style.setProperty('--o', (0.12 + Math.random() * 0.16).toFixed(2));
      s.style.setProperty('--r', ((Math.random() * 80) - 40).toFixed(0) + 'deg');
      if (s.textContent === 'Ð') { s.style.color = '#D4B235'; s.style.fontWeight = '900'; }
      bg.appendChild(s);
    }
  }

  /* ---------- Footer year ---------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
