import {
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AdminPrincipal } from '../auth/auth.types.js';
import { AdminController, CurrentAdmin } from '../auth/decorators.js';
import { MAX_UPLOAD_BYTES, MediaService, type UploadedImage } from './media.service.js';

// Files are held in memory (never written as uploaded) and size-capped by multer.
const upload = FileInterceptor('file', {
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

@AdminController('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list() {
    return this.media.list();
  }

  @Post()
  @UseInterceptors(upload)
  upload(@UploadedFile() file: UploadedImage | undefined, @CurrentAdmin() admin: AdminPrincipal) {
    return this.media.upload(file, admin.id);
  }

  @Post(':id/replace')
  @UseInterceptors(upload)
  replace(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedImage | undefined,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.media.replace(id, file, admin.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentAdmin() admin: AdminPrincipal) {
    return this.media.remove(id, admin.id);
  }
}
