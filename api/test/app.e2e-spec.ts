import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';

// Requires a migrated and seeded database (npm run db:seed).
describe('Public API (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', db: 'up' });
  });

  it('rejects unsupported locales', () => {
    return request(app.getHttpServer())
      .get('/api/public/settings?locale=fr')
      .expect(400);
  });

  it('serves zh-CN separately from zh-TW', async () => {
    const get = (locale: string) =>
      request(app.getHttpServer())
        .get(`/api/public/settings?locale=${locale}`)
        .expect(200)
        .then((res) => (res.body as { tagline: string }).tagline);
    const [tw, cn] = await Promise.all([get('zh-TW'), get('zh-CN')]);
    expect(tw).toContain('東京');
    expect(cn).toContain('东京');
  });

  it('does not expose hidden profiles', async () => {
    await request(app.getHttpServer())
      .get('/api/public/profiles/hidden-profile')
      .expect(404);
    const list = await request(app.getHttpServer())
      .get('/api/public/profiles')
      .expect(200);
    const slugs = (list.body as { slug: string }[]).map((p) => p.slug);
    expect(slugs).not.toContain('hidden-profile');
  });

  describe('GET /api/public/cast', () => {
    type Cast = {
      items: { slug: string; attributes: { label: string; value: string }[] }[];
      total: number;
      page: number;
      pages: number;
      styles: { value: string; label: string }[];
    };
    const cast = (qs: string) =>
      request(app.getHttpServer())
        .get(`/api/public/cast?${qs}`)
        .expect(200)
        .then((res) => res.body as Cast);
    const attr = (p: Cast['items'][number], label: string) =>
      p.attributes.find((a) => a.label === label)?.value ?? '';

    it('paginates published profiles', async () => {
      const first = await cast('pageSize=5');
      expect(first.items).toHaveLength(5);
      expect(first.pages).toBe(Math.ceil(first.total / 5));
      const last = await cast(`pageSize=5&page=${first.pages + 3}`);
      expect(last.page).toBe(first.pages);
      const slugs = (await cast('pageSize=48')).items.map((p) => p.slug);
      expect(slugs).not.toContain('hidden-profile');
      expect(slugs).not.toContain('draft-profile');
    });

    it('filters by age, height and style', async () => {
      const res = await cast('pageSize=48&ageMin=22&ageMax=24&heightMin=160');
      expect(res.total).toBeGreaterThan(0);
      for (const p of res.items) {
        expect(Number(attr(p, 'Age'))).toBeGreaterThanOrEqual(22);
        expect(Number(attr(p, 'Age'))).toBeLessThanOrEqual(24);
        expect(parseInt(attr(p, 'Height'), 10)).toBeGreaterThanOrEqual(160);
      }
      const cute = await cast('pageSize=48&style=cute');
      expect(cute.styles.map((s) => s.value)).toContain('cute');
      expect(cute.items.every((p) => attr(p, 'Style') === 'Cute')).toBe(true);
    });

    it('validates filters', () => {
      return request(app.getHttpServer())
        .get('/api/public/cast?available=never')
        .expect(400);
    });
  });
});
