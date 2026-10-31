# Meowecoin (meoweco.in)

*Decentralized content monetization, powered by $MEOWE.*

Meowecoin (MEOWE) is a community-run token on Solana, paired with wrapped DOGE. The community is building **DustForge**, where you forge content on Dogecoin. MEOWE is its first and home token. DustForge is a place to create, own and sell tokenized content. Profiles, store items, Spaces and channels are recorded on Dogecoin mainnet with P2FK, and every action is paid in MEOWE.

This repo is the **meoweco.in website**: plain HTML and CSS with a little inline JavaScript. There is no build step for the site, no backend, no wallet connection and no live transactions. DustForge itself is a separate app; the site links to its preview at https://neptunemonk.github.io/meowcoin-portal/.

## Structure

```
index.html            homepage: hero, Space and store preview, showcase, "Mint it / Own it / Grow it", links
                      (the small mobile-menu script is inline at the bottom)
css/home.css          homepage styles and theme variables
listings/index.html   where MEOWE is listed and tracked (Blockspot, Pump.fun, DexScreener, GeckoTerminal, Solscan)
css/styles.css        styles for listings/ and for the whitepaper/ reader
js/main.js            used by listings/ only (mobile nav, copy buttons, link refresh)
assets/img/           coin logo, mascot, cat tiles, on-chain images, og-image.jpg
assets/showcase/      showcase images used on the homepage
whitepaper/           white paper + technical overview (Markdown sources, PDFs, chart PNGs, the reader page)
favicon.ico, favicon-32x32.png, apple-touch-icon.png, site.webmanifest
CNAME                 meoweco.in (used by GitHub Pages)
robots.txt, sitemap.xml
```

The on-chain images (`onchain-*.jpg/.webp`) were decoded from Dogecoin P2FK transactions using the p2fk.io API.

## Local preview

```bash
cd meowecoin
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

All three hosts serve the folder as-is. There is **no build command**, and the publish/output directory is the repo root (`/`).

### GitHub Pages
1. Push this folder's contents to the root of a repo.
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

- Homepage theme colours are the CSS variables at the top of `css/home.css`. The listings page and the document reader use `css/styles.css`.
- The Solana mint, Pump.fun buy URL and DexScreener chart URL are written directly in `index.html`, so crawlers can read them without JavaScript. On the listings page, the same values also live in the `MEOWE` constant at the top of `js/main.js`.
- The footer links to X (`https://x.com/1742Meowe`) and the Meowecoin OG Telegram group (`https://t.me/meowecoinOG`).
- **Read the white paper** links open the full-page reader at `whitepaper/`. `whitepaper/#whitepaper` and `whitepaper/#technical` open the two tabs (handy for Telegram and X). The homepage also links straight to sections, for example `whitepaper/#wh-7-tokenomics-and-supply` and `whitepaper/#wh-12-roadmap`, so keep those two headings word for word. The reader bar has Download PDF and a link back to the site.
- Document wording lives in `whitepaper/*.md`. Regenerate the reader page with:

  ```bash
  cd whitepaper && npm install && node render.mjs
  ```

  This writes `whitepaper/index.html` and checks that every homepage link into `whitepaper/#...` still points at a real section. Draft notes written as `<!-- [CONFIRM] ... -->` are left out of the page and printed as warnings; run `node render.mjs --strict` before publishing to make them an error. Pages serves the committed HTML; it does not run this script. The PDFs are not rebuilt by it. The technical overview's Mermaid block is shown as `assets/action-flow.png`.

## Credits and facts

- **P2FK (Pay to Future Key)** and **Sup!?** were created by embii: https://github.com/embiimob/sup
- **p2fk.io / bitFossil**, the open-source API for reading P2FK data: https://github.com/embiimob/p2fk.io and https://p2fk.io
- Meowecoin did not create P2FK. DustForge uses it to record tokenized content on Dogecoin.

**Disclaimer:** not financial advice and not an offer. DustForge is in development, and holder rewards are planned and not confirmed live. No value, returns or dates are promised.
