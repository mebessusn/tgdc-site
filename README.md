# Top Game Development Company — Astro site

The studio site rebuilt in [Astro](https://astro.build): same green-terminal
look, but **server-rendered** (great for SEO + social cards) with a
**Markdown devlog** and reusable components.

> ⚠️ **Not yet run/verified.** This project was scaffolded in an environment
> without Node.js, so it has **not** been built or previewed. Treat it as a
> solid first draft — run the steps below locally and expect to iron out a
> small issue or two on first `npm run dev`.

## Run it

Requires **Node 18+**.

```sh
cd website-astro
npm install
npm run dev        # http://localhost:4321
```

Build for production:

```sh
npm run build      # outputs static HTML to ./dist
npm run preview    # preview the build
```

## Project layout

```
src/
  data/site.js              # all site copy + config (edit text here)
  content/config.ts         # devlog collection schema
  content/devlog/*.md       # devlog posts (add .md files here)
  components/Seo.astro       # <head> meta / Open Graph / Twitter cards
  components/Header.astro    # nav
  components/Footer.astro
  layouts/Base.astro         # page shell; injects data for the client script
  pages/index.astro          # homepage (all sections, pre-rendered)
  pages/devlog/index.astro   # devlog list
  pages/devlog/[...slug].astro  # individual post
  scripts/app.js             # interactive terminal + forms + nav (client-side)
  styles/global.css          # the green-terminal styles (shared with static site)
```

## Configure before launch

- **`astro.config.mjs`** → set `site` to your real domain (used for canonical
  URLs + absolute OG image links).
- **`src/data/site.js` → `config`**: set `discordUrl`, and the
  `contactEndpoint` / `newsletterEndpoint` (Formspree / Buttondown / Mailchimp).
  Leave endpoints `""` for demo mode (forms validate + confirm but don't send).
- **`public/og-image.png`** — add a 1200×630 social-share image.
- **Write devlog posts** by dropping Markdown files into `src/content/devlog/`
  with frontmatter: `title`, `date`, `summary`, optional `tag`.

## Notes

- The homepage content lives in `src/data/site.js` and is rendered at build
  time, so search engines and link-preview bots see real HTML (the main reason
  to use Astro over the old JS-rendered static site).
- The interactive terminal and forms are the only client-side JS
  (`src/scripts/app.js`); everything else is static.
- This replaces the old JS-hydrated `website/` folder once you're happy with it.
