import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { CivicService } from './civic.service';
import {
  ApplyAssistanceDto,
  ApplyJobDto,
  CreateEmergencyDto,
  CreateMediaAssetDto,
  CreateMembershipDto,
  CreateReportDto,
  SendNotificationDto,
  UpdateAssistanceStatusDto,
  UpdateJobApplicationStatusDto,
  UpdateReportStatusDto
} from './dto';

@ApiTags('Civic')
@Controller()
export class CivicController {
  constructor(private civic: CivicService) {}

  @Get('home')
  home() {
    return this.civic.home();
  }

  @Get('categories')
  categories(@Query('module') module?: string) {
    return this.civic.categories(module);
  }

  @Get('reports')
  reports(@Query('status') status?: ReportStatus, @Query('district') district?: string) {
    return this.civic.reports({ status, district });
  }

  @Post('reports')
  createReport(@Body() body: CreateReportDto) {
    return this.civic.createReport(body);
  }

  @Patch('reports/:id/status')
  updateReportStatus(@Param('id') id: string, @Body() body: UpdateReportStatusDto) {
    return this.civic.updateReportStatus(id, body);
  }

  @Post('media-assets')
  createMedia(@Body() body: CreateMediaAssetDto) {
    return this.civic.createMediaAsset(body);
  }

  @Get('emergencies')
  emergencies(@Query('status') status?: ReportStatus) {
    return this.civic.emergencies(status);
  }

  @Get('emergency-contacts')
  emergencyContacts() {
    return this.civic.emergencyContacts();
  }

  @Post('emergencies')
  emergency(@Body() body: CreateEmergencyDto) {
    return this.civic.createEmergency(body);
  }

  @Patch('emergencies/:id/status')
  updateEmergencyStatus(@Param('id') id: string, @Body() body: UpdateReportStatusDto) {
    return this.civic.updateEmergencyStatus(id, body.status);
  }

  @Get('assistance')
  assistance() {
    return this.civic.assistance();
  }

  @Post('assistance/:id/apply')
  apply(@Param('id') id: string, @Body() body: ApplyAssistanceDto) {
    return this.civic.applyAssistance(id, body);
  }

  @Patch('assistance/applications/:id/status')
  updateAssistanceStatus(@Param('id') id: string, @Body() body: UpdateAssistanceStatusDto) {
    return this.civic.updateAssistanceStatus(id, body.status);
  }

  @Get('products')
  products(@Query('q') q?: string, @Query('categoryId') categoryId?: string) {
    return this.civic.products({ q, categoryId });
  }

  @Get('jobs')
  jobs() {
    return this.civic.jobs();
  }

  @Post('jobs/:id/apply')
  applyJob(@Param('id') id: string, @Body() body: ApplyJobDto) {
    return this.civic.applyJob(id, body);
  }

  @Patch('jobs/applications/:id/status')
  updateJobApplicationStatus(@Param('id') id: string, @Body() body: UpdateJobApplicationStatusDto) {
    return this.civic.updateJobApplicationStatus(id, body.status);
  }

  @Get('news')
  news(@Query('featured') featured?: string) {
    return this.civic.news(featured === 'true');
  }

  @Get('news/:slug')
  article(@Param('slug') slug: string) {
    return this.civic.article(slug);
  }

  @Get('map/live-reports')
  map(@Query('categoryId') categoryId?: string, @Query('status') status?: ReportStatus) {
    return this.civic.mapReports({ categoryId, status });
  }

  @Post('membership')
  createMembership(@Body() body: CreateMembershipDto) {
    return this.civic.createMembership(body.userId);
  }

  @Get('membership/verify/:memberNo')
  verifyMembership(@Param('memberNo') memberNo: string) {
    return this.civic.verifyMembership(memberNo);
  }

  @Get('notifications')
  notifications(@Query('userId') userId?: string) {
    return this.civic.notifications(userId);
  }

  @Post('notifications')
  sendNotification(@Body() body: SendNotificationDto) {
    return this.civic.createNotification(body);
  }
}
