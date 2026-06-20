import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { StorageService } from './storage.service';

class SignedUploadDto {
  @IsIn(['reports', 'products', 'articles', 'jobs', 'profiles'])
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
}
