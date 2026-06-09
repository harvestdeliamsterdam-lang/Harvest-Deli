# Harvest Deli — CMS / editorial layer (Sanity-ready)

A **future-proof content layer** for the Journal/blog and editorial site content.
It is **additive and safe**: the live static site renders exactly as before. Nothing
here touches commerce. Shopify is **not** involved.

> Split: **Shopify = commerce** (products, pricing, cart, orders) ·
> **Sanity = content** (journal, story, homepage editorial), composed on the frontend.

---

## What's here

```
cms/
  config.js          Single switch: source ('mock' | 'sanity') + render flag + Sanity creds
  mock-content.js    Mock provider — real article data in the exact Sanity runtime shape
  sanity.js          Live provider — fetch + GROQ against the Sanity HTTP API (no SDK/build)
  index.js           Facade: HD_CMS.getPosts/getPost/... picks the active provider (+ toHtml)
  journal-render.js  DORMANT renderer for journal.html (reuses existing card markup)
  README.md          This file

sanity/              Standalone Sanity Studio for editors (deploy later)
  sanity.config.js   Studio config + desk structure
  sanity.cli.js      CLI config (project/dataset)
  package.json       Studio dependencies
  .env.example       SANITY_STUDIO_PROJECT_ID / DATASET
  schemas/
    index.js                 Schema registry
    objects/seo.js           Reusable SEO object (title, description, ogImage, noIndex)
    objects/blockContent.js  Portable Text body
    documents/post.js        Journal article
    documents/category.js    Category (+ visual tone)
    documents/author.js      Author
    documents/homeSection.js Homepage editorial section
    documents/aboutStory.js  About page story (singleton)
```

## Blog post schema (`sanity/schemas/documents/post.js`)

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | required |
| `slug` | slug | from title; used for `article-<slug>.html` |
| `excerpt` | text | card summary + SEO fallback |
| `mainImage` | image | hotspot + `alt`/`caption` |
| `body` | Portable Text (`blockContent`) | rich text |
| `category` | reference → `category` | dereferenced at fetch |
| `author` | reference → `author` | dereferenced at fetch |
| `publishedAt` | datetime | sort key (newest first) |
| `language` | string | `nl` / `en` / `el` |
| `seoTitle` | string | meta title (falls back to `title`) |
| `seoDescription` | text | meta description (falls back to `excerpt`) |

Useful extras also present: `readingTime`, `status` (published / upcoming / draft),
`featured`, `ogImage`. Supporting documents: `category` (+ visual `tone`), `author`,
plus `homeSection` / `aboutStory` for site editorial.

> Runtime shape (what the frontend receives, identical from mock or Sanity):
> `image` (from `mainImage`), `seo:{title,description,ogImage}` (from `seoTitle`/
> `seoDescription`/`ogImage`), `category`/`author` dereferenced, `publishedLabel`
> + `href` derived. Posts can be filtered by `status`, `category`, `language`, `limit`.

---

## Runtime shape (source-agnostic)

Both providers return the **same** dereferenced object, so the frontend never
knows which source is live:

```js
{
  id, type:'post', title, slug, excerpt,
  body: [ /* Portable Text blocks */ ],
  image: { url|null, alt, caption },        // featured image
  category: { title, slug, tone },
  author:   { name, slug, role, image:{url|null} },
  publishedAt, publishedLabel, readingTime,
  status: 'published'|'upcoming'|'draft',
  featured: bool,
  href,                                     // article page URL
  seo: { title, description, ogImage|null }
}
```

## Frontend API

```js
HD_CMS.getPosts({ status, category, limit }) // -> Promise<post[]>
HD_CMS.getPost(slug)                         // -> Promise<post|null>
HD_CMS.getCategories()                       // -> Promise<category[]>
HD_CMS.getAuthors()                          // -> Promise<author[]>
HD_CMS.getHomeSections()                     // -> Promise<section[]>
HD_CMS.getAboutStory()                       // -> Promise<story>
HD_CMS.toHtml(portableText)                  // -> HTML string
```

Load order (already wired in `journal.html`):
`cms/config.js → mock-content.js → sanity.js → index.js → journal-render.js`

---

## Preview it now (mock, safe)

The static page is the default. Opt in per-visit with a URL flag — nothing is
committed or changed:

- `journal.html` → untouched static page
- `journal.html?cms=1` or `?cms=mock` → renders from **mock** content
- `journal.html?cms=sanity` → renders from the **live Sanity API** (once configured)
- `journal.html?cms=off` → force static

If Sanity is selected but unreachable/unconfigured, the facade **falls back to
mock** so the page is never empty.

---

## Connect the real Sanity project (later, ~15 min)

1. **Create the project**
   ```bash
   cd sanity
   cp .env.example .env        # then edit values
   npm install
   npx sanity login
   npx sanity init --reconfigure   # or create a project at sanity.io/manage
   ```
   Put the resulting **projectId** + **dataset** in both `sanity/.env` and
   `cms/config.js → config.sanity`.

2. **Run / deploy the Studio for editors**
   ```bash
   npm run dev      # local Studio at http://localhost:3333
   npm run deploy   # hosted Studio at <name>.sanity.studio
   ```

3. **Allow the website to read content (CORS)**
   In sanity.io/manage → API → CORS origins, add your site origin(s)
   (e.g. `https://harvestdeli.nl`, `http://localhost:3007`). No token needed —
   published content is public via `apicdn.sanity.io`.

4. **Seed content** — create a few `category` + `author` docs, then `post` docs.
   (Optional) migrate the existing `article-*.html` essays into `post` bodies.

5. **Go live with the CMS**
   - Per page: visit with `?cms=sanity`, or
   - Globally: set `source:'sanity'` and `render:true` in `cms/config.js`.

That's the whole swap — **mock → Sanity is a one-line source change**, because both
providers honour the identical runtime shape.

---

## Safety notes

- Purely additive. Removing the `cms/` script tags from `journal.html` restores the
  pure static page.
- `render` is **false** by default; the CMS never overwrites static HTML unless asked.
- No commerce coupling, no Shopify, no build step, no new runtime dependency on the
  static site (Sanity reads are plain `fetch`).
- `homeSection` / `aboutStory` ship **disabled** — the homepage and About page keep
  their built-in copy until an editor enables a section.
