import { Injectable, NotFoundException } from '@nestjs/common';
import { AssistanceStatus, JobApplicationStatus, NotificationType, Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  ApplyAssistanceDto,
  ApplyJobDto,
  CreateEmergencyDto,
  CreateMediaAssetDto,
  CreateReportDto,
  SendNotificationDto,
  UpdateReportStatusDto
} from './dto';

@Injectable()
export class CivicService {
  constructor(private prisma: PrismaService) {}

  async home() {
    const [banners, reportsProcessed, emergencyOpen, assistanceApproved, activeUmkm, news, categories] =
      await Promise.all([
        this.prisma.banner.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } }),
        this.prisma.report.count({ where: { status: { in: ['VERIFIED', 'IN_PROGRESS', 'RESOLVED'] } } }),
        this.prisma.emergencyRequest.count({ where: { status: { in: ['SUBMITTED', 'VERIFIED', 'IN_PROGRESS'] } } }),
        this.prisma.assistanceApplication.count({ where: { status: { in: ['APPROVED', 'DISBURSED'] } } }),
        this.prisma.product.count({ where: { isPublished: true } }),
        this.prisma.article.findMany({
          take: 4,
          where: { publishedAt: { not: null } },
          orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
          include: { category: true, media: true }
        }),
        this.prisma.category.findMany({ orderBy: { module: 'asc' } })
      ]);

    return {
      banners,
      statistics: {
        reportsProcessed,
        emergencyOpen,
        assistanceApproved,
        activeUmkm
      },
      quickActions: [
        { label: 'Darurat', route: '/sos', icon: 'sos' },
        { label: 'Aspirasi', route: '/aspirasi', icon: 'campaign' },
        { label: 'AI Tolong', route: '/ai', icon: 'smart_toy' },
        { label: 'Bantuan', route: '/assistance', icon: 'volunteer_activism' },
        { label: 'UMKM', route: '/market', icon: 'storefront' },
        { label: 'Kerja', route: '/jobs', icon: 'work' },
        { label: 'Berita', route: '/news', icon: 'article' },
        { label: 'Peta', route: '/map', icon: 'map' }
      ],
      news,
      categories
    };
  }

  categories(module?: string) {
    return this.prisma.category.findMany({
      where: module ? { module } : undefined,
      orderBy: [{ module: 'asc' }, { name: 'asc' }]
    });
  }

  reports(filter: { status?: ReportStatus; district?: string }) {
    return this.prisma.report.findMany({
      where: { status: filter.status, district: filter.district },
      include: { category: true, media: true, timeline: { orderBy: { createdAt: 'asc' } }, user: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createReport(body: CreateReportDto) {
    const userId = body.userId ?? (await this.ensureGuestUser()).id;
    const { media, ...report } = body;
    return this.prisma.report.create({
      data: {
        code: this.code('MSJ'),
        title: report.title,
        description: report.description,
        status: 'SUBMITTED',
        priority: report.priority ?? 'MEDIUM',
        district: report.district,
        village: report.village,
        latitude: report.latitude,
        longitude: report.longitude,
        address: report.address,
        userId,
        categoryId: report.categoryId,
        timeline: { create: { status: 'SUBMITTED', note: 'Aspirasi diterima oleh sistem TOLONG' } },
        media: media?.length ? { create: media } : undefined
      },
      include: { category: true, timeline: true, media: true }
    });
  }

  async updateReportStatus(id: string, body: UpdateReportStatusDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Laporan tidak ditemukan');
    return this.prisma.report.update({
      where: { id },
      data: {
        status: body.status,
        timeline: {
          create: {
            status: body.status,
            note: body.note ?? this.statusLabel(body.status),
            actorId: body.actorId
          }
        }
      },
      include: { category: true, timeline: true, media: true, user: true }
    });
  }

  createMediaAsset(body: CreateMediaAssetDto) {
    return this.prisma.mediaAsset.create({ data: body });
  }

  emergencies(status?: ReportStatus) {
    return this.prisma.emergencyRequest.findMany({
      where: { status },
      include: { category: true, user: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createEmergency(body: CreateEmergencyDto) {
    const emergency = await this.prisma.emergencyRequest.create({
      data: {
        code: this.code('SOS'),
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        userId: body.userId,
        categoryId: body.categoryId
      },
      include: { category: true, user: true }
    });
    await this.createNotification({
      title: `SOS ${emergency.code}`,
      body: `Permintaan darurat baru di ${emergency.address ?? 'lokasi GPS terkirim'}.`
    });
    return emergency;
  }

  updateEmergencyStatus(id: string, status: ReportStatus) {
    return this.prisma.emergencyRequest.update({ where: { id }, data: { status }, include: { category: true } });
  }

  assistance() {
    return this.prisma.assistanceProgram.findMany({
      where: { isOpen: true },
      include: { category: true, applications: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  applyAssistance(programId: string, body: ApplyAssistanceDto) {
    return this.prisma.assistanceApplication.create({
      data: { programId, userId: body.userId, payload: body.payload as Prisma.InputJsonValue },
      include: { program: true, user: true }
    });
  }

  updateAssistanceStatus(id: string, status: AssistanceStatus) {
    return this.prisma.assistanceApplication.update({ where: { id }, data: { status }, include: { program: true } });
  }

  products(filter: { q?: string; categoryId?: string }) {
    return this.prisma.product.findMany({
      where: {
        isPublished: true,
        categoryId: filter.categoryId,
        OR: filter.q
          ? [
              { name: { contains: filter.q, mode: 'insensitive' } },
              { description: { contains: filter.q, mode: 'insensitive' } },
              { sellerName: { contains: filter.q, mode: 'insensitive' } }
            ]
          : undefined
      },
      include: { category: true, media: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  jobs() {
    return this.prisma.jobPosting.findMany({
      where: { isPublished: true },
      include: { applications: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  applyJob(jobId: string, body: ApplyJobDto) {
    return this.prisma.jobApplication.create({
      data: { jobId, userId: body.userId, coverLetter: body.coverLetter },
      include: { job: true, user: true, cvAssets: true }
    });
  }

  updateJobApplicationStatus(id: string, status: JobApplicationStatus) {
    return this.prisma.jobApplication.update({ where: { id }, data: { status }, include: { job: true, user: true } });
  }

  news(featuredOnly = false) {
    return this.prisma.article.findMany({
      where: { publishedAt: { not: null }, featured: featuredOnly ? true : undefined },
      include: { category: true, media: true },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }]
    });
  }

  mapReports(filter: { categoryId?: string; status?: ReportStatus }) {
    return this.prisma.report.findMany({
      where: {
        categoryId: filter.categoryId,
        status: filter.status,
        latitude: { not: null },
        longitude: { not: null }
      },
      select: {
        id: true,
        code: true,
        title: true,
        status: true,
        priority: true,
        district: true,
        village: true,
        latitude: true,
        longitude: true,
        category: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createMembership(userId: string) {
    const existing = await this.prisma.membershipCard.findUnique({ where: { userId } });
    if (existing) return existing;
    const memberNo = `PSI-MSJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    return this.prisma.membershipCard.create({
      data: {
        userId,
        memberNo,
        qrPayload: JSON.stringify({ memberNo, issuer: 'DPD PSI Mesuji Lampung' })
      },
      include: { user: true }
    });
  }

  verifyMembership(memberNo: string) {
    return this.prisma.membershipCard.findUniqueOrThrow({ where: { memberNo }, include: { user: true } });
  }

  notifications(userId?: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  createNotification(body: SendNotificationDto) {
    return this.prisma.notification.create({
      data: {
        type: NotificationType.SYSTEM,
        title: body.title,
        body: body.body,
        userId: body.userId
      }
    });
  }

  private async ensureGuestUser() {
    return this.prisma.user.upsert({
      where: { email: 'guest@tolong.local' },
      update: {},
      create: { email: 'guest@tolong.local', displayName: 'Tamu TOLONG', role: 'GUEST' }
    });
  }

  private code(prefix: string) {
    return `${prefix}-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
  }

  private statusLabel(status: ReportStatus) {
    const labels: Record<ReportStatus, string> = {
      SUBMITTED: 'Laporan diterima',
      VERIFIED: 'Laporan diverifikasi operator',
      IN_PROGRESS: 'Laporan sedang ditindaklanjuti',
      RESOLVED: 'Laporan selesai',
      REJECTED: 'Laporan ditolak'
    };
    return labels[status];
  }
}
