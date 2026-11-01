# pink-web

Public website and admin panel (CMS) for 粉色誘惑🫦 (WEB-CMS-01), in English, Traditional Chinese (Taiwan) and Simplified Chinese. Next.js 16 (App Router, Cache Components),
Tailwind CSS 4 and next-intl. Content comes from `../api`.

## Setup

```bash
cp .env.example .env.local    # API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:3000 (API must be running)
npm run build && npm start    # production; the build also fetches from the API
```

| Env | Purpose |
| --- | --- |
| `API_URL` | Base URL of pink-api (server side only) |
| `ALLOW_INDEXING` | Set `true` only at approved public launch; staging is `noindex` |

## Admin panel (`/admin`)

Sign in at http://localhost:3000/admin with the seeded staging account **admin / admin123**.
The panel is English only and has its own root layout (`src/app/admin`), outside the locale routes
and the age gate.

| Section | What editors do |
| --- | --- |
| Dashboard | Counts, recent activity, launch checklist |
| Profiles | Create (as draft), edit each language, attributes, publish / unpublish / archive / delete, reorder |
| Gallery | Upload images per cast member, alt text per language, rights confirmation, main photo, order, delete |
| Schedule | Week grid per profile, add/edit/delete slots in Tokyo time, overnight hint, day off / cancelled |
| Pricing | Categories and lines, amount + currency + minutes, show/hide, order, footnote |
| Pages | Home, access, recruit, contact, privacy, terms, notices: per-language draft/publish, Markdown preview, SEO fields |
| Site settings | Title, tagline, logo and banners (uploaded here), intro, highlights, hours, area, contact channels, social links, menu order and visibility, age gate |
| Admin users | Owners create accounts, set roles, disable, reset passwords |
| Activity log | Who changed what and when |

How it works:

- Server Actions call the API with the session token from the `pink_admin` cookie
  (httpOnly, SameSite=Strict, path `/admin`, Secure in production). `src/proxy.ts` sends visitors
  without the cookie to the login page; the API checks every request.
- After a save, actions call `updateTag()` for the affected public cache tags, so the public site
  shows the change on the next request.
- Code: `src/app/admin` (routes), `src/components/admin` (UI), `src/lib/admin` (API client,
  actions, types).

## Localization

- Locales, each maintained separately:
  - `en` English (default), at `/en/...`
  - `zh-TW` Traditional Chinese for Taiwan, at `/zh-tw/...`
  - `zh-CN` Simplified Chinese for Mainland China, at `/zh-cn/...`
- `/` redirects to `/en`. No Accept-Language or geo redirects.
- UI strings: `messages/en.json`, `messages/zh-TW.json`, `messages/zh-CN.json` (keys must match; `en.json` types them).
- zh-CN uses Mainland wording (短信, 厘米, 信息), not just converted characters, plus Mainland fonts (PingFang SC / Microsoft YaHei).
- The brand 粉色誘惑🫦 is kept unchanged in every language.
- Phones show the language switcher as a compact menu; wider screens show EN / 繁中 / 简中.
- CMS content arrives already localized from the API.
- The language switcher keeps the current page and query string.
- Both Chinese versions are first drafts and need translator review before launch.

## Structure

```
src/
  proxy.ts                 locale routing + 18+ age gate (cookie age_ack)
  i18n/                    next-intl routing, request config, navigation
  lib/api/                 typed API client ("use cache", tagged "cms")
  app/[locale]/            pages: home, system, schedule, cast, cast/[slug],
                           access, recruit, contact, privacy, terms, notices, age-check
  components/              layout (header, footer, nav), cast, schedule, ui
```

## Notes

- Navigation order and visibility come from CMS settings (SRS Q05).
- Data is cached for about 60s, with tags `cms` + `settings|pricing|profiles|schedule|pages`
  so the admin portal can call `revalidateTag` later.
- Fonts are system stacks (PingFang TC / Microsoft JhengHei; Didot / Georgia for display);
  there are no web-font downloads.
- Hidden profile URLs show the not-found page. The HTTP status is 200 (not 404) because the
  layout shell streams first; a hard 404 would need a check in `proxy.ts`.
