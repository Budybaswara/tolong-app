import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AssistanceStatus, JobApplicationStatus, Role, ReportStatus } from '@prisma/client';
import { AdminInternalGuard } from '../../core/auth/admin-internal.guard';
import {
  AssignReportDto,
  CreateArticleDto,
  CreateAssistanceProgramDto,
  CreateBannerDto,
  CreateCategoryDto,
  CreateEmergencyContactDto,
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
@UseGuards(AdminInternalGuard)
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

  @Get('audit-logs')
  auditLogs() {
    return this.admin.auditLogs();
  }

  @Get('emergency-contacts')
  emergencyContacts() {
    return this.admin.emergencyContacts();
  }

  @Get('categories')
  categories(@Query('module') module?: string) {
    return this.admin.categories(module);
  }

  @Post('categories')
  createCategory(@Body() body: CreateCategoryDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createCategory(body, { actorName: actor, ipAddress: ip });
  }

  @Post('bootstrap-defaults')
  bootstrapDefaults(@Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.bootstrapDefaults({ actorName: actor, ipAddress: ip });
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: UpdateRoleDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.updateUserRole(id, body.role, { actorName: actor, ipAddress: ip });
  }

  @Patch('reports/:id/status')
  updateReportStatus(@Param('id') id: string, @Body() body: UpdateReportStatusDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.updateReportStatus(id, body, { actorName: actor, ipAddress: ip });
  }

  @Patch('reports/:id/assign')
  assignReport(@Param('id') id: string, @Body() body: AssignReportDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.assignReport(id, body, { actorName: actor, ipAddress: ip });
  }

  @Post('assistance')
  createAssistance(@Body() body: CreateAssistanceProgramDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createAssistance(body, { actorName: actor, ipAddress: ip });
  }

  @Patch('assistance/applications/:id/status')
  updateAssistance(@Param('id') id: string, @Body('status') status: AssistanceStatus) {
    return this.admin.updateAssistanceStatus(id, status);
  }

  @Post('products')
  createProduct(@Body() body: CreateProductDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createProduct(body, { actorName: actor, ipAddress: ip });
  }

  @Post('jobs')
  createJob(@Body() body: CreateJobPostingDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createJob(body, { actorName: actor, ipAddress: ip });
  }

  @Patch('jobs/applications/:id/status')
  updateJobApplication(@Param('id') id: string, @Body('status') status: JobApplicationStatus) {
    return this.admin.updateJobApplicationStatus(id, status);
  }

  @Post('news')
  createArticle(@Body() body: CreateArticleDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createArticle(body, { actorName: actor, ipAddress: ip });
  }

  @Post('banners')
  createBanner(@Body() body: CreateBannerDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createBanner(body, { actorName: actor, ipAddress: ip });
  }

  @Patch('banners/:id/active')
  setBannerActive(@Param('id') id: string, @Body('active') active: boolean) {
    return this.admin.setBannerActive(id, active);
  }

  @Post('emergency-contacts')
  createEmergencyContact(@Body() body: CreateEmergencyContactDto, @Headers('x-admin-actor') actor?: string, @Headers('x-forwarded-for') ip?: string) {
    return this.admin.createEmergencyContact(body, { actorName: actor, ipAddress: ip });
  }
}
