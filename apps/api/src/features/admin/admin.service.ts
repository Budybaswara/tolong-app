import { Injectable } from '@nestjs/common';
import { AssistanceStatus, JobApplicationStatus, Prisma, Role, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  CreateArticleDto,
  CreateAssistanceProgramDto,
  CreateBannerDto,
  CreateCategoryDto,
  CreateJobPostingDto,
  CreateProductDto,
  UpdateReportStatusDto
} from '../civic/dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async analytics() {
    const [
      reports,
      activeUsers,
      assistance,
      products,
      reportsPerDistrictRaw,
      reportsByCategoryRaw,
      assistanceApplications,
      emergencyOpen,
      activeJobs
    ] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.user.count({ where: { role: { in: ['CITIZEN', 'GUEST'] } } }),
      this.prisma.assistanceApplication.count(),
      this.prisma.product.count({ where: { isPublished: true } }),
      this.prisma.report.groupBy({ by: ['district'], _count: { _all: true }, orderBy: { _count: { district: 'desc' } } }),
      this.prisma.report.groupBy({ by: ['categoryId'], _count: { _all: true }, orderBy: { _count: { categoryId: 'desc' } }, take: 8 }),
      this.prisma.assistanceApplication.findMany({ include: { program: { include: { category: true } } } }),
      this.prisma.emergencyRequest.count({ where: { status: { in: ['SUBMITTED', 'VERIFIED', 'IN_PROGRESS'] } } }),
      this.prisma.jobPosting.count({ where: { isPublished: true } })
    ]);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: reportsByCategoryRaw.map((item) => item.categoryId) } }
    });
    const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
    const assistanceDistribution = new Map<string, number>();
    for (const application of assistanceApplications) {
      const label = application.program.category.name;
      assistanceDistribution.set(label, (assistanceDistribution.get(label) ?? 0) + 1);
    }

    return {
      summary: { reports, activeUsers, assistance, products, emergencyOpen, activeJobs },
      reportsPerDistrict: reportsPerDistrictRaw.map((item) => ({
        district: item.district,
        count: item._count._all
      })),
      commonIssues: reportsByCategoryRaw.map((item) => ({
        name: categoryNameById.get(item.categoryId) ?? item.categoryId,
        count: item._count._all
      })),
      assistanceDistribution: [...assistanceDistribution.entries()].map(([name, value]) => ({ name, value })),
      generatedAt: new Date().toISOString()
    };
  }

  queue(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: { status },
      take: 50,
      include: { category: true, user: true, media: true, timeline: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  users(filter: { q?: string; role?: Role }) {
    const search = filter.q?.trim();
    return this.prisma.user.findMany({
      where: {
        role: filter.role,
        OR: search
          ? [
              { displayName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { district: { contains: search, mode: 'insensitive' } },
              { village: { contains: search, mode: 'insensitive' } }
            ]
          : undefined
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  categories(module?: string) {
    return this.prisma.category.findMany({
      where: module ? { module } : undefined,
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });
  }

  createCategory(body: CreateCategoryDto) {
    const id = `${body.module}-${body.name}`;
    return this.prisma.category.upsert({
      where: { id },
      update: {
        module: body.module,
        name: body.name,
        icon: body.icon,
        color: body.color
      },
      create: {
        id,
        module: body.module,
        name: body.name,
        icon: body.icon,
        color: body.color
      }
    });
  }

  async bootstrapDefaults() {
    const defaults: CreateCategoryDto[] = [
      { module: 'REPORT', name: 'Infrastruktur', icon: 'construction', color: '#b7000c' },
      { module: 'REPORT', name: 'Kesehatan', icon: 'local_hospital', color: '#004ed0' },
      { module: 'EMERGENCY', name: 'Ambulance', icon: 'ambulance', color: '#004ed0' },
      { module: 'EMERGENCY', name: 'Pemadam', icon: 'fire_truck', color: '#b7000c' },
      { module: 'PRODUCT', name: 'Kuliner', icon: 'restaurant', color: '#e60012' },
      { module: 'PRODUCT', name: 'Kerajinan', icon: 'brush', color: '#004ed0' },
      { module: 'NEWS', name: 'Ekonomi', icon: 'storefront', color: '#004ed0' },
      { module: 'NEWS', name: 'Kegiatan DPD', icon: 'campaign', color: '#b7000c' },
      { module: 'ASSISTANCE', name: 'Pendidikan', icon: 'school', color: '#004ed0' },
      { module: 'ASSISTANCE', name: 'UMKM', icon: 'storefront', color: '#b7000c' },
      { module: 'JOB', name: 'Administrasi', icon: 'work', color: '#004ed0' }
    ];
    const categories = await Promise.all(defaults.map((item) => this.createCategory(item)));
    return { categories, count: categories.length };
  }

  updateUserRole(id: string, role: Role) {
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  updateReportStatus(id: string, body: UpdateReportStatusDto) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: body.status,
        timeline: { create: { status: body.status, note: body.note ?? `Status diubah ke ${body.status}` } }
      },
      include: { category: true, user: true, timeline: true }
    });
  }

  createAssistance(body: CreateAssistanceProgramDto) {
    return this.prisma.assistanceProgram.create({ data: body, include: { category: true } });
  }

  updateAssistanceStatus(id: string, status: AssistanceStatus) {
    return this.prisma.assistanceApplication.update({ where: { id }, data: { status }, include: { program: true, user: true } });
  }

  createProduct(body: CreateProductDto) {
    return this.prisma.product.create({ data: body, include: { category: true } });
  }

  createJob(body: CreateJobPostingDto) {
    return this.prisma.jobPosting.create({ data: body });
  }

  updateJobApplicationStatus(id: string, status: JobApplicationStatus) {
    return this.prisma.jobApplication.update({ where: { id }, data: { status }, include: { job: true, user: true } });
  }

  createArticle(body: CreateArticleDto) {
    return this.prisma.article.create({
      data: { ...body, publishedAt: new Date() },
      include: { category: true }
    });
  }

  createBanner(body: CreateBannerDto) {
    return this.prisma.banner.create({ data: body });
  }

  setBannerActive(id: string, active: boolean) {
    return this.prisma.banner.update({ where: { id }, data: { active } });
  }
}
