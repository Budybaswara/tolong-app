import { AssistanceStatus, JobApplicationStatus, MediaType, Priority, ReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from 'class-validator';

export class UploadedMediaDto {
  @IsUrl()
  url!: string;

  @IsString()
  path!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;
}

export class CreateReportDto {
  @IsString()
  @MinLength(5)
  title!: string;

  @IsString()
  @MinLength(20)
  description!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedMediaDto)
  media?: UploadedMediaDto[];
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}

export class CreateEmergencyDto {
  @IsNumber()
  latitude!: number;

  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class ApplyAssistanceDto {
  @IsString()
  userId!: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

export class UpdateAssistanceStatusDto {
  @IsEnum(AssistanceStatus)
  status!: AssistanceStatus;
}

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IsString()
  whatsapp!: string;

  @IsString()
  sellerName!: string;

  @IsString()
  district!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedMediaDto)
  media?: UploadedMediaDto[];
}

export class ApplyJobDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverLetter?: string;
}

export class UpdateJobApplicationStatusDto {
  @IsEnum(JobApplicationStatus)
  status!: JobApplicationStatus;
}

export class CreateMembershipDto {
  @IsString()
  userId!: string;
}

export class CreateMediaAssetDto {
  @IsUrl()
  url!: string;

  @IsString()
  path!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  reportId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  articleId?: string;

  @IsOptional()
  @IsString()
  jobApplicationId?: string;
}

export class SendNotificationDto {
  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class CreateAssistanceProgramDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  requirements!: string[];

  @IsInt()
  @Min(1)
  quota!: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}

export class CreateArticleDto {
  @IsString()
  slug!: string;

  @IsString()
  title!: string;

  @IsString()
  excerpt!: string;

  @IsString()
  content!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UploadedMediaDto)
  media?: UploadedMediaDto[];
}

export class CreateBannerDto {
  @IsString()
  title!: string;

  @IsString()
  subtitle!: string;

  @IsUrl()
  imageUrl!: string;

  @IsString()
  ctaLabel!: string;

  @IsString()
  ctaUrl!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateCategoryDto {
  @IsString()
  module!: string;

  @IsString()
  name!: string;

  @IsString()
  icon!: string;

  @IsString()
  color!: string;
}

export class CreateJobPostingDto {
  @IsString()
  title!: string;

  @IsString()
  company!: string;

  @IsString()
  description!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsInt()
  salaryMin?: number;

  @IsOptional()
  @IsInt()
  salaryMax?: number;

  @IsString()
  @IsNotEmpty()
  type!: string;
}
