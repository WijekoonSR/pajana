import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// Requires a migrated and seeded database (npm run db:seed) with the default
// admin / admin123 account.
describe('Admin API (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  const tempLogin = `e2e-${Date.now()}`;

  const http = () => request(app.getHttpServer());
  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    const res = await http()
      .post('/api/admin/auth/login')
      .send({ login: 'admin', password: 'admin123' })
      .expect(200);
    token = (res.body as { token: string }).token;
  });

  afterAll(async () => {
    await prisma.adminUser.deleteMany({ where: { login: { startsWith: 'e2e-' } } });
    await app.close();
  });

  it('rejects requests without a session (UAT-07)', async () => {
    await http().get('/api/admin/profiles').expect(401);
    await http().post('/api/admin/profiles').send({ slug: 'x' }).expect(401);
    await http().get('/api/admin/profiles').set(auth('not-a-token')).expect(401);
  });

  it('gives the same error for unknown logins and wrong passwords', async () => {
    const unknown = await http()
      .post('/api/admin/auth/login')
      .send({ login: 'nobody-here', password: 'x' })
      .expect(401);
    const wrong = await http()
      .post('/api/admin/auth/login')
      .send({ login: 'admin', password: 'wrong' })
      .expect(401);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('locks an account after repeated failures', async () => {
    await http()
      .post('/api/admin/users')
      .set(auth())
      .send({ login: tempLogin, password: 'correct-horse', role: 'EDITOR' })
      .expect(201);
    for (let i = 0; i < 5; i++) {
      await http()
        .post('/api/admin/auth/login')
        .set('X-Admin-Client-Ip', `10.0.0.${i}`)
        .send({ login: tempLogin, password: 'nope' })
        .expect(401);
    }
    // Correct password is refused while locked.
    await http()
      .post('/api/admin/auth/login')
      .send({ login: tempLogin, password: 'correct-horse' })
      .expect(401);
  });

  it('keeps editors out of user management', async () => {
    const login = `${tempLogin}-ed`;
    await http()
      .post('/api/admin/users')
      .set(auth())
      .send({ login, password: 'editor-pass', role: 'EDITOR' })
      .expect(201);
    const res = await http()
      .post('/api/admin/auth/login')
      .send({ login, password: 'editor-pass' })
      .expect(200);
    const editor = (res.body as { token: string }).token;
    await http().get('/api/admin/users').set(auth(editor)).expect(403);
    await http().get('/api/admin/profiles').set(auth(editor)).expect(200);
  });

  it('rejects non-image uploads (UAT-07)', async () => {
    await http()
      .post('/api/admin/media')
      .set(auth())
      .attach('file', Buffer.from('<script>alert(1)</script>'), 'evil.png')
      .expect(400);
  });

  it('hides a profile from the public site when unpublished (UAT-04)', async () => {
    const created = await http()
      .post('/api/admin/profiles')
      .set(auth())
      .send({ slug: `e2e-${Date.now()}`, displayName: { en: 'E2E' } })
      .expect(201);
    const { id, slug, visibility } = created.body as { id: string; slug: string; visibility: string };
    expect(visibility).toBe('DRAFT');
    await http().get(`/api/public/profiles/${slug}`).expect(404);

    await http().patch(`/api/admin/profiles/${id}`).set(auth()).send({ visibility: 'PUBLISHED' }).expect(200);
    await http().get(`/api/public/profiles/${slug}`).expect(200);

    await http().patch(`/api/admin/profiles/${id}`).set(auth()).send({ visibility: 'ARCHIVED' }).expect(200);
    await http().get(`/api/public/profiles/${slug}`).expect(404);
    await http().delete(`/api/admin/profiles/${id}`).set(auth()).expect(204);
  });

  it('stores overnight slots on the next day and rejects overlaps (UAT-05)', async () => {
    const profile = await prisma.profile.findFirstOrThrow({ where: { slug: 'sakura' } });
    const body = {
      profileId: profile.id,
      date: '2030-01-10',
      start: '21:00',
      end: '02:30',
      status: 'SCHEDULED',
    };
    const res = await http().post('/api/admin/schedule').set(auth()).send(body).expect(201);
    const slot = res.body as { id: string; end: string; endsNextDay: boolean };
    expect(slot.end).toBe('2030-01-11T02:30:00+09:00');
    expect(slot.endsNextDay).toBe(true);
    await http()
      .post('/api/admin/schedule')
      .set(auth())
      .send({ ...body, date: '2030-01-11', start: '01:00', end: '03:00' })
      .expect(409);
    await http().delete(`/api/admin/schedule/${slot.id}`).set(auth()).expect(204);
  });

  it('records changes in the audit log (CMS-08)', async () => {
    const res = await http().get('/api/admin/audit?pageSize=20').set(auth()).expect(200);
    const actions = (res.body as { entries: { action: string }[] }).entries.map((e) => e.action);
    expect(actions).toContain('schedule.create');
    expect(actions).toContain('profile.published');
  });
});
