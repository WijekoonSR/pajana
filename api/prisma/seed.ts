// Seed: wipes and re-inserts all public content with starter data.
// Fictional people, placeholder contact details, prices and copy; replace via the CMS.
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { addDays, tokyoToday } from '../src/common/tokyo-time.js';
import { hashPassword } from '../src/admin/auth/password.js';
import { bannerSvg, LOOKS, portraitSvg } from './portrait.js';
import { addSampleCasts } from './sample-casts.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const SEED_DIR = fileURLToPath(new URL('../uploads/seed', import.meta.url));
// Folder used by older seeds; removed on every run.
const LEGACY_DIR = fileURLToPath(new URL('../uploads/demo', import.meta.url));

// English, Traditional Chinese (Taiwan), Simplified Chinese (Mainland).
type L = { en: string; 'zh-TW': string; 'zh-CN': string };
const l = (en: string, tw: string, cn: string): L => ({ en, 'zh-TW': tw, 'zh-CN': cn });

// ---------------------------------------------------------------------------
// Placeholder art: illustrated (drawn) portraits, see portrait.ts.
// No photos and no real or identifiable people.
// ---------------------------------------------------------------------------
function writeSvg(file: string, svg: string) {
  writeFileSync(`${SEED_DIR}/${file}`, svg);
  return `seed/${file}`;
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
type Visibility = 'PUBLISHED' | 'DRAFT' | 'HIDDEN';
interface SeedProfile {
  slug: string;
  name: L;
  age: number;
  height: number;
  style: L;
  bio: L;
  comment: L;
  images: number;
  visibility: Visibility;
  isNew?: boolean;
}

const PROFILES: SeedProfile[] = [
  {
    slug: 'sakura',
    name: l('Sakura', '小櫻', '小樱'),
    age: 22,
    height: 158,
    style: l('Elegant', '優雅', '优雅'),
    bio: l(`Friendly and calm, enjoys tea and quiet conversation.`, `親切又沉穩，喜歡喝茶與輕鬆聊天。`, `亲切又沉稳，喜欢喝茶与轻松聊天。`),
    comment: l('Looking forward to meeting you.', '期待與您見面。', '期待与您见面。'),
    images: 3,
    visibility: 'PUBLISHED',
    isNew: true,
  },
  {
    slug: 'mio',
    name: l('Mio', '美緒', '美绪'),
    age: 24,
    height: 162,
    style: l('Cheerful', '開朗', '开朗'),
    bio: l(`Bright personality who loves music and travel.`, `個性開朗，熱愛音樂與旅行。`, `个性开朗，热爱音乐与旅行。`),
    comment: l('Always smiling!', '永遠帶著笑容！', '永远带着笑容！'),
    images: 2,
    visibility: 'PUBLISHED',
  },
  {
    slug: 'rina',
    name: l('Rina', '里奈', '里奈'),
    age: 21,
    height: 155,
    style: l('Cute', '可愛', '可爱'),
    bio: l(`Sweet and attentive, a fan of cafes and fashion.`, `甜美體貼，喜歡咖啡廳與時尚。`, `甜美体贴，喜欢咖啡厅与时尚。`),
    comment: l('Please say hello.', '歡迎來打招呼。', '欢迎来打招呼。'),
    images: 2,
    visibility: 'PUBLISHED',
    isNew: true,
  },
  {
    slug: 'yuna',
    name: l('Yuna', '優奈', '优奈'),
    age: 26,
    height: 165,
    style: l('Mature', '成熟', '成熟'),
    bio: l(`Graceful and relaxed, enjoys art and evening walks.`, `氣質優雅、從容自在，喜歡藝術與夜間散步。`, `气质优雅、从容自在，喜欢艺术与夜间散步。`),
    comment: l('A relaxing time awaits.', '為您帶來放鬆的時光。', '为您带来放松的时光。'),
    images: 3,
    visibility: 'PUBLISHED',
  },
  {
    slug: 'hana',
    name: l('Hana', '花', '花'),
    age: 23,
    height: 160,
    style: l('Natural', '自然', '自然'),
    bio: l(`Easygoing and warm, loves cooking and movies.`, `隨和溫暖，喜歡下廚與看電影。`, `随和温暖，喜欢下厨与看电影。`),
    comment: l('Nice to meet you.', '很高興認識您。', '很高兴认识您。'),
    images: 1,
    visibility: 'PUBLISHED',
  },
  {
    slug: 'aoi',
    name: l('Aoi', '葵', '葵'),
    age: 25,
    height: 168,
    style: l('Stylish', '時尚', '时尚'),
    bio: l(`Tall and stylish, enjoys yoga and photography.`, `高挑有型，喜歡瑜伽與攝影。`, `高挑有型，喜欢瑜伽与摄影。`),
    comment: l('See you soon.', '期待很快見到您。', '期待很快见到您。'),
    images: 2,
    visibility: 'PUBLISHED',
  },
  {
    slug: 'draft-profile',
    name: l('Draft Profile', '草稿檔案', '草稿资料'),
    age: 22,
    height: 157,
    style: l('Draft', '草稿', '草稿'),
    bio: l(`Draft profile for testing. Must never appear publicly.`, `測試用草稿檔案，不得公開顯示。`, `测试用草稿资料，不得公开显示。`),
    comment: l('Draft', '草稿', '草稿'),
    images: 1,
    visibility: 'DRAFT',
  },
  {
    slug: 'hidden-profile',
    name: l('Hidden Profile', '隱藏檔案', '隐藏资料'),
    age: 23,
    height: 161,
    style: l('Hidden', '隱藏', '隐藏'),
    bio: l(`Hidden profile for testing. Must never appear publicly.`, `測試用隱藏檔案，不得公開顯示。`, `测试用隐藏资料，不得公开显示。`),
    comment: l('Hidden', '隱藏', '隐藏'),
    images: 1,
    visibility: 'HIDDEN',
  },
];

// Schedule pattern per profile index, per day offset (0..6).
// [startHour, endHour] in Tokyo time; endHour > 24 means overnight; 'off' = day off.
type Shift = [number, number] | 'off' | null;
const SHIFTS: Shift[][] = [
  [[12, 18], [12, 18], 'off', [18, 24], [20, 26], null, [12, 20]],
  [[20, 26], 'off', [14, 22], [14, 22], null, [20, 27], [20, 26]],
  [[14, 20], [14, 20], [14, 20], 'off', [12, 17], [12, 17], null],
  [null, [19, 25], [19, 25], [19, 25], 'off', [16, 23], [16, 23]],
  [[18, 23], null, 'off', [12, 18], [12, 18], [18, 24], null],
  ['off', [12, 16], [21, 28], null, [13, 21], 'off', [13, 21]],
  [[12, 18], null, null, null, null, null, null], // draft: must not leak
  [[12, 18], [12, 18], null, null, null, null, null], // hidden: must not leak
];

function tokyoInstant(date: string, hour: number): Date {
  const day = hour >= 24 ? addDays(date, 1) : date;
  const h = String(hour % 24).padStart(2, '0');
  return new Date(`${day}T${h}:00:00+09:00`);
}

async function main() {
  // Seed folder holds generated files only; recreate it on every run.
  rmSync(LEGACY_DIR, { recursive: true, force: true });
  rmSync(SEED_DIR, { recursive: true, force: true });
  mkdirSync(SEED_DIR, { recursive: true });

  await prisma.$transaction([
    prisma.scheduleSlot.deleteMany(),
    prisma.profileMedia.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.pricingEntry.deleteMany(),
    prisma.pricingCategory.deleteMany(),
    prisma.contentPage.deleteMany(),
    prisma.siteSettings.deleteMany(),
    // Seed files are regenerated; images uploaded through the CMS are kept.
    prisma.mediaAsset.deleteMany({ where: { OR: [{ path: { startsWith: 'seed/' } }, { path: { startsWith: 'demo/' } }] } }),
  ]);

  // --- Default admin -------------------------------------------------------
  // Default account (SRS UAT-12: no default accounts in a public
  // release). Created once; re-seeding never resets a changed password.
  const admin = await prisma.adminUser.findUnique({ where: { login: 'admin' } });
  if (!admin) {
    await prisma.adminUser.create({
      data: { login: 'admin', passwordHash: await hashPassword('admin123'), role: 'OWNER' },
    });
    console.log('Created default admin: admin / admin123 (change it after first sign-in)');
  }

  // --- Site settings -------------------------------------------------------
  const banners = [0, 1, 2].map((i) => ({
    // Unique names so browsers never show a cached older banner.
    path: writeSvg(`banner-${randomUUID()}.svg`, bannerSvg(i, `Banner ${i + 1} - illustration`)),
    width: 1600,
    height: 900,
    alt: l(`Banner ${i + 1}`, `橫幅 ${i + 1}`, `横幅 ${i + 1}`),
  }));

  await prisma.siteSettings.create({
    data: {
      id: 1,
      siteTitle: l('粉色誘惑🫦', '粉色誘惑🫦', '粉色誘惑🫦'),
      tagline: l(
        'Premium relaxation in Tokyo',
        '東京頂級放鬆體驗',
        '东京顶级放松体验',
      ),
      logoPath: null,
      heroBanners: banners,
      homeIntro: l(
        `Welcome to our international site. Browse our cast, check today's schedule, and contact us in English or Chinese.`,
        `歡迎蒞臨我們的國際網站。歡迎瀏覽成員、查看今日班表，並以英文或中文與我們聯繫。`,
        `欢迎莅临我们的国际网站。欢迎浏览成员、查看今日排班，并以英文或中文与我们联系。`,
      ),
      highlights: [
        { title: l('English & Chinese support', '中英文服務', '中英文服务'), body: l('Contact us in English, Traditional or Simplified Chinese.', '可使用英文、繁體中文或簡體中文聯繫我們。', '可使用英文、繁体中文或简体中文联系我们。') },
        { title: l('Transparent pricing', '透明收費', '透明收费'), body: l('All prices listed in JPY, tax included.', '所有價格以日圓標示，含稅。', '所有价格以日元标示，含税。') },
        { title: l('Daily schedule', '每日班表', '每日排班'), body: l('Check who is available today and this week.', '查看今日及本週出勤成員。', '查看今日及本周出勤成员。') },
      ],
      businessHours: l('12:00 - 01:00 (next day) JST', '12:00 - 翌日01:00 日本時間', '12:00 - 翌日01:00 日本时间'),
      serviceArea: l('Tokyo', '東京', '东京'),
      mapUrl: null,
      contactChannels: [
        { type: 'phone', label: l('Phone', '電話', '电话'), value: '000-0000-0000', href: 'tel:00000000000' },
        { type: 'sms', label: l('SMS', '簡訊', '短信'), value: '000-0000-0000', href: 'sms:00000000000' },
        { type: 'email', label: l('Email', '電子郵件', '电子邮件'), value: 'info@example.com', href: 'mailto:info@example.com' },
      ],
      socialLinks: [],
      navigation: ['top', 'system', 'schedule', 'cast', 'access', 'recruit', 'contact'].map((key) => ({ key, visible: true })),
      ageGate: {
        title: l('Adults only (18+)', '僅限成人（18歲以上）', '仅限成人（18岁以上）'),
        body: l(
          `This website contains content intended for adults. By entering, you confirm that you are 18 years of age or older.`,
          `本網站含有成人內容。進入即表示您確認已年滿18歲。`,
          `本网站含有成人内容。进入即表示您确认已年满18岁。`,
        ),
        enterLabel: l('I am 18 or older - Enter', '我已年滿18歲 - 進入', '我已年满18岁 - 进入'),
        leaveLabel: l('I am under 18 - Leave', '我未滿18歲 - 離開', '我未满18岁 - 离开'),
        leaveUrl: 'https://www.google.com',
      },
      pricingFootnote: l('All prices are in JPY and include tax.', '所有價格以日圓計價並含稅。', '所有价格以日元计价并含税。'),
    },
  });

  // --- Profiles, media and schedule ---------------------------------------
  const today = tokyoToday();
  for (const [index, p] of PROFILES.entries()) {
    const profile = await prisma.profile.create({
      data: {
        slug: p.slug,
        displayName: p.name,
        attributes: [
          { label: l('Age', '年齡', '年龄'), value: l(String(p.age), `${p.age}歲`, `${p.age}岁`) },
          { label: l('Height', '身高', '身高'), value: l(`${p.height} cm`, `${p.height} 公分`, `${p.height} 厘米`) },
          { label: l('Style', '風格', '风格'), value: p.style },
        ],
        bio: p.bio,
        comment: p.comment,
        sortOrder: index,
        visibility: p.visibility,
        isNew: p.isNew ?? false,
      },
    });

    await prisma.profileMedia.createMany({
      data: Array.from({ length: p.images }, (_, i) => ({
        profileId: profile.id,
        // Unguessable names so unpublished profiles' files cannot be found by slug.
        path: writeSvg(`${randomUUID()}.svg`, portraitSvg(LOOKS[index % LOOKS.length], i, `${p.name.en} - illustration ${i + 1}`)),
        width: 600,
        height: 800,
        altText: l(`${p.name.en} - illustrated portrait ${i + 1}`, `${p.name['zh-TW']} - 插畫肖像 ${i + 1}`, `${p.name['zh-CN']} - 插画肖像 ${i + 1}`),
        sortOrder: i,
        isPrimary: i === 0,
      })),
    });

    const shifts = SHIFTS[index] ?? [];
    for (const [offset, shift] of shifts.entries()) {
      if (!shift) continue;
      const date = addDays(today, offset);
      const [startH, endH] = shift === 'off' ? [0, 1] : shift;
      await prisma.scheduleSlot.create({
        data: {
          profileId: profile.id,
          startAt: tokyoInstant(date, startH),
          endAt: tokyoInstant(date, endH),
          status: shift === 'off' ? 'DAY_OFF' : 'SCHEDULED',
          publicNote: endH > 24 ? l('Late night shift', '深夜班', '深夜班') : l('', '', ''),
        },
      });
    }
  }

  // One cancelled slot (must not appear publicly).
  const mio = await prisma.profile.findUniqueOrThrow({ where: { slug: 'mio' } });
  await prisma.scheduleSlot.create({
    data: {
      profileId: mio.id,
      startAt: tokyoInstant(today, 10),
      endAt: tokyoInstant(today, 12),
      status: 'CANCELLED',
      publicNote: l('Cancelled', '已取消', '已取消'),
    },
  });

  // --- Pricing -------------------------------------------------------------
  const pricing: { title: L; note: L; entries: { label: L; minutes: number | null; amount: number; desc: L }[] }[] = [
    {
      title: l('Courses', '方案', '方案'),
      note: l('', '', ''),
      entries: [
        { label: l('60 minutes', '60分鐘', '60分钟'), minutes: 60, amount: 20000, desc: l('Standard course', '標準方案', '标准方案') },
        { label: l('90 minutes', '90分鐘', '90分钟'), minutes: 90, amount: 28000, desc: l('Popular course', '人氣方案', '人气方案') },
        { label: l('120 minutes', '120分鐘', '120分钟'), minutes: 120, amount: 36000, desc: l('Relaxed course', '悠閒方案', '悠闲方案') },
      ],
    },
    {
      title: l('Extension', '延長', '延长'),
      note: l('', '', ''),
      entries: [
        { label: l('30 minute extension', '延長30分鐘', '延长30分钟'), minutes: 30, amount: 10000, desc: l('Subject to availability', '視情況而定', '视情况而定') },
      ],
    },
    {
      title: l('Options', '選項', '选项'),
      note: l('', '', ''),
      entries: [
        { label: l('Nomination fee', '指名費', '指名费'), minutes: null, amount: 1000, desc: l('Request a specific cast member', '指定成員', '指定成员') },
        { label: l('Costume', '服裝', '服装'), minutes: null, amount: 2000, desc: l('Free for 90 minutes or longer', '90分鐘以上免費', '90分钟以上免费') },
      ],
    },
    {
      title: l('Transportation fees', '交通費', '交通费'),
      note: l('Fees depend on your location.', '費用依地區而定。', '费用依地区而定。'),
      entries: [
        { label: l('Central area', '中心區域', '中心区域'), minutes: null, amount: 0, desc: l('Free', '免費', '免费') },
        { label: l('Nearby wards', '鄰近區域', '邻近区域'), minutes: null, amount: 2000, desc: l('Please ask when booking', '預約時請詢問', '预约时请询问') },
        { label: l('Other areas', '其他地區', '其他地区'), minutes: null, amount: 4000, desc: l('Please contact us to confirm', '請聯繫我們確認', '请联系我们确认') },
      ],
    },
  ];
  for (const [ci, c] of pricing.entries()) {
    await prisma.pricingCategory.create({
      data: {
        title: c.title,
        note: c.note,
        sortOrder: ci,
        entries: {
          create: c.entries.map((e, ei) => ({
            serviceLabel: e.label,
            durationMinutes: e.minutes,
            amount: e.amount,
            currency: 'JPY',
            description: e.desc,
            sortOrder: ei,
          })),
        },
      },
    });
  }
  // An unpublished category (must not appear publicly).
  await prisma.pricingCategory.create({
    data: { title: l('Unpublished (test)', '未發布（測試）', '未发布（测试）'), note: l('', '', ''), sortOrder: 99, published: false },
  });

  // --- Content pages -------------------------------------------------------
  const pages: Record<string, { en: [string, string]; zh: [string, string]; cn: [string, string] }> = {
    home: {
      en: ['Home', `Welcome to 粉色誘惑🫦. Browse our cast, check today's schedule, and contact us in English or Chinese.`],
      zh: ['首頁', `歡迎來到粉色誘惑🫦。歡迎瀏覽成員、查看今日班表，並以英文或中文與我們聯繫。`],
      cn: ['首页', `欢迎来到粉色誘惑🫦。欢迎浏览成员、查看今日排班，并以英文或中文与我们联系。`],
    },
    access: {
      en: ['Access', `We serve the Tokyo area. Exact locations are shared when you contact us.\n\n- Nearest stations: to be confirmed\n- Hotels and private rooms in the service area`],
      zh: ['交通資訊', `我們的服務範圍為東京地區。確切地點將於聯繫時告知。\n\n- 最近車站：待確認\n- 服務範圍內的飯店與私人房間`],
      cn: ['交通信息', `我们的服务范围为东京地区。确切地点将于联系时告知。\n\n- 最近车站：待确认\n- 服务范围内的酒店与私人房间`],
    },
    recruit: {
      en: ['Recruit', `## Now hiring\n\nWe are not accepting applications through this site yet. Please contact us by phone or email for details.\n\n- Applicants must be 18 or older and not a high school student\n- Flexible hours`],
      zh: ['招募', `## 招募中\n\n目前尚未透過本網站受理應徵。詳情請以電話或電子郵件聯繫。\n\n- 應徵者須年滿18歲且非高中生\n- 時間彈性`],
      cn: ['招聘', `## 招聘中\n\n目前尚未通过本网站受理应聘。详情请以电话或电子邮件联系。\n\n- 应聘者须年满18岁且非高中生\n- 时间弹性`],
    },
    contact: {
      en: ['Contact', `For reservations and inquiries, please contact us by phone, SMS or email. We reply in English or Chinese.`],
      zh: ['聯絡我們', `預約與諮詢請透過電話、簡訊或電子郵件與我們聯繫。我們可使用英文或中文回覆。`],
      cn: ['联系我们', `预约与咨询请通过电话、短信或电子邮件与我们联系。我们可使用英文或中文回复。`],
    },
    privacy: {
      en: ['Privacy Policy', `We collect only the information needed to respond to your inquiries and reservations, and we never share it with third parties without your consent.`],
      zh: ['隱私權政策', `我們僅收集回覆您的諮詢與預約所需的資訊，未經您同意絕不提供給第三方。`],
      cn: ['隐私政策', `我们仅收集回复您的咨询与预约所需的信息，未经您同意绝不提供给第三方。`],
    },
    terms: {
      en: ['Terms of Use', `## Prohibited conduct\n\n- Any act the cast member does not consent to\n- Recording or photography without permission\n- Stalking or invasion of privacy\n- Use by organized crime or anti-social forces`],
      zh: ['使用條款', `## 禁止事項\n\n- 任何未經成員同意的行為\n- 未經許可的錄影或拍照\n- 跟蹤或侵犯隱私\n- 暴力團體或反社會勢力之使用`],
      cn: ['使用条款', `## 禁止事项\n\n- 任何未经成员同意的行为\n- 未经许可的录影或拍照\n- 跟踪或侵犯隐私\n- 暴力团伙或反社会势力之使用`],
    },
    notices: {
      en: ['Legal Notices', `This service is available only to adults aged 18 or older. Operator details are available on request.`],
      zh: ['法律聲明', `本服務僅限年滿18歲之成人使用。經營者資訊可應要求提供。`],
      cn: ['法律声明', `本服务仅限年满18岁之成人使用。经营者信息可应要求提供。`],
    },
  };
  for (const [slug, { en, zh, cn }] of Object.entries(pages)) {
    for (const [locale, [title, body]] of [['en', en], ['zh-TW', zh], ['zh-CN', cn]] as const) {
      await prisma.contentPage.create({
        data: {
          slug,
          locale,
          title,
          body,
          seoTitle: `${title} | 粉色誘惑🫦`,
          metaDescription: `${title} - 粉色誘惑🫦`,
          // zh-TW notices stays DRAFT to prove per-locale unpublishing.
          status: slug === 'notices' && locale === 'zh-TW' ? 'DRAFT' : 'PUBLISHED',
        },
      });
    }
  }

  // 20 more casts, to test the CMS at a realistic size.
  await addSampleCasts(prisma, today);

  // Register the seed art in the media library so the CMS can reuse it.
  const seedMedia = await prisma.profileMedia.findMany({ select: { path: true, width: true, height: true } });
  await prisma.mediaAsset.createMany({
    data: [...banners, ...seedMedia].map((m) => ({
      path: m.path,
      width: m.width,
      height: m.height,
      mimeType: 'image/svg+xml',
      sizeBytes: statSync(`${SEED_DIR}/${m.path.slice('seed/'.length)}`).size,
      originalName: m.path.slice('seed/'.length),
    })),
    skipDuplicates: true,
  });

  const counts = {
    profiles: await prisma.profile.count(),
    media: await prisma.profileMedia.count(),
    slots: await prisma.scheduleSlot.count(),
    pricingEntries: await prisma.pricingEntry.count(),
    pages: await prisma.contentPage.count(),
    mediaLibrary: await prisma.mediaAsset.count(),
    admins: await prisma.adminUser.count(),
  };
  console.log('Seeded data:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
