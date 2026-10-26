// Rebuild the static document HTML from the Markdown sources.
// GitHub Pages does not run this. The committed HTML is what the site serves.
//
//   cd whitepaper && npm install && node render.mjs
//
// Wording comes only from the .md files. The Mermaid sequence diagram in the
// technical overview is omitted here because the matching PNG is the next
// figure (phones do not run Mermaid). Approximation tildes stay tildes.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { marked } = require('marked');

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const indexPath = path.join(root, 'index.html');

marked.use({
  gfm: true,
  breaks: false,
  tokenizer: {
    // GFM treats a single ~ as strikethrough. These documents use ~ for "about".
    // Return undefined (not false): false tells marked to fall through to the default.
    del() {
      return undefined;
    }
  }
});

const DOCS = [
  {
    key: 'whitepaper',
    file: 'meowecoin-whitepaper.md',
    h1: 'wp-title',
    images: 9,
    sentinels: [
      'Memes are forever on Doge.',
      'MEOWE is live on Solana.',
      'reaction emoji in the DOGEos Discord server',
      '~960.7M MEOWE (~39.3M already burned)',
      'tokens burned per action = 30% × (fee in dollars ÷ MEOWE price)',
      "supply after t years = today's supply × (1 − 0.14)^t",
      'Not financial advice.',
      'Do your own research (DYOR)',
      'Only use money you can afford to lose. By interacting with MEOWE you accept these risks.',
      'FiYTnrwt6CPmWQyWY4evBLK5Lu21jJSRHPYtX4Aepump',
      '5iQ5n8Sir2xKpGDJYcem5VxW6HVqUF6rkVyYeMepLs6u'
    ]
  },
  {
    key: 'technical',
    file: 'technical-overview.md',
    h1: 'tech-title',
    images: 4,
    sentinels: [
      'Meowecoin (MEOWE): Technical Overview',
      'the MEOWE Portal is in development',
      '~960.7M now (~39.3M burned)',
      '<action-id>',
      'S_t = S_0 × (1 − k)^t',
      'Not financial advice.',
      'wDOGE carries smart-contract and bridge risk',
      '5iQ5n8Sir2xKpGDJYcem5VxW6HVqUF6rkVyYeMepLs6u',
      'FiYTnrwt6CPmWQyWY4evBLK5Lu21jJSRHPYtX4Aepump',
      'Life of one action (planned flow)'
    ]
  }
];

