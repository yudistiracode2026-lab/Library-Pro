# Sandbox Indonesia · Design System

A working design system for **PT Sandbox Indonesia Juara** and its flagship product **Desa Pintar** — a smart-village / open-data SaaS platform helping Indonesian village governments digitize administration, finance, mapping, and citizen services.

> "Inovasi Desa, Membangun Indonesia" — *Village Innovation, Building Indonesia.*

---

## What this is for

This folder is a self-contained brand kit. Drop a designer (human or agent) in here and they should be able to produce on-brand artifacts — slides, mocks, marketing pages, in-product UI — without having to invent visual decisions.

Two audiences are supported:

1. **Design agents** working on Desa Pintar / Sandbox properties → use the [`SKILL.md`](./SKILL.md) entry point.
2. **Developers** building real product surfaces → import [`colors_and_type.css`](./colors_and_type.css), grab components from [`ui_kits/`](./ui_kits/), copy logos from [`assets/`](./assets/).

---

## Sources of truth

| Source | What it gave us |
|---|---|
| `uploads/logo.svg` (provided) | The Desa Pintar wordmark + leaf-D icon. The SVG was missing its CSS class→fill map (rendered all-black); we restored the colors using the gradient defs that *were* inside the file. |
| `https://sandbox.co.id/` | Parent-company positioning, Bahasa Indonesia copy register, the broader product portfolio (Sandbox BPM, Workflow, Customer Loyalty, etc). |
| `https://desapintar.sandboxindonesia.id/` | The Desa Pintar product itself. Page meta gave us `theme-color: #5DC3B2` (the brand teal), keyword set (smart desa, keuangan desa, masterplan desa, peta desa, geospasial, potensi desa, berita desa, Klaten), and a single observable string of copy: *"Haloo, jalanin javascript nya dulu yaa"* — which alone told us the voice. The product itself is a JS SPA so deeper UI screenshots are out of reach here; the UI kit is a faithful conceptual recreation, not a pixel-perfect copy. |

⚠️ **What we did *not* have access to:** the Desa Pintar codebase, Figma file, or live app screenshots beyond the marketing meta tags. UI-kit component visuals are **inferred from the brand palette and category conventions**, not directly traced. Flagged again in each UI-kit README.

---

## The company in one paragraph

Sandbox Indonesia (legal name **PT Sandbox Indonesia Juara**) is an Indonesian software house headquartered in Java. They build a portfolio of locally-tuned SaaS products — BPM, workflow automation, customer loyalty, inventory, port/logistics, manufacturing — for Indonesian SMEs and government clients. **Desa Pintar** is their flagship public-sector product: a single-source-of-truth open-data platform for *desa* (village) administration, covering demographics, finances, mapping (geospasial), village news, and master-planning. It is in production with village governments such as Klaten (Central Java).

---

## CONTENT FUNDAMENTALS

The brand speaks **Bahasa Indonesia**, in a **warm, conversational, low-hierarchy** register. Imagine a smart-but-grounded younger sibling explaining tech to a village clerk who didn't ask to be a sysadmin — that's the voice.

### Language
- **Primary language:** Bahasa Indonesia. English is a secondary, technical register only.
- **Code-switching:** Tech nouns stay English (*dashboard, login, upload, masterplan, geospasial, open data*) but verbs and connectors are Indonesian (*jalanin, klik, masuk, lihat*). This is how the actual market talks.

### Tone & register
- **Friendly, not formal.** Use *kamu* / *Anda* — never *engkau*. The site itself opens with: *"Haloo, jalanin javascript nya dulu yaa"* — note the soft particle *"yaa"*, the casual *"jalanin"* (instead of formal *"jalankan"*), and the friendly *"Haloo"* (not *"Halo"*).
- **Reassuring, not salesy.** No hype words ("revolusioner", "terbaik di kelasnya"). Lean on practical claims: *"Pelayanan persuratan dan administrasi … dalam hitungan detik."*
- **Mission-forward.** The product exists to lift up villages. Copy is grounded in concrete civic benefit (KIP awards, faster pelayanan, BBM logbook for fishermen) — not abstract digital-transformation language.

