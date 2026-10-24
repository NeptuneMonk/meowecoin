/* ==========================================================================
   Meowecoin concept site: progressive-enhancement JS (no dependencies)
   ========================================================================== */
/* Links and the mint live here so they can be changed in one place. */
var MEOWE = {
  symbol: 'MEOWE',
  mint: 'FiYTnrwt6CPmWQyWY4evBLK5Lu21jJSRHPYtX4Aepump',
  buyUrl: 'https://pump.fun/coin/FiYTnrwt6CPmWQyWY4evBLK5Lu21jJSRHPYtX4Aepump',
  chartUrl: 'https://dexscreener.com/solana/5iq5n8sir2xkpgdjycem5vxw6hvquf6rkvyyemepls6u'
};

(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dexApi = 'https://api.dexscreener.com/latest/dex/tokens/' + MEOWE.mint;

  /* ---------- Buy, chart, and contract address from MEOWE ---------- */
  document.querySelectorAll('[data-meowe-link="buy"]').forEach(function (a) { a.href = MEOWE.buyUrl; });
  document.querySelectorAll('[data-meowe-link="chart"]').forEach(function (a) { a.href = MEOWE.chartUrl; });
  document.querySelectorAll('[data-meowe-text="symbol"]').forEach(function (el) { el.textContent = MEOWE.symbol; });
  var caText = document.getElementById('ca-text');
  if (caText) caText.textContent = MEOWE.mint;

  var copyBtn = document.getElementById('ca-copy');
  if (copyBtn && MEOWE.mint) {
    copyBtn.addEventListener('click', function () {
      copyText(MEOWE.mint).then(function () {
        copyBtn.textContent = 'Copied';
        copyBtn.classList.add('is-copied');
        window.setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('is-copied');
        }, 1600);
      }).catch(function () {
        copyBtn.textContent = 'Copy failed';
        window.setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1600);
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) resolve(); else reject(new Error('copy'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ---------- Live DexScreener stats ---------- */
  var dash = '\u2014';
  var statNodes = {
    mcap: document.querySelectorAll('[data-stat="mcap"]'),
    price: document.querySelectorAll('[data-stat="price"]'),
    change: document.querySelectorAll('[data-stat="change"]'),
    vol: document.querySelectorAll('[data-stat="vol"]')
  };
  var hasMarket = false;
  var marketReq = 0;

  function num(v) {
    var n = typeof v === 'number' ? v : parseFloat(v);
    return isFinite(n) ? n : null;
  }

  function formatCompact(n) {
    if (n == null) return dash;
    var sign = n < 0 ? '-' : '';
    var abs = Math.abs(n);
    var tiers = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var i = 0; i < tiers.length; i++) {
      if (abs >= tiers[i][0]) {
        var v = abs / tiers[i][0];
        var s = v.toFixed(v >= 100 ? 0 : 1).replace(/\.0$/, '');
        return sign + '$' + s + tiers[i][1];
      }
    }
    return sign + '$' + (abs >= 100 ? abs.toFixed(0) : abs.toFixed(2));
  }

  function formatPrice(n) {
    if (n == null || n < 0) return dash;
    if (n === 0) return '$0';
    if (n >= 1) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 0.01) return '$' + n.toFixed(4);
    var raw = n.toFixed(12);
    var match = raw.match(/^0\.(0*)(\d+)/);
    if (!match) return dash;
    var digits = match[2].slice(0, 4).replace(/0+$/, '');
    return '$0.' + match[1] + (digits || '0');
  }

  function setStat(name, text) {
    statNodes[name].forEach(function (el) { el.textContent = text; });
  }

  function setChange(n) {
    statNodes.change.forEach(function (el) {
      el.classList.remove('mkt-up', 'mkt-down');
      if (n == null) {
        el.textContent = dash;
        return;
      }
      var sign = n > 0 ? '+' : '';
      el.textContent = sign + n.toFixed(1) + '%';
      if (n > 0) el.classList.add('mkt-up');
      else if (n < 0) el.classList.add('mkt-down');
    });
  }

  function bestPair(pairs) {
    var best = null;
    var bestLiq = -1;
    (pairs || []).forEach(function (p) {
      var liq = num(p && p.liquidity && p.liquidity.usd);
      if (liq == null) liq = -1;
      if (liq > bestLiq) {
        best = p;
        bestLiq = liq;
      }
    });
    return bestLiq > 0 ? best : null;
  }

  function showMarket(pair) {
    setStat('mcap', formatCompact(num(pair.marketCap)));
    setStat('price', formatPrice(num(pair.priceUsd)));
    setChange(num(pair.priceChange && pair.priceChange.h24));
    setStat('vol', formatCompact(num(pair.volume && pair.volume.h24)));
  }

  function loadMarket() {
    var id = ++marketReq;
    fetch(dexApi, { headers: { accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('status');
        return res.json();
      })
      .then(function (data) {
        if (id !== marketReq) return;
        var pair = bestPair(data && data.pairs);
        if (!pair) return;
        showMarket(pair);
        hasMarket = true;
      })
      .catch(function () {
        if (id !== marketReq || hasMarket) return;
        setStat('mcap', dash);
        setStat('price', dash);
        setChange(null);
        setStat('vol', dash);
      });
  }

  if (statNodes.mcap.length) {
    loadMarket();
    window.setInterval(function () {
      if (!document.hidden) loadMarket();
    }, 60000);
  }

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