function pngSize(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function escText(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
}

function enhance(html, doc) {
  const seen = new Map();
  let firstH1 = true;
  html = html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (m, level, inner) => {
    let id;
    if (level === '1' && firstH1) {
      firstH1 = false;
      id = doc.h1;
    } else {
      const base = doc.key.slice(0, 2) + '-' + (slug(inner) || 'section');
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      id = n === 1 ? base : base + '-' + n;
    }
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  html = html.replace(/<img src="([^"]+)" alt="([^"]*)">/g, (m, src, alt) => figure(src, alt));
  html = html.replace(/<p>\s*(<figure class="doc-fig">[\s\S]*?<\/figure>)\s*<\/p>/g, '$1');

  html = html.replace(/<table\b[^>]*>[\s\S]*?<\/table>/g, (table) => {
    return `<div class="doc-table" tabindex="0" role="region" aria-label="Scrollable table">\n${table}\n</div>`;
  });

  return html.trim() + '\n';
}

function figure(src, alt) {
  const rel = src.startsWith('assets/') ? src : null;
  if (!rel) throw new Error('Unexpected image path: ' + src);
  const file = path.join(here, rel);
  if (!fs.existsSync(file)) throw new Error('Missing image: ' + rel);
  const size = pngSize(file);
  const dim = size ? ` width="${size.w}" height="${size.h}"` : '';
  const url = '/whitepaper/' + rel;
  const caption = escText(alt);
  return `<figure class="doc-fig"><img src="${url}" alt="${alt}"${dim} loading="lazy" decoding="async"><figcaption aria-hidden="true">${caption}</figcaption></figure>`;
}

function visibleText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderDoc(doc) {
  let md = fs.readFileSync(path.join(here, doc.file), 'utf8');
  if (doc.key === 'technical') {
    const stripped = md.replace(/```mermaid[\s\S]*?```\n?/g, '');
    if (stripped === md) throw new Error('Expected a mermaid block to swap for the action-flow figure');
    if (/```mermaid/.test(stripped)) throw new Error('More than one mermaid block');
    md = stripped;
  }
  const html = enhance(marked.parse(md), doc);
  if (/<del[\s>]/.test(html)) throw new Error(doc.key + ': tilde was rendered as strikethrough');
  if (/sequenceDiagram/.test(html)) throw new Error(doc.key + ': mermaid source leaked into HTML');
  const imgs = (html.match(/<img\b/g) || []).length;
  if (imgs !== doc.images) throw new Error(doc.key + ': expected ' + doc.images + ' images, got ' + imgs);
  const text = visibleText(html);
  doc.sentinels.forEach((s) => {
    if (!text.includes(s)) throw new Error(doc.key + ': missing wording: ' + s);
  });
  return `<article class="doc" data-doc="${doc.key}">\n${html}</article>`;
}

function splice(file, key, article) {
  const src = fs.readFileSync(file, 'utf8');
  const start = `<!-- DOC:${key}:start -->`;
  const end = `<!-- DOC:${key}:end -->`;
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(src)) throw new Error('Missing ' + start + ' in ' + file);
  const next = src.replace(re, `${start}\n${article}\n${end}`);
  if (next !== src) fs.writeFileSync(file, next);
}

function readerPage(articles) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Meowecoin white paper</title>
  <meta name="description" content="Meowecoin (MEOWE) white paper and technical overview. Community edition, October 2026.">
  <meta name="theme-color" content="#0f0d08">
  <link rel="canonical" href="https://meoweco.in/whitepaper/">
  <link rel="icon" href="../favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
  <link rel="apple-touch-icon" href="../apple-touch-icon.png">
  <link rel="stylesheet" href="../css/styles.css">
  <script>
    if (location.hash === '#technical') document.documentElement.classList.add('doc-tech');
  </script>
</head>
<body class="doc-page">
  <a class="skip-link" href="#doc-reader">Skip to document</a>
  <div class="doc-shell">
    <header class="doc-toolbar">
      <a class="doc-x doc-back" id="doc-back" href="../#whitepaper">← Site</a>
      <p class="doc-kicker">
        <img src="../assets/img/meowecoin-coin-96.png" width="28" height="28" alt="">
        <span>Meowecoin documents</span>
      </p>
      <div class="doc-tabs" role="tablist" aria-label="Documents">
        <button type="button" class="doc-tab" id="reader-tab-whitepaper" role="tab" aria-selected="true" aria-controls="reader-whitepaper" tabindex="0">White Paper</button>
        <button type="button" class="doc-tab" id="reader-tab-technical" role="tab" aria-selected="false" aria-controls="reader-technical" tabindex="-1">Technical</button>
      </div>
      <div class="doc-toolbar-actions">
        <a class="doc-action" id="doc-download" href="meowecoin-whitepaper.pdf" download="meowecoin-whitepaper.pdf">Download PDF</a>
      </div>
    </header>
    <div class="doc-reader" id="doc-reader">
      <div class="doc-scroll" id="reader-whitepaper" role="tabpanel" aria-labelledby="reader-tab-whitepaper" tabindex="0">
${articles.whitepaper}
      </div>
      <div class="doc-scroll" id="reader-technical" role="tabpanel" aria-labelledby="reader-tab-technical" tabindex="0">
${articles.technical}
      </div>
    </div>
  </div>
  <script>
    (function () {
      var order = ['whitepaper', 'technical'];
      var pdfs = {
        whitepaper: 'meowecoin-whitepaper.pdf',
        technical: 'technical-overview.pdf'
      };
      var titles = {
        whitepaper: 'Meowecoin white paper',
        technical: 'Meowecoin technical overview'
      };
      function nameFromHash() {
        return location.hash === '#technical' ? 'technical' : 'whitepaper';
      }
      function show(name) {
        var tech = name === 'technical';
        document.documentElement.classList.toggle('doc-tech', tech);
        order.forEach(function (key) {
          var on = key === name;
          var tab = document.getElementById('reader-tab-' + key);
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
          tab.tabIndex = on ? 0 : -1;
        });
        var file = pdfs[name];
        var dl = document.getElementById('doc-download');
        dl.href = file;
        dl.setAttribute('download', file);
        document.getElementById('doc-back').href = '../#' + name;
        document.title = titles[name];
      }
      function select(name, focusTab) {
        if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
        show(name);
        if (focusTab) document.getElementById('reader-tab-' + name).focus();
      }
      order.forEach(function (key) {
        document.getElementById('reader-tab-' + key).addEventListener('click', function () {
          select(key, false);
        });
      });
      document.querySelector('.doc-tabs').addEventListener('keydown', function (e) {
        if (!document.activeElement || document.activeElement.getAttribute('role') !== 'tab') return;
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) === -1) return;
        e.preventDefault();
        var current = document.activeElement.id === 'reader-tab-technical' ? 1 : 0;
        var next = current;
        if (e.key === 'ArrowRight') next = (current + 1) % order.length;
        else if (e.key === 'ArrowLeft') next = (current - 1 + order.length) % order.length;
        else if (e.key === 'Home') next = 0;
        else next = order.length - 1;
        select(order[next], true);
      });
      window.addEventListener('hashchange', function () { show(nameFromHash()); });
      show(nameFromHash());
    })();
  </script>
</body>
</html>
`;
}

const articles = {};
DOCS.forEach((doc) => {
  articles[doc.key] = renderDoc(doc);
  splice(indexPath, doc.key, articles[doc.key]);
});

const reader = path.join(here, 'index.html');
fs.writeFileSync(reader, readerPage(articles));
console.log('Rendered white paper and technical overview into index.html and whitepaper/index.html');