### Casing
- **Sentence case** for headings and buttons. *Not* Title Case.
  - ✅ "Buat akun desa baru"
  - ❌ "Buat Akun Desa Baru"
- **Wordmark exception:** "DesaPintar" / "Desa Pintar" — the product name itself is bi-camel, written as one word in the logo and two in body copy. Both forms are acceptable in running text; default to two words ("Desa Pintar") when not next to the logo.
- **ALL CAPS:** reserved for eyebrows / micro-labels with widened tracking. Never on buttons or paragraphs.

### Person
- **"Kamu"** (you, informal) in marketing and onboarding.
- **"Anda"** (you, polite) in formal product copy aimed at officials (Kepala Desa, Sekdes), confirmation dialogs, legal/PII screens.
- **"Kami"** (we) when speaking as Sandbox / Desa Pintar.
- Never *"Saya"* in product UI.

### Punctuation & rhythm
- Em-dashes are fine; en-dashes for ranges; ellipses sparingly.
- Indonesian comma rules — note: *"Inovasi Desa, Membangun Indonesia"* (comma is mandatory).
- Sentences run a little longer than US-English norms; that's OK in BI.

### Emoji & particles
- **No emoji in product UI.** They look toy-ish next to the civic-government context.
- Marketing/social may use sparing emoji (🌾 🏘️ 🇮🇩) but no faces.
- **Soft particles** ("ya", "kok", "deh", "sih") are permitted in onboarding tooltips and empty-states only — they're what makes the voice feel human. Avoid in error dialogs.

### Examples — write like this

| Surface | Copy |
|---|---|
| Empty-state | *"Belum ada penduduk yang terdaftar. Mulai dengan menambahkan satu KK, ya."* |
| Primary CTA | *"Tambah penduduk"* — sentence case, verb-first. |
| Success toast | *"Tersimpan. Data sudah masuk ke server desa."* |
| Error dialog (formal) | *"Permintaan Anda tidak dapat diproses. Silakan coba lagi atau hubungi admin desa."* |
| Hero subhead | *"Inovasi dalam pembangunan desa dengan data tunggal yang terbuka."* |
| Marketing tagline | *"Inovasi Desa, Membangun Indonesia."* |

### Don't write like this
- ❌ "Selamat datang!!! 🎉 Yuk mulai perjalanan digitalisasi desamu bersama kami yang siap memberikan solusi terbaik di kelasnya!" (hype, emoji, run-on)
- ❌ "Click Here To Continue" (English Title Case)
- ❌ "Error 422: validation_failed_unprocessable_entity" (developer-speak surfaced to users)

---

## VISUAL FOUNDATIONS

### Palette philosophy
Two co-equal palette families that meet at the logo:

1. **Teal** (`#5DC3B2` and family) — the *smart* / cool / trust side. Lifted from the live site's `theme-color` meta. Used for primary UI: buttons, links, focus rings, active states, brand bar, navigation chrome.
2. **Sunset** (marigold → coral → berry → violet → plum) — the *desa* / warm / community side. Lifted from the four gradient definitions inside the logo (`id0`–`id4`). Used for accents, illustrations, data-viz categorical colors, hero panels, decorative chips.

The two families never fight: teal owns interaction, sunset owns expression. A standard screen is mostly white/cream + teal accents, with one or two sunset moments per surface (a stat card, an illustration, a chip).

