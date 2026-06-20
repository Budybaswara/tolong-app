import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssistanceStatus, JobApplicationStatus, Role, ReportStatus } from '@prisma/client';
import {
  CreateArticleDto,
  CreateAssistanceProgramDto,
  CreateBannerDto,
  CreateJobPostingDto,
  CreateProductDto,
  UpdateReportStatusDto
} from '../civic/dto';
import { AdminService } from './admin.service';

class UpdateRoleDto {
  role!: Role;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }

  @Get('queue')
  queue(@Query('status') status?: ReportStatus) {
    return this.admin.queue(status);
  }

  @Get('users')
  users(@Query('q') q?: string, @Query('role') role?: Role) {
    return this.admin.users({ q, role });
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return this.admin.updateUserRole(id, body.role);
  }

  @Patch('reports/:id/status')
  updateReportStatus(@Param('id') id: string, @Body() body: UpdateReportStatusDto) {
    return this.admin.updateReportStatus(id, body);
  }

  @Post('assistance')
  createAssistance(@Body() body: CreateAssistanceProgramDto) {
    return this.admin.createAssistance(body);
  }

  @Patch('assistance/applications/:id/status')
  updateAssistance(@Param('id') id: string, @Body('status') status: AssistanceStatus) {
    return this.admin.updateAssistanceStatus(id, status);
  }

  @Post('products')
  createProduct(@Body() body: CreateProductDto) {
    return this.admin.createProduct(body);
  }

  @Post('jobs')
  createJob(@Body() body: CreateJobPostingDto) {
    return this.admin.createJob(body);
  }

  @Patch('jobs/applications/:id/status')
  updateJobApplication(@Param('id') id: string, @Body('status') status: JobApplicationStatus) {
    return this.admin.updateJobApplicationStatus(id, status);
  }

  @Post('news')
  createArticle(@Body() body: CreateArticleDto) {
    return this.admin.createArticle(body);
  }

  @Post('banners')
  createBanner(@Body() body: CreateBannerDto) {
    return this.admin.createBanner(body);
  }

  @Patch('banners/:id/active')
  setBannerActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.admin.setBannerActive(id, active);
  }
}
