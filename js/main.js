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

  /* ---------- White paper / technical modal ---------- */
  var docModal = document.getElementById('doc-modal');
  var docDialog = document.getElementById('doc-dialog');
  if (docModal && docDialog) {
    var docOrder = ['whitepaper', 'technical'];
    var docMeta = {
      whitepaper: {
        tab: document.getElementById('doc-tab-whitepaper'),
        panel: document.getElementById('doc-panel-whitepaper'),
        label: 'wp-title',
        pdf: 'whitepaper/meowecoin-whitepaper.pdf',
        pdfName: 'meowecoin-whitepaper.pdf',
        full: 'whitepaper/#whitepaper'
      },
      technical: {
        tab: document.getElementById('doc-tab-technical'),
        panel: document.getElementById('doc-panel-technical'),
        label: 'tech-title',
        pdf: 'whitepaper/technical-overview.pdf',
        pdfName: 'technical-overview.pdf',
        full: 'whitepaper/#technical'
      }
    };
    var docDownload = document.getElementById('doc-download');
    var docFull = document.getElementById('doc-fullscreen');
    var docOpeners = document.querySelectorAll('[data-doc-open]');
    var docOpen = false;
    var docPushed = false;
    var docUnlockLater = false;
    var docLastFocus = null;
    var docScrollY = 0;

    function docHashName() {
      var h = (location.hash || '').replace(/^#/, '');
      return docMeta[h] ? h : '';
    }

    function setOpeners(expanded) {
      docOpeners.forEach(function (el) {
        el.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      });
    }

    function showDoc(name) {
      var active = docMeta[name] ? name : 'whitepaper';
      docOrder.forEach(function (key) {
        var item = docMeta[key];
        var on = key === active;
        item.tab.setAttribute('aria-selected', on ? 'true' : 'false');
        item.tab.tabIndex = on ? 0 : -1;
        if (on) item.panel.removeAttribute('hidden');
        else item.panel.setAttribute('hidden', '');
      });
      docDialog.setAttribute('aria-labelledby', docMeta[active].label);
      docDownload.href = docMeta[active].pdf;
      docDownload.setAttribute('download', docMeta[active].pdfName);
      docFull.href = docMeta[active].full;
      return active;
    }

    function lockPage() {
      docScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      var gap = window.innerWidth - document.documentElement.clientWidth;
      document.body.classList.add('doc-open');
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + docScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      if (gap > 0) document.body.style.paddingRight = gap + 'px';
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el === docModal) return;
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      });
    }

    function unlockPage() {
      document.body.classList.remove('doc-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      Array.prototype.forEach.call(document.body.children, function (el) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      });
      var root = document.documentElement;
      var prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, docScrollY);
      root.style.scrollBehavior = prev;
    }

    function restoreFocus() {
      var back = docLastFocus;
      docLastFocus = null;
      if (back && typeof back.focus === 'function' && document.contains(back)) {
        try { back.focus({ preventScroll: true }); }
        catch (err) { back.focus(); }
      }
    }

    function closeMobileNav() {
      var menu = document.getElementById('nav-menu');
      var toggle = document.querySelector('.nav-toggle');
      if (menu && menu.classList.contains('open')) {
        menu.classList.remove('open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open menu');
        }
      }
    }

    function focusables() {
      var sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.prototype.filter.call(docDialog.querySelectorAll(sel), function (el) {
        if (el.closest('[hidden]')) return false;
        return el.getClientRects().length > 0;
      });
    }

    function openDoc(name, opts) {
      opts = opts || {};
      if (!docMeta[name]) name = 'whitepaper';
      if (!docOpen) {
        docLastFocus = document.activeElement;
        closeMobileNav();
        lockPage();
        docModal.hidden = false;
        docOpen = true;
        setOpeners(true);
        document.addEventListener('keydown', onDocKey);
      }
      showDoc(name);
      if (!opts.fromHistory) {
        var hash = '#' + name;
        if (location.hash !== hash) {
          if (opts.replace || docHashName()) {
            history.replaceState({ doc: name }, '', hash);
          } else {
            history.pushState({ doc: name }, '', hash);
            docPushed = true;
          }
        }
      }
      if (opts.focusDialog) {
        try { docDialog.focus({ preventScroll: true }); }
        catch (err) { docDialog.focus(); }
      }
    }

    function finishClose() {
      docModal.hidden = true;
      unlockPage();
      setOpeners(false);
      restoreFocus();
    }

    function closeDoc(opts) {
      opts = opts || {};
      if (!docOpen) return;
      var pushed = docPushed;
      docOpen = false;
      docPushed = false;
      document.removeEventListener('keydown', onDocKey);
      if (!opts.fromHistory && pushed) {
        docUnlockLater = true;
        history.back();
        window.setTimeout(function () {
          if (!docUnlockLater) return;
          docUnlockLater = false;
          finishClose();
        }, 350);
        return;
      }
      if (!opts.fromHistory && docHashName()) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      finishClose();
    }

    function onDocKey(e) {
      if (!docOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDoc();
        return;
      }
      var onTab = document.activeElement && document.activeElement.getAttribute('role') === 'tab';
      if (onTab && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End')) {
        e.preventDefault();
        var current = document.activeElement.id === 'doc-tab-technical' ? 1 : 0;
        var next = current;
        if (e.key === 'ArrowRight') next = (current + 1) % docOrder.length;
        else if (e.key === 'ArrowLeft') next = (current + docOrder.length - 1) % docOrder.length;
        else if (e.key === 'Home') next = 0;
        else next = docOrder.length - 1;
        openDoc(docOrder[next], { replace: true });
        docMeta[docOrder[next]].tab.focus({ preventScroll: true });
        return;
      }
      if (e.key !== 'Tab') return;
      var items = focusables();
      if (!items.length) {
        e.preventDefault();
        docDialog.focus({ preventScroll: true });
        return;
      }
      var first = items[0];
      var last = items[items.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && (active === first || !docDialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('focusin', function (e) {
      if (!docOpen) return;
      if (docDialog.contains(e.target)) return;
      var items = focusables();
      (items[0] || docDialog).focus({ preventScroll: true });
    });

    docModal.addEventListener('click', function (e) {
      if (e.target.closest('[data-doc-dismiss]')) closeDoc();
    });

    var backdrop = docModal.querySelector('.doc-backdrop');
    if (backdrop) {
      backdrop.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
      backdrop.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    }

    docOrder.forEach(function (name) {
      docMeta[name].tab.addEventListener('click', function () {
        openDoc(name, { replace: true });
      });
    });

    docOpeners.forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDoc(el.getAttribute('data-doc-open') || 'whitepaper', { focusDialog: true });
      });
    });

    function onHistory() {
      if (docUnlockLater) {
        docUnlockLater = false;
        finishClose();
        return;
      }
      var name = docHashName();
      if (name) openDoc(name, { fromHistory: true, focusDialog: !docOpen });
      else if (docOpen) closeDoc({ fromHistory: true });
    }
    window.addEventListener('hashchange', onHistory);
    window.addEventListener('popstate', onHistory);

    if (docHashName()) openDoc(docHashName(), { fromHistory: true, focusDialog: true });
  }
})();
