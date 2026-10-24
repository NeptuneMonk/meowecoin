# Meowecoin: DOGE Chain Injection Concept (meoweco.in)

Meowecoin is solana based DOGE paired and builds a portal to DOGE native chain for a DOGE universe built with P2FK injections.

This is a single-page static **concept showcase** for Meowecoin. It is plain HTML, CSS and JS: no build step, no backend, no wallet connection and no live transactions.

## Structure

```
index.html            all sections, with <!-- SECTION --> comments
css/styles.css        theme variables (gold #d4b235), layout, animations, breakpoints
js/main.js            mobile nav, scroll reveal, floating hero glyphs, footer year
assets/img/           coin logo, mascot, pop-art cat tiles, on-chain images, og-image.jpg
favicon.ico, favicon-32x32.png, apple-touch-icon.png, site.webmanifest
CNAME                 meoweco.in (used by GitHub Pages)
robots.txt, sitemap.xml
```

The on-chain images (`onchain-*.jpg/.webp`) were decoded from Dogecoin P2FK transactions using the p2fk.io API.

## Local preview

```bash
cd meowecoin-site
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

All three hosts serve the folder as-is. There is **no build command**, and the publish/output directory is the repo root (`/`).

### GitHub Pages
1. Push this folder's contents to the root of a repo (for example `meowecoin-site`).
2. Go to Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. The `CNAME` file already sets the custom domain to `meoweco.in`. Confirm it under Settings → Pages → Custom domain, then tick **Enforce HTTPS** once the certificate is issued.
4. At your registrar, add these DNS records for the apex `meoweco.in`:
   - `A` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` (optional) → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME www` → `<your-user>.github.io`

### Netlify
1. Either drag the folder onto app.netlify.com/drop, or use *Add new site → Import from Git*.
2. Leave the build command empty and set the publish directory to `/` (or `.`).
3. Go to Domain management → Add a domain → `meoweco.in`. Then either switch the domain's nameservers to Netlify DNS, or point an `ALIAS/ANAME` (apex) or the A record `75.2.60.5` and `CNAME www → <site>.netlify.app` at it.
4. Netlify ignores the `CNAME` file, so it is harmless to leave it in.

### Cloudflare Pages
1. In Workers & Pages → Create → Pages, connect the Git repo or choose *Upload assets* and drop in the folder.
2. Framework preset: *None*. Leave the build command empty and set the output directory to `/`.
3. Go to Custom domains → `meoweco.in`. If the domain's DNS is already on Cloudflare, the record is created for you. Otherwise, add `CNAME meoweco.in → <project>.pages.dev` (apex CNAME flattening requires Cloudflare DNS).

Always check the current DNS values in each host's docs before you go live.

## Editing

- Theme colours are the CSS variables at the top of `css/styles.css`.
- Sections in `index.html` are wrapped in clearly commented blocks. To add one, copy a `<section class="section">` block and add a nav link.
- The social icons in the footer are placeholders (`href="#"`). Replace them with real URLs.
- The "Read Whitepaper (Soon)" and showcase buttons are intentionally disabled.

## Credits and facts

- **P2FK (Pay-to-Future-Key)** and **Sup!?** were created by embii: https://github.com/embiimob/sup
- **p2fk.io / bitFossil**, the open-source API for reading P2FK data: https://github.com/embiimob/p2fk.io and https://p2fk.io
- Meowecoin did not create P2FK. This site describes a proposed use of it.

**Disclaimer:** this is a concept only. It is not financial advice and not an offer. Tokenomics and airdrops are planned or undecided, and no value or dates are promised.
