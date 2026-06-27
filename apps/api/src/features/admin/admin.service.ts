import { Injectable } from '@nestjs/common';
import { AssistanceStatus, JobApplicationStatus, Prisma, Role, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
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

type AdminActor = { actorName?: string; ipAddress?: string };

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

  auditLogs() {
    return this.prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { actor: true }
    });
  }

  emergencyContacts() {
    return this.prisma.emergencyContact.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    });
  }

  categories(module?: string) {
    return this.prisma.category.findMany({
      where: module ? { module } : undefined,
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });
  }

  async createCategory(body: CreateCategoryDto, actor?: AdminActor) {
    const id = `${body.module}-${body.name}`;
    const category = await this.prisma.category.upsert({
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
    await this.audit('CATEGORY_UPSERT', 'Category', category.id, body, actor);
    return category;
  }

  async bootstrapDefaults(actor?: AdminActor) {
    const defaults: CreateCategoryDto[] = [
      { module: 'REPORT', name: 'Infrastruktur Jalan dan Jembatan', icon: 'construction', color: '#b7000c' },
      { module: 'REPORT', name: 'Kesehatan', icon: 'local_hospital', color: '#004ed0' },
      { module: 'REPORT', name: 'Pendidikan', icon: 'school', color: '#16a34a' },
      { module: 'REPORT', name: 'Pertanian dan Perkebunan', icon: 'agriculture', color: '#15803d' },
      { module: 'REPORT', name: 'UMKM dan Ekonomi', icon: 'storefront', color: '#f97316' },
      { module: 'REPORT', name: 'Sosial dan Bantuan', icon: 'volunteer_activism', color: '#7c3aed' },
      { module: 'REPORT', name: 'Keamanan dan Ketertiban', icon: 'security', color: '#111827' },
      { module: 'REPORT', name: 'Lingkungan dan Sampah', icon: 'eco', color: '#0f766e' },
      { module: 'REPORT', name: 'Administrasi Publik', icon: 'assignment', color: '#004ed0' },
      { module: 'REPORT', name: 'Listrik Air dan Internet', icon: 'bolt', color: '#f59e0b' },
      { module: 'REPORT', name: 'Pemuda dan Olahraga', icon: 'sports_soccer', color: '#dc2626' },
      { module: 'REPORT', name: 'Perempuan dan Anak', icon: 'family_restroom', color: '#db2777' },
      { module: 'EMERGENCY', name: 'Ambulance', icon: 'ambulance', color: '#004ed0' },
      { module: 'EMERGENCY', name: 'Pemadam', icon: 'fire_truck', color: '#b7000c' },
      { module: 'EMERGENCY', name: 'Keamanan', icon: 'local_police', color: '#111827' },
      { module: 'EMERGENCY', name: 'Bencana', icon: 'flood', color: '#f97316' },
      { module: 'EMERGENCY', name: 'Kecelakaan', icon: 'car_crash', color: '#b7000c' },
      { module: 'EMERGENCY', name: 'Kesehatan Darurat', icon: 'emergency', color: '#004ed0' },
      { module: 'PRODUCT', name: 'Kuliner', icon: 'restaurant', color: '#e60012' },
      { module: 'PRODUCT', name: 'Kerajinan', icon: 'brush', color: '#004ed0' },
      { module: 'PRODUCT', name: 'Pertanian', icon: 'agriculture', color: '#15803d' },
      { module: 'PRODUCT', name: 'Fashion', icon: 'checkroom', color: '#db2777' },
      { module: 'PRODUCT', name: 'Jasa', icon: 'handyman', color: '#7c3aed' },
      { module: 'PRODUCT', name: 'Perikanan dan Peternakan', icon: 'set_meal', color: '#0f766e' },
      { module: 'NEWS', name: 'Ekonomi', icon: 'storefront', color: '#004ed0' },
      { module: 'NEWS', name: 'Kegiatan DPD', icon: 'campaign', color: '#b7000c' },
      { module: 'NEWS', name: 'Aspirasi Warga', icon: 'record_voice_over', color: '#16a34a' },
      { module: 'NEWS', name: 'Program Bantuan', icon: 'volunteer_activism', color: '#7c3aed' },
      { module: 'NEWS', name: 'UMKM', icon: 'storefront', color: '#f97316' },
      { module: 'NEWS', name: 'Lowongan', icon: 'work', color: '#004ed0' },
      { module: 'NEWS', name: 'Pengumuman', icon: 'campaign', color: '#111827' },
      { module: 'ASSISTANCE', name: 'Pendidikan', icon: 'school', color: '#004ed0' },
      { module: 'ASSISTANCE', name: 'UMKM', icon: 'storefront', color: '#b7000c' },
      { module: 'ASSISTANCE', name: 'Kesehatan', icon: 'local_hospital', color: '#16a34a' },
      { module: 'ASSISTANCE', name: 'Sosial', icon: 'diversity_3', color: '#7c3aed' },
      { module: 'ASSISTANCE', name: 'Pertanian', icon: 'agriculture', color: '#15803d' },
      { module: 'JOB', name: 'Administrasi', icon: 'work', color: '#004ed0' },
      { module: 'JOB', name: 'Lapangan', icon: 'engineering', color: '#b7000c' },
      { module: 'JOB', name: 'Kesehatan', icon: 'local_hospital', color: '#16a34a' },
      { module: 'JOB', name: 'Pendidikan', icon: 'school', color: '#7c3aed' },
      { module: 'JOB', name: 'UMKM', icon: 'storefront', color: '#f97316' }
    ];
    const categories = await Promise.all(defaults.map((item) => this.createCategory(item, actor)));
    await this.audit('BOOTSTRAP_DEFAULTS', 'System', 'categories', { count: categories.length }, actor);
    return { categories, count: categories.length };
  }

  async updateUserRole(id: string, role: Role, actor?: AdminActor) {
    const user = await this.prisma.user.update({ where: { id }, data: { role } });
    await this.audit('USER_ROLE_UPDATE', 'User', id, { role }, actor);
    return user;
  }

  async updateReportStatus(id: string, body: UpdateReportStatusDto, actor?: AdminActor) {
    const report = await this.prisma.report.update({
      where: { id },
      data: {
        status: body.status,
        resolvedAt: body.status === 'RESOLVED' ? new Date() : undefined,
        timeline: { create: { status: body.status, note: body.note ?? `Status diubah ke ${body.status}`, actorId: body.actorId } }
      },
      include: { category: true, user: true, assignedTo: true, timeline: true, media: true }
    });
    await this.audit('REPORT_STATUS_UPDATE', 'Report', id, body, actor);
    return report;
  }

  async assignReport(id: string, body: AssignReportDto, actor?: AdminActor) {
    const dueAt = body.dueAt ? new Date(body.dueAt) : this.defaultDueAt();
    const report = await this.prisma.report.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId,
        dueAt,
        status: 'IN_PROGRESS',
        timeline: {
          create: {
            status: 'IN_PROGRESS',
            note: body.note ?? 'Laporan ditugaskan ke operator.'
          }
        }
      },
      include: { category: true, user: true, assignedTo: true, timeline: true, media: true }
    });
    await this.audit('REPORT_ASSIGN', 'Report', id, body, actor);
    return report;
  }

  async createAssistance(body: CreateAssistanceProgramDto, actor?: AdminActor) {
    const assistance = await this.prisma.assistanceProgram.create({ data: body, include: { category: true } });
    await this.audit('ASSISTANCE_CREATE', 'AssistanceProgram', assistance.id, body, actor);
    return assistance;
  }

  updateAssistanceStatus(id: string, status: AssistanceStatus) {
    return this.prisma.assistanceApplication.update({ where: { id }, data: { status }, include: { program: true, user: true } });
  }

  async createProduct(body: CreateProductDto, actor?: AdminActor) {
    const { media, ...product } = body;
    const created = await this.prisma.product.create({
      data: {
        ...product,
        media: media?.length ? { create: media } : undefined
      },
      include: { category: true, media: true }
    });
    await this.audit('PRODUCT_CREATE', 'Product', created.id, { ...product, mediaCount: media?.length ?? 0 }, actor);
    return created;
  }

  async createJob(body: CreateJobPostingDto, actor?: AdminActor) {
    const job = await this.prisma.jobPosting.create({ data: body });
    await this.audit('JOB_CREATE', 'JobPosting', job.id, body, actor);
    return job;
  }

  updateJobApplicationStatus(id: string, status: JobApplicationStatus) {
    return this.prisma.jobApplication.update({ where: { id }, data: { status }, include: { job: true, user: true } });
  }

  async createArticle(body: CreateArticleDto, actor?: AdminActor) {
    const { media, ...article } = body;
    const created = await this.prisma.article.create({
      data: {
        ...article,
        publishedAt: new Date(),
        media: media?.length ? { create: media } : undefined
      },
      include: { category: true, media: true }
    });
    await this.audit('ARTICLE_CREATE', 'Article', created.id, { slug: created.slug, mediaCount: media?.length ?? 0 }, actor);
    return created;
  }

  async createBanner(body: CreateBannerDto, actor?: AdminActor) {
    const banner = await this.prisma.banner.create({ data: body });
    await this.audit('BANNER_CREATE', 'Banner', banner.id, body, actor);
    return banner;
  }

  setBannerActive(id: string, active: boolean) {
    return this.prisma.banner.update({ where: { id }, data: { active } });
  }

  async createEmergencyContact(body: CreateEmergencyContactDto, actor?: AdminActor) {
    const contact = await this.prisma.emergencyContact.create({ data: body });
    await this.audit('EMERGENCY_CONTACT_CREATE', 'EmergencyContact', contact.id, body, actor);
    return contact;
  }

  private defaultDueAt() {
    const value = new Date();
    value.setHours(value.getHours() + 72);
    return value;
  }

  private audit(action: string, entity: string, entityId?: string, metadata?: unknown, actor?: AdminActor) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        actorName: actor?.actorName ?? 'Admin Dashboard',
        ipAddress: actor?.ipAddress,
        metadata: metadata === undefined ? undefined : (JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue)
      }
    });
  }
}
