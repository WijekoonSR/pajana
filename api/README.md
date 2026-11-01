# pink-api

NestJS + Prisma (PostgreSQL) backend for the WEB-CMS-01 international site (粉色誘惑🫦).
Serves the public read API and the admin/CMS API used by `../web` (public site and `/admin` panel).

## Setup

```bash
cp .env.example .env          # set DATABASE_URL
createdb pink_cms             # local PostgreSQL
npm install                   # also runs prisma generate
npm run db:migrate            # apply migrations
npm run db:seed               # starter data + placeholder SVGs + default admin
npm run start:dev             # http://localhost:4000
```

The seed creates the staging account **admin / admin123** (role OWNER) if it does not exist.
Re-seeding never resets its password. Change or disable it before any public release (UAT-12).

| Env | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | HTTP port (default 4000) |
| `WEB_ORIGIN` | Allowed CORS origin (the web app) |
| `PUBLIC_BASE_URL` | Base for absolute media URLs |

## Scripts

`start:dev`, `build`, `start:prod`, `test` (unit), `test:e2e` (public + admin, needs a seeded DB),
`db:migrate`, `db:deploy`, `db:seed`, `db:generate`, `lint`.

## Public endpoints

All are `GET`, take `?locale=en|zh-TW|zh-CN` (default `en`, anything else returns 400) and
return text already resolved for that locale (falling back to English).
Response shapes: `../web/src/lib/api/types.ts`.

| Path | Notes |
| --- | --- |
| `/api/health` | `{ status, db }` |
| `/api/public/settings` | Site title, banners, contact channels, navigation order, age-gate text |
| `/api/public/pricing` | Published categories and entries only |
| `/api/public/profiles` | Published profiles, sorted |
| `/api/public/profiles/:slug` | 404 unless published; includes 7-day schedule |
| `/api/public/schedule?date=YYYY-MM-DD&days=1..7` | Asia/Tokyo days; overnight slots flagged `endsNextDay` |
| `/api/public/pages/:slug` | 404 unless published **in that locale** (no fallback) |
| `/uploads/*` | Static media |

## Admin endpoints (`/api/admin/*`)

Every route except `POST /auth/login` needs `Authorization: Bearer <token>`. The web admin panel
calls these server side and keeps the token in an httpOnly cookie, so the browser never sees it.
Localized fields are sent and returned raw: `{ "en": "", "zh-TW": "", "zh-CN": "" }`.

| Area | Routes | Notes |
| --- | --- | --- |
| Auth | `POST auth/login`, `GET auth/me`, `POST auth/logout`, `POST auth/password` | 12 h sessions (SHA-256 of token stored) |
| Dashboard | `GET dashboard` | Counts and recent activity |
| Profiles | `GET/POST profiles`, `GET/PATCH/DELETE profiles/:id`, `POST profiles/reorder` | New profiles start as DRAFT; delete only when ARCHIVED |
| Gallery | `POST profiles/:id/media`, `PATCH/DELETE profiles/:id/media/:mediaId`, `POST profiles/:id/media/reorder` | `usageApproved` defaults to false; removing an image deletes its file |
| Media | `GET/POST media`, `POST media/:id/replace`, `DELETE media/:id` | multipart `file`; delete refused while in use |
| Schedule | `GET schedule?from=&days=`, `POST schedule`, `PUT/DELETE schedule/:id` | `{ profileId, date, start, end, status }`, Tokyo time |
| Pricing | `GET pricing`, `POST/PUT/DELETE pricing/categories[/:id]`, `POST/PUT/DELETE pricing/entries[/:id]`, reorder routes | |
| Pages | `GET pages`, `GET/PUT pages/:slug/:locale` | Upsert; status per locale |
| Settings | `GET/PUT settings` | Logo/banners must be uploaded images (`POST media`) |
| Users | `GET/POST users`, `PATCH users/:id` | OWNER only |
| Audit | `GET audit?page=&pageSize=` | |

Security (SRS CMS-01, CMS-07, CMS-08, section 09):

- Passwords hashed with scrypt; no plaintext anywhere.
- One error message for unknown login, wrong password, disabled or locked account.
- 5 failed sign-ins lock the account for 15 minutes; 20 failures per client IP in 15 minutes return 429.
- Roles: OWNER (everything) and EDITOR (content, no user management). At least one active owner is kept.
- Uploads: max 10 MB, type detected from content (JPEG, PNG, WebP, AVIF), auto-rotated,
  resized to 2400 px max and re-encoded to WebP with random names. Re-encoding strips EXIF/GPS.
  SVG uploads are refused.
- Contact and social links accept only `tel:`, `sms:`, `mailto:` and `https://`.
- Every change writes an `AuditEntry` (actor, action, record id, time). No content or secrets.

## Visibility rules (SRS WEB-05, UAT-04)

- Only `PUBLISHED` profiles appear anywhere; draft, hidden and archived ones return 404.
- Schedules exclude `CANCELLED` slots and slots of non-published profiles.
- Only media with `usageApproved` is exposed.
- A slot belongs to the Tokyo calendar date of its start time.

## Seed data

28 fictional profiles (including `hidden-profile` and `draft-profile` for leak testing),
schedules for the 7 days from the seed date (including overnight, day-off and cancelled
slots), prices in JPY, and content pages in all three locales (`notices` is left as a
zh-TW draft to show per-locale unpublishing). Re-run `npm run db:seed` to move the
schedule to the current week.
