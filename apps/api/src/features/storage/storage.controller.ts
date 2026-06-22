import { BadRequestException, Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { StorageService } from './storage.service';

class SignedUploadDto {
  @IsIn(['reports', 'products', 'articles', 'jobs', 'profiles', 'banners'])
  folder!: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;
}

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('signed-upload')
  signedUpload(@Body() dto: SignedUploadDto) {
    return this.storage.createSignedUpload(dto.folder, dto.fileName, dto.contentType);
  }

  @Post('upload')
  async upload(@Req() request: any) {
    const file = await request.file();
    if (!file) throw new BadRequestException('File wajib diunggah');
    const folderField = file.fields?.folder as { value?: string } | undefined;
    const folder = folderField?.value ?? 'articles';
    const buffer = await file.toBuffer();
    return this.storage.uploadFile(folder, file.filename, file.mimetype, buffer);
  }
}
