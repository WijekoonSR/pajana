import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import sharp from 'sharp';
import { UPLOADS_DIR } from '../../configure-app.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 2400;
// Detected from file contents, not the client-supplied type or extension.
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif']);

export interface UploadedImage {
  buffer: Buffer;
  originalname: string;
  size: number;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const [assets, usage] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        orderBy: { createdAt: 'desc' },
        include: { uploadedBy: { select: { login: true } } },
      }),
      this.usageByPath(),
    ]);
    return assets.map((a) => ({
      id: a.id,
      path: a.path,
      width: a.width,
      height: a.height,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      originalName: a.originalName,
      uploadedBy: a.uploadedBy?.login ?? null,
      createdAt: a.createdAt.toISOString(),
      usedBy: usage.get(a.path) ?? [],
    }));
  }

  async upload(file: UploadedImage | undefined, actorId: string) {
    const processed = await this.process(file);
    const path = `media/${randomUUID()}.webp`;
    await this.writeFile(path, processed.data);
    const asset = await this.prisma.mediaAsset.create({
      data: {
        path,
        width: processed.width,
        height: processed.height,
        mimeType: 'image/webp',
        sizeBytes: processed.data.length,
        originalName: normalizeName(file!.originalname),
        uploadedById: actorId,
      },
    });
    await this.audit.record(actorId, 'media.upload', 'MediaAsset', asset.id);
    return asset;
  }

  /** Swaps the file behind an asset everywhere it is used (profiles, banners, logo). */
  async replace(id: string, file: UploadedImage | undefined, actorId: string) {
    const asset = await this.find(id);
    const processed = await this.process(file);
    const path = `media/${randomUUID()}.webp`;
    await this.writeFile(path, processed.data);

    const settings = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    await this.prisma.$transaction([
      this.prisma.mediaAsset.update({
        where: { id },
        data: {
          path,
          width: processed.width,
          height: processed.height,
          mimeType: 'image/webp',
          sizeBytes: processed.data.length,
          originalName: normalizeName(file!.originalname),
        },
      }),
      this.prisma.profileMedia.updateMany({
        where: { path: asset.path },
        data: { path, width: processed.width, height: processed.height },
      }),
      ...(settings
        ? [
            this.prisma.siteSettings.update({
              where: { id: 1 },
              data: {
                logoPath: settings.logoPath === asset.path ? path : settings.logoPath,
                heroBanners: (settings.heroBanners as unknown as BannerJson[]).map((b) =>
                  b.path === asset.path
                    ? { ...b, path, width: processed.width, height: processed.height }
                    : b,
                ) as object[],
              },
            }),
          ]
        : []),
    ]);
    await this.removeFile(asset.path);
    await this.audit.record(actorId, 'media.replace', 'MediaAsset', id);
    return this.find(id);
  }

  async remove(id: string, actorId: string) {
    const asset = await this.find(id);
    const usedBy = (await this.usageByPath()).get(asset.path);
    if (usedBy?.length) {
      throw new ConflictException(`Image is in use (${usedBy.join(', ')}). Remove it there first.`);
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.removeFile(asset.path);
    await this.audit.record(actorId, 'media.delete', 'MediaAsset', id);
  }

  /** Deletes an image and its file once nothing (profile, logo, banner) uses it any more. */
  async deleteIfUnused(path: string) {
    if ((await this.usageByPath()).get(path)?.length) return;
    const asset = await this.prisma.mediaAsset.findUnique({ where: { path } });
    if (asset) await this.prisma.mediaAsset.delete({ where: { id: asset.id } });
    await this.removeFile(path);
  }

  async find(id: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Image not found');
    return asset;
  }

  /** Where each file path is referenced, as human-readable labels. */
  private async usageByPath() {
    const usage = new Map<string, string[]>();
    const add = (path: string, label: string) =>
      usage.set(path, [...(usage.get(path) ?? []), label]);

    const [media, settings] = await Promise.all([
      this.prisma.profileMedia.findMany({
        select: { path: true, profile: { select: { slug: true } } },
      }),
      this.prisma.siteSettings.findUnique({ where: { id: 1 } }),
    ]);
    for (const m of media) add(m.path, `profile ${m.profile.slug}`);
    if (settings?.logoPath) add(settings.logoPath, 'site logo');
    for (const b of (settings?.heroBanners ?? []) as unknown as BannerJson[]) {
      add(b.path, 'home banner');
    }
    return usage;
  }

  /**
   * Validates by decoding, applies EXIF orientation, then re-encodes to WebP.
   * Re-encoding drops all metadata (EXIF/GPS) and any non-image payload.
   */
  private async process(file: UploadedImage | undefined) {
    if (!file?.buffer?.length) throw new BadRequestException('Choose an image file to upload');
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException('Image is larger than 10 MB');
    }
    let format: string | undefined;
    try {
      format = (await sharp(file.buffer).metadata()).format;
    } catch {
      format = undefined;
    }
    if (!format || !ALLOWED_FORMATS.has(format)) {
      throw new BadRequestException('Unsupported file type. Use JPEG, PNG, WebP or AVIF.');
    }
    const { data, info } = await sharp(file.buffer, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height };
  }

  private async writeFile(path: string, data: Buffer) {
    const full = safeJoin(path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data, { flag: 'wx' });
  }

  private async removeFile(path: string) {
    await unlink(safeJoin(path)).catch(() => undefined);
  }
}

interface BannerJson {
  path: string;
  width: number;
  height: number;
  alt: unknown;
}

function safeJoin(path: string) {
  const full = normalize(join(UPLOADS_DIR, path));
  if (!full.startsWith(normalize(UPLOADS_DIR))) throw new BadRequestException('Bad path');
  return full;
}

/** Original filename kept for display only: no path parts, safe characters, bounded. */
function normalizeName(name: string) {
  const base = name.split(/[\\/]/).pop() ?? 'image';
  return base.normalize('NFKC').replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 120) || 'image';
}
