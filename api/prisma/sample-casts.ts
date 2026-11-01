// 20 extra fictional casts (testing the CMS at a realistic
// size). Illustrated portraits only, no real people. Safe to run repeatedly:
// casts whose slug already exists are skipped, nothing is deleted.
import { randomUUID } from 'node:crypto';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { addDays } from '../src/common/tokyo-time.js';
import { LOOKS, portraitSvg } from './portrait.js';

const SEED_DIR = fileURLToPath(new URL('../uploads/seed', import.meta.url));

type L = { en: string; 'zh-TW': string; 'zh-CN': string };
const l = (en: string, tw: string, cn: string): L => ({ en, 'zh-TW': tw, 'zh-CN': cn });

// [English, Traditional, Simplified]
const NAMES: [string, string, string][] = [
  ['Akari', '明里', '明里'],
  ['Emi', '惠美', '惠美'],
  ['Kana', '佳奈', '佳奈'],
  ['Miku', '未來', '未来'],
  ['Nana', '奈奈', '奈奈'],
  ['Rei', '玲', '玲'],
  ['Saki', '咲', '咲'],
  ['Yui', '結衣', '结衣'],
  ['Haruka', '遙', '遥'],
  ['Kaede', '楓', '枫'],
  ['Mai', '舞', '舞'],
  ['Nozomi', '希', '希'],
  ['Riko', '莉子', '莉子'],
  ['Sayaka', '沙耶香', '沙耶香'],
  ['Tomoe', '友繪', '友绘'],
  ['Ayane', '彩音', '彩音'],
  ['Chika', '千夏', '千夏'],
  ['Hikari', '光', '光'],
  ['Momo', '桃', '桃'],
  ['Natsuki', '夏希', '夏希'],
];

const STYLES: L[] = [
  l('Elegant', '優雅', '优雅'),
  l('Cheerful', '開朗', '开朗'),
  l('Cute', '可愛', '可爱'),
  l('Mature', '成熟', '成熟'),
  l('Natural', '自然', '自然'),
  l('Stylish', '時尚', '时尚'),
];

const HOBBIES: L[] = [
  l('reading and tea', '閱讀與品茶', '阅读与品茶'),
  l('music and karaoke', '音樂與卡拉OK', '音乐与卡拉OK'),
  l('cafes and fashion', '咖啡廳與時尚', '咖啡厅与时尚'),
  l('travel and photography', '旅行與攝影', '旅行与摄影'),
  l('cooking and movies', '下廚與看電影', '下厨与看电影'),
  l('yoga and walks', '瑜伽與散步', '瑜伽与散步'),
  l('games and anime', '遊戲與動漫', '游戏与动漫'),
];

// Per day offset 0..6: [startHour, endHour] (endHour > 24 = overnight), 'off', or null.
type Shift = [number, number] | 'off' | null;
const PATTERNS: Shift[][] = [
  [[12, 18], null, [12, 18], 'off', [18, 24], [12, 18], null],
  [null, [19, 25], [19, 25], null, 'off', [20, 26], [20, 26]],
  [[14, 22], [14, 22], 'off', null, [14, 20], null, [16, 23]],
  ['off', [12, 17], null, [12, 17], [12, 17], [18, 23], null],
  [[20, 27], null, 'off', [21, 28], null, [20, 26], [12, 18]],
  [[13, 21], 'off', [13, 21], [13, 21], null, null, [15, 22]],
];

function tokyoInstant(date: string, hour: number): Date {
  const day = hour >= 24 ? addDays(date, 1) : date;
  return new Date(`${day}T${String(hour % 24).padStart(2, '0')}:00:00+09:00`);
}

export async function addSampleCasts(prisma: PrismaClient, today: string) {
  mkdirSync(SEED_DIR, { recursive: true });
  const last = await prisma.profile.aggregate({ _max: { sortOrder: true } });
  let sortOrder = (last._max.sortOrder ?? -1) + 1;
  let created = 0;

  for (const [i, [en, tw, cn]] of NAMES.entries()) {
    const slug = en.toLowerCase();
    if (await prisma.profile.findUnique({ where: { slug } })) continue;

    const age = 20 + (i * 7) % 10;
    const height = 150 + (i * 5) % 21;
    const style = STYLES[i % STYLES.length];
    const hobby = HOBBIES[i % HOBBIES.length];
    const profile = await prisma.profile.create({
      data: {
        slug,
        displayName: l(en, tw, cn),
        attributes: [
          { label: l('Age', '年齡', '年龄'), value: l(String(age), `${age}歲`, `${age}岁`) },
          { label: l('Height', '身高', '身高'), value: l(`${height} cm`, `${height} 公分`, `${height} 厘米`) },
          { label: l('Style', '風格', '风格'), value: style },
        ],
        bio: l(
          `${style.en} and friendly, enjoys ${hobby.en}.`,
          `${style['zh-TW']}又親切，喜歡${hobby['zh-TW']}。`,
          `${style['zh-CN']}又亲切，喜欢${hobby['zh-CN']}。`,
        ),
        comment: l('Looking forward to meeting you.', '期待與您見面。', '期待与您见面。'),
        sortOrder: sortOrder++,
        visibility: 'PUBLISHED',
        isNew: i % 6 === 0,
      },
    });

    const images = 1 + (i % 3);
    for (let v = 0; v < images; v++) {
      const file = `${randomUUID()}.svg`;
      writeFileSync(`${SEED_DIR}/${file}`, portraitSvg(LOOKS[(i + 3) % LOOKS.length], v, `${en} - illustration ${v + 1}`));
      const path = `seed/${file}`;
      await prisma.profileMedia.create({
        data: {
          profileId: profile.id,
          path,
          width: 600,
          height: 800,
          altText: l(`${en} - illustrated portrait ${v + 1}`, `${tw} - 插畫肖像 ${v + 1}`, `${cn} - 插画肖像 ${v + 1}`),
          sortOrder: v,
          isPrimary: v === 0,
        },
      });
      await prisma.mediaAsset.create({
        data: {
          path,
          width: 600,
          height: 800,
          mimeType: 'image/svg+xml',
          sizeBytes: statSync(`${SEED_DIR}/${file}`).size,
          originalName: `${en.toLowerCase()}-${v + 1}.svg`,
        },
      });
    }

    for (const [offset, shift] of PATTERNS[i % PATTERNS.length].entries()) {
      if (!shift) continue;
      const date = addDays(today, offset);
      const [start, end] = shift === 'off' ? [0, 1] : shift;
      await prisma.scheduleSlot.create({
        data: {
          profileId: profile.id,
          startAt: tokyoInstant(date, start),
          endAt: tokyoInstant(date, end),
          status: shift === 'off' ? 'DAY_OFF' : 'SCHEDULED',
          publicNote: end > 24 ? l('Late night shift', '深夜班', '深夜班') : l('', '', ''),
        },
      });
    }
    created++;
  }
  return created;
}
