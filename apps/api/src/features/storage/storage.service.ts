import { randomUUID } from 'node:crypto';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private client?: SupabaseClient;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (url && key) this.client = createClient(url, key, { auth: { persistSession: false } });
  }

  async createSignedUpload(folder: string, fileName: string, contentType: string) {
    if (!this.client) throw new ServiceUnavailableException('Supabase Storage belum dikonfigurasi');
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'tolong-media');
    const extension = fileName.includes('.') ? fileName.split('.').pop() : this.extensionFromContentType(contentType);
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const cleanName = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'upload';
    const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${cleanName}.${extension}`;
    const { data, error } = await this.client.storage.from(bucket).createSignedUploadUrl(path);
    if (error) throw new ServiceUnavailableException(error.message);
    const publicUrl = this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return { ...data, bucket, path, publicUrl, contentType };
  }

  private extensionFromContentType(contentType: string) {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('mp4')) return 'mp4';
    if (contentType.includes('pdf')) return 'pdf';
    return 'jpg';
  }
}