Neutrals are **warm slate** (warmer than Tailwind's cool slate by ~2°) to harmonize with the sunset family without going sepia. Backgrounds default to `--slate-50` (#FAF9F7), not pure white — pure white feels clinical next to the warm logo.

See [`colors_and_type.css`](./colors_and_type.css) for the full token list.

### Type
- **Display:** Plus Jakarta Sans (700–800). An Indonesian-designed typeface from Tokotype — culturally appropriate, geometric-but-friendly, free on Google Fonts. Closely mirrors the rounded "DesaPintar" wordmark.
- **Body:** Inter (400–600). Workhorse UI font. High legibility at small sizes for forms-heavy admin product.
- **Mono:** JetBrains Mono (400–500). For IDs, codes, tabular numbers, dev surfaces.

⚠️ **Font substitution note:** the original logo wordmark may be set in a similar typeface (Outfit / Poppins / a custom rounded sans). Plus Jakarta Sans is our nearest free match. If you have the original brand file or want us to swap fonts (Poppins / Outfit / Manrope), please drop them in `fonts/` and ping me — see "Open questions" at the bottom.

### Layout & spacing
- **4px base grid.** Spacing tokens at 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- **Generous gutters.** Cards have 24–32px internal padding; sections 64–96px vertical.
- **Mobile-first.** A lot of village staff use this on phones — 16px gutters min, 44px hit targets min.
- **Max content width:** 1200px for marketing, 1440px for dashboards.

### Backgrounds
- **Default:** flat `--slate-50` (#FAF9F7) — warm off-white.
- **Hero/feature panels:** soft teal wash (`--teal-50`) or one of the sunset gradients (`--grad-sunset`, `--grad-dawn`) at low intensity. Never full-saturation gradients across whole pages.
- **No textures, no halftones, no hand-drawn illustrations.** The brand is institutional/civic. Keep surfaces clean.
- **Imagery vibe:** when photography appears, prefer warm-toned candid shots of Indonesian rural life (rice fields, village markets, balai desa, kids at sekolah). Avoid stock-photo handshakes, board rooms, generic globes. **No grain or duotone filters.**

### Animation
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` is the default — a friendly out-snap. Spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`) reserved for cheerful confirmations (success toasts, new-record celebrations).
- **Durations:** 120 / 200 / 360 ms. Anything slower feels sluggish on rural-internet conditions.
- **Use animation for:** state change feedback (toast slide-in, modal fade), loading shimmers, focus rings appearing.
- **Don't use animation for:** decoration, hero parallax, scroll-jacking. Village-government users want speed.

### Hover & press states
- **Hover (interactive):** background steps one tone darker (`--teal-400` → `--teal-500`), or for ghost buttons, fill from `transparent` → `--teal-50`. **No** opacity-only hover (looks broken on older monitors).
- **Press:** background steps two tones darker (`--teal-600`), and the element shrinks by `transform: scale(0.98)`. Lasts 120ms.
- **Focus:** 3px ring at `var(--teal-400)` with 2px offset. Visible on keyboard nav only (`:focus-visible`).

### Borders
- **Default border:** 1px `--slate-200`.
- **Strong border (around inputs in error / emphasis cards):** 1.5px `--slate-300`.
- **No double borders.** Pick border-or-shadow, never both.

### Shadows
- **Soft, warm.** All shadow tokens use `rgba(15, 14, 10, 0.04–0.10)` (a warm near-black), never pure black.
- **5-step elevation:** `xs / sm / md / lg / xl`.
- **Special:** `--shadow-teal` — a glow used only on primary-brand CTAs, gives them a subtle "lifted" feel.
- **Inset:** `--shadow-inset` adds a 1px top-light to large gradient panels for a softer top edge.

### Corner radii
- **Friendly, not playful.** Aligned with the rounded wordmark.
- 4 / 8 / 12 / 16 / 24 / 32 / pill.
- Buttons use 12px (`--radius-md`). Cards use 16px (`--radius-lg`). Modals use 24px (`--radius-xl`). Pills for chips and tags.

### Cards
- White surface, `--shadow-sm` by default, `--shadow-md` on hover.
- **No** colored left-border accent (we explicitly avoid that AI-slop trope).
- **No** outline + shadow combo. Either border *or* shadow, not both.
- Hover lifts: `translateY(-2px)` over 200ms.

### Transparency & blur
- **Sparingly.** Used for sticky nav bars (`backdrop-filter: blur(12px)` + 80% opacity background) and modal scrims (`rgba(15, 14, 10, 0.4)`).
- Not used for decorative glass panels or hero overlays.

### Fixed/sticky elements
- App shell: sidebar (240px) on desktop, bottom-nav (5 items max) on mobile.
- Sticky top bar: 64px tall, white/80 + blur, 1px bottom border.
- Toast region: top-right (desktop), top-center (mobile), max 3 stacked.

### Data viz / categorical color order
When you need N categorical colors (chart series, status chips), use this order from the sunset family — they have good perceptual separation:

1. Teal (`--teal-400`)
2. Marigold (`--marigold`)
3. Sunset (`--sunset`)
4. Berry (`--berry`)
5. Violet (`--violet`)
6. Coral (`--coral`)
7. Teal-700 (`--teal-700`)
8. Sunglow (`--sunglow`)

---

## ICONOGRAPHY

The brand does not ship its own icon font. For consistency we standardize on **[Lucide](https://lucide.dev/)** (1.5px stroke, rounded join/cap) loaded from CDN. Rationale: stroke weight matches the friendly rounded wordmark, completely free, every icon we need exists, ships as inline SVG so we can color it with `currentColor`.

```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="map-pin"></i>
<script>lucide.createIcons();</script>
```

⚠️ **Substitution flag:** if the real Desa Pintar product uses a different icon set (Phosphor, Material Symbols, custom), please share it and we'll swap. Lucide is our best-guess match for the visual register.

### Rules of use
- **Size:** 16 / 20 / 24px. Match the line-height of the adjacent text.
- **Color:** `currentColor` — icons take the parent text color. Don't tint icons independently of their label unless they ARE the meaning (a status dot, a brand mark).
- **Stroke:** Lucide default 1.5–2px. Don't switch to 1px (too thin against warm whites) or 3px (too aggressive).
- **No emoji in product UI.** As covered in CONTENT FUNDAMENTALS.
- **No unicode characters as icons** (no ★, no →, no ✓). Always use a real Lucide icon.
- **No drawn-in-SVG illustrations.** When we need an illustration (empty states, marketing heroes) we ask the user for a real asset or leave a labeled placeholder rectangle.

### Logo / mark assets in `assets/`
- `logo-desapintar-full.svg` — full color, primary mark. Use on white/cream surfaces.
- `logo-desapintar-mono-dark.svg` — single-color near-black. Use on photography or busy backgrounds where the gradient would compete.
- `logo-desapintar-mono-white.svg` — single-color white. Use on teal / sunset / photo backgrounds.
- `icon-desapintar.svg` — icon-only (leaf-D, no wordmark). Use as favicon, app icon, avatar.

### Clear space
Reserve clear space equal to the height of the leaf-D icon on all sides of the logo. Don't crop the icon in branded contexts.

### Don't
- Don't recolor the leaf gradient. It's the brand.
- Don't apply drop shadows to the logo.
- Don't place the full-color logo on backgrounds darker than `--slate-100`; use the white mono version.
- Don't stretch, skew, or rotate the lockup.

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `README.md` | You are here. |
| `SKILL.md` | Cross-compatible entry point for design agents. |
| `colors_and_type.css` | Single source of truth for tokens. Import this. |
| `assets/` | Logos, favicons, placeholders. Real bitmap assets go here too. |
| `fonts/` | Locally-hosted webfonts (currently empty — using Google Fonts CDN). |
| `preview/` | The cards shown in the Design System tab. Don't ship these — they're documentation. |
| `ui_kits/desa-pintar/` | High-fidelity recreation of the Desa Pintar product UI. Components + a clickable demo `index.html`. |

---

## Open questions for you

A short list of things I'd love you to confirm so the system gets to "perfect":

1. **The original wordmark typeface** — is it Plus Jakarta Sans, Poppins, Outfit, or a custom drawing? If you have the source font, drop it in `fonts/`.
2. **Icon set in the real product** — Lucide, Phosphor, Material Symbols, or custom? A screenshot of any toolbar would settle it.
3. **Product screenshots** — any captures of the dashboard, login, demographics module, finance module, or map view? The UI kit recreation is informed by the brand palette + the product's known feature areas, but it's not pixel-derived.
4. **Other surfaces in the family** — are there sibling Sandbox products (BPM, Workflow, Customer Loyalty) you want their own UI kits for, or is Desa Pintar the only one in scope?
5. **Bahasa vs English defaults** — should the UI kit ship Indonesian copy throughout (current default) or bilingual placeholders?
