import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type StorageMode = 'supabase' | 'local';

@Injectable()
export class StorageService {
  private client?: SupabaseClient;
  private readonly allowedFolders = new Set(['reports', 'products', 'articles', 'jobs', 'profiles', 'banners']);

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) this.client = createClient(url, key, { auth: { persistSession: false } });
  }

  async createSignedUpload(folder: string, fileName: string, contentType: string) {
    if (!this.client) throw new ServiceUnavailableException('Supabase Storage belum dikonfigurasi');
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'tolong-media');
    const path = this.buildPath(folder, fileName, contentType);
    const { data, error } = await this.client.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw new ServiceUnavailableException(error.message);
    const publicUrl = this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { ...data, bucket, path, publicUrl, contentType };
  }

  async uploadFile(folder: string, fileName: string, contentType: string, buffer: Buffer) {
    if (!this.isAllowedContentType(contentType)) {
      throw new BadRequestException('Format file belum didukung. Gunakan gambar, video, atau PDF.');
    }

    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'tolong-media');
    const path = this.buildPath(folder, fileName, contentType);

    if (this.client) {
      const { error } = await this.client.storage.from(bucket).upload(path, buffer, {
        contentType,
        upsert: false
      });
      if (error) throw new ServiceUnavailableException(error.message);
      const publicUrl = this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      return this.response('supabase', bucket, path, publicUrl, contentType, buffer.length);
    }

    const uploadRoot = this.config.get<string>('UPLOAD_DIR', '/app/uploads');
    const absolutePath = join(uploadRoot, path);
    const pathParts = path.split('/');
    await mkdir(join(uploadRoot, ...pathParts.slice(0, -1)), { recursive: true });
    await writeFile(absolutePath, buffer);
    const defaultApiBase =
      this.config.get<string>('NODE_ENV') === 'production'
        ? 'https://dokploy.closeclaw.site/tolong-api/v1'
        : `http://localhost:${this.config.get<number>('PORT', 3001)}/v1`;
    const apiBase = this.config.get<string>('PUBLIC_API_BASE_URL', defaultApiBase);
    const publicUrl = `${apiBase.replace(/\/$/, '')}/uploads/${path}`;
    return this.response('local', 'local-vps', path, publicUrl, contentType, buffer.length);
  }

  private response(
    storage: StorageMode,
    bucket: string,
    path: string,
    publicUrl: string,
    contentType: string,
    sizeBytes: number
  ) {
    return { storage, bucket, path, publicUrl, contentType, sizeBytes };
  }

  private buildPath(folder: string, fileName: string, contentType: string) {
    const safeFolder = this.normalizeFolder(folder);
    const extension = this.extensionFromContentType(contentType);
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'upload';
    return `${safeFolder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${cleanName}.${extension}`;
  }

  private normalizeFolder(folder: string) {
    const clean = folder.trim().toLowerCase();
    if (!this.allowedFolders.has(clean)) throw new BadRequestException('Folder upload tidak valid');
    return clean;
  }

  private isAllowedContentType(contentType: string) {
    return contentType.startsWith('image/') || contentType.startsWith('video/') || contentType === 'application/pdf';
  }

  private extensionFromContentType(contentType: string) {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    if (contentType.includes('mp4')) return 'mp4';
    if (contentType.includes('quicktime')) return 'mov';
    if (contentType.includes('pdf')) return 'pdf';
    return 'jpg';
  }
}
