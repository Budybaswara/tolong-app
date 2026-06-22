'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  HandHeart,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPinned,
  Megaphone,
  Newspaper,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UploadCloud,
  Users,
  Video,
  X
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type Analytics = {
  summary: {
    reports: number;
    activeUsers: number;
    assistance: number;
    products: number;
    emergencyOpen: number;
    activeJobs: number;
  };
  reportsPerDistrict: Array<{ district: string; count: number }>;
  commonIssues: Array<{ name: string; count: number }>;
  assistanceDistribution: Array<{ name: string; value: number }>;
  generatedAt: string;
};

type Category = { id: string; module: string; name: string; icon: string; color: string };
type Role = 'SUPER_ADMIN' | 'KETUA_DPD' | 'OPERATOR' | 'DPRD_MEMBER' | 'CITIZEN' | 'GUEST';
type SectionId = 'dashboard' | 'reports' | 'assistance' | 'publishing' | 'umkm' | 'jobs' | 'users' | 'security';
type ReportStatus = 'ALL' | 'SUBMITTED' | 'VERIFIED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type ReportQueueItem = {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: Exclude<ReportStatus, 'ALL'>;
  priority: string;
  district: string;
  village?: string;
  createdAt: string;
  category: { name: string; color: string };
  user: { displayName: string };
};

type UserItem = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  role: Role;
  district?: string;
  village?: string;
};

type NavItem = { id: SectionId; label: string; icon: LucideIcon };
type UploadedMedia = {
  url: string;
  path: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  mimeType: string;
  sizeBytes: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://dokploy.closeclaw.site/tolong-api/v1';
const adminApiBase = '/api/admin';
const statusFilters: ReportStatus[] = ['ALL', 'SUBMITTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const mutableStatuses: Array<Exclude<ReportStatus, 'ALL'>> = ['SUBMITTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const roles: Role[] = ['SUPER_ADMIN', 'KETUA_DPD', 'OPERATOR', 'DPRD_MEMBER', 'CITIZEN', 'GUEST'];
const palette = ['#b7000c', '#004ed0', '#16a34a', '#f97316', '#7c3aed', '#0f766e'];
const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
  { id: 'assistance', label: 'Bantuan', icon: HandHeart },
  { id: 'publishing', label: 'Publikasi', icon: Newspaper },
  { id: 'umkm', label: 'UMKM', icon: Store },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'security', label: 'Security', icon: ShieldCheck }
];

const modules: Array<{ section: SectionId; label: string; icon: ReactNode; body: string }> = [
  { section: 'reports', label: 'Manage Reports', icon: <ClipboardList size={20} />, body: 'Triase aspirasi, status, dan timeline.' },
  { section: 'assistance', label: 'Assistance Approval', icon: <HandHeart size={20} />, body: 'Buat program dan pantau bantuan.' },
  { section: 'publishing', label: 'News & Banners', icon: <Newspaper size={20} />, body: 'Posting banner, berita, dan broadcast.' },
  { section: 'jobs', label: 'Job Board', icon: <Briefcase size={20} />, body: 'Lowongan, CV, dan status lamaran.' },
  { section: 'users', label: 'Users & Roles', icon: <Users size={20} />, body: 'Kelola role dan wilayah pengguna.' },
  { section: 'publishing', label: 'Banners', icon: <ImageIcon size={20} />, body: 'Kontrol banner dinamis aplikasi.' },
  { section: 'umkm', label: 'UMKM', icon: <Store size={20} />, body: 'Produk, kategori, dan WhatsApp order.' },
  { section: 'reports', label: 'Map Reports', icon: <MapPinned size={20} />, body: 'Pantau marker laporan live.' },
  { section: 'security', label: 'Security', icon: <ShieldCheck size={20} />, body: 'Cek auth, token, dan env admin.' },
  { section: 'publishing', label: 'Broadcast', icon: <Bell size={20} />, body: 'Kirim notifikasi in-app dan FCM.' }
];

const initialForms = {
  banner: {
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaLabel: 'Buka',
    ctaUrl: '/news',
    sortOrder: '1'
  },
  news: {
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    authorName: 'Admin TOLONG',
    sourceName: 'DPD PSI Mesuji',
    sourceUrl: '',
    categoryId: '',
    featured: true,
    media: [] as UploadedMedia[]
  },
  product: {
    name: '',
    description: '',
    price: '',
    whatsapp: '',
    sellerName: '',
    district: 'Mesuji',
    categoryId: '',
    media: [] as UploadedMedia[]
  },
  job: {
    title: '',
    company: '',
    description: '',
    location: 'Mesuji',
    salaryMin: '',
    salaryMax: '',
    type: 'FULL_TIME'
  },
  assistance: {
    title: '',
    description: '',
    requirements: 'KTP Mesuji\nNomor WhatsApp aktif',
    quota: '50',
    categoryId: '',
    isOpen: true
  },
  notification: {
    title: '',
    body: ''
  }
};

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [queue, setQueue] = useState<ReportQueueItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<ReportStatus>('ALL');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [selectedReport, setSelectedReport] = useState<ReportQueueItem | null>(null);
  const [nextStatus, setNextStatus] = useState<Exclude<ReportStatus, 'ALL'>>('VERIFIED');
  const [statusNote, setStatusNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [forms, setForms] = useState(initialForms);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const queueUrl = status === 'ALL' ? `${adminApiBase}/queue` : `${adminApiBase}/queue?status=${status}`;
      const responses = await Promise.all([
        fetch(`${adminApiBase}/analytics`, { cache: 'no-store' }),
        fetch(queueUrl, { cache: 'no-store' }),
        fetch(`${adminApiBase}/categories`, { cache: 'no-store' }),
        fetch(`${adminApiBase}/users`, { cache: 'no-store' })
      ]);
      if (!responses[0].ok || !responses[1].ok) throw new Error('API admin belum merespons dengan sukses');
      const [analyticsJson, queueJson, categoryJson, usersJson] = await Promise.all(responses.map((response) => response.json()));
      setAnalytics(analyticsJson as Analytics);
      setQueue(queueJson as ReportQueueItem[]);
      setCategories(Array.isArray(categoryJson) ? (categoryJson as Category[]) : []);
      setUsers(Array.isArray(usersJson) ? (usersJson as UserItem[]) : []);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data admin');
      setState('error');
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredQueue = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return queue;
    return queue.filter((item) =>
      [item.code, item.title, item.district, item.village, item.category.name, item.user.displayName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [queue, query]);
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((item) =>
      [item.displayName, item.email, item.phone, item.role, item.district, item.village]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [users, query]);
  const recommendations = useMemo(() => buildRecommendations(analytics, queue, categories), [analytics, queue, categories]);

  function updateForm<T extends keyof typeof initialForms>(name: T, patch: Partial<(typeof initialForms)[T]>) {
    setForms((current) => ({ ...current, [name]: { ...current[name], ...patch } }));
  }

  function categoryOptions(module: string) {
    return categories.filter((category) => category.module === module);
  }

  function openStatusPanel(report: ReportQueueItem) {
    setSelectedReport(report);
    setNextStatus(report.status);
    setStatusNote(defaultStatusNote(report.status));
  }

  async function requestJson(path: string, method: 'POST' | 'PATCH', body: unknown) {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload?.message;
      throw new Error(Array.isArray(message) ? message.join(', ') : message ?? 'Request gagal diproses');
    }
    return payload;
  }

  async function uploadMedia(target: 'banner' | 'news' | 'product', folder: 'banners' | 'articles' | 'products', file: File) {
    setUploading((current) => ({ ...current, [target]: true }));
    setError(null);
    try {
      const formData = new FormData();
      formData.append('folder', folder);
      formData.append('file', file);
      const response = await fetch(`${adminApiBase}/upload`, {
        method: 'POST',
        body: formData
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.message;
        throw new Error(Array.isArray(message) ? message.join(', ') : message ?? 'Upload file gagal');
      }
      const media: UploadedMedia = {
        url: payload.publicUrl,
        path: payload.path,
        type: file.type.startsWith('video/') ? 'VIDEO' : file.type === 'application/pdf' ? 'DOCUMENT' : 'IMAGE',
        mimeType: payload.contentType ?? file.type,
        sizeBytes: payload.sizeBytes ?? file.size
      };
      if (target === 'banner') {
        updateForm('banner', { imageUrl: payload.publicUrl });
      } else if (target === 'news') {
        updateForm('news', { media: [media] });
      } else {
        updateForm('product', { media: [media] });
      }
      setNotice(`File ${file.name} berhasil diunggah.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload file gagal');
      setState('error');
    } finally {
      setUploading((current) => ({ ...current, [target]: false }));
    }
  }

  async function bootstrapDefaults() {
    setSaving(true);
    try {
      const payload = await requestJson(`${adminApiBase}/bootstrap-defaults`, 'POST', {});
      setNotice(`Kategori dasar siap: ${payload.count ?? 0} kategori.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyiapkan kategori dasar');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function updateReportStatus() {
    if (!selectedReport) return;
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/reports/${selectedReport.id}/status`, 'PATCH', {
        status: nextStatus,
        note: statusNote.trim() || defaultStatusNote(nextStatus)
      });
      setNotice(`Status ${selectedReport.code} diperbarui ke ${formatStatus(nextStatus)}.`);
      setSelectedReport(null);
      setStatusNote('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan status laporan');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function publishBanner() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/banners`, 'POST', {
        ...forms.banner,
        sortOrder: Number(forms.banner.sortOrder || 0)
      });
      setForms((current) => ({ ...current, banner: initialForms.banner }));
      setNotice('Banner berhasil diposting ke aplikasi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memposting banner');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function publishNews() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/news`, 'POST', {
        ...forms.news,
        authorName: forms.news.authorName.trim() || undefined,
        sourceName: forms.news.sourceName.trim() || undefined,
        sourceUrl: forms.news.sourceUrl.trim() || undefined
      });
      setForms((current) => ({ ...current, news: initialForms.news }));
      setNotice('Berita berhasil dipublikasikan ke aplikasi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memposting berita');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function publishProduct() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/products`, 'POST', {
        ...forms.product,
        price: Number(forms.product.price || 0)
      });
      setForms((current) => ({ ...current, product: initialForms.product }));
      setNotice('Produk UMKM berhasil diposting ke aplikasi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memposting produk');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function publishJob() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/jobs`, 'POST', {
        ...forms.job,
        salaryMin: forms.job.salaryMin ? Number(forms.job.salaryMin) : undefined,
        salaryMax: forms.job.salaryMax ? Number(forms.job.salaryMax) : undefined
      });
      setForms((current) => ({ ...current, job: initialForms.job }));
      setNotice('Lowongan kerja berhasil diposting ke aplikasi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memposting lowongan');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function publishAssistance() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/assistance`, 'POST', {
        ...forms.assistance,
        quota: Number(forms.assistance.quota || 1),
        requirements: forms.assistance.requirements.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      setForms((current) => ({ ...current, assistance: initialForms.assistance }));
      setNotice('Program bantuan berhasil diposting ke aplikasi.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memposting program bantuan');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function sendNotification() {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/notifications`, 'POST', forms.notification);
      setForms((current) => ({ ...current, notification: initialForms.notification }));
      setNotice('Notifikasi in-app berhasil dikirim.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim notifikasi');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function updateUserRole(user: UserItem, role: Role) {
    setSaving(true);
    try {
      await requestJson(`${adminApiBase}/users/${user.id}/role`, 'PATCH', { role });
      setNotice(`Role ${user.displayName} diubah ke ${formatRole(role)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah role user');
      setState('error');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark logo-mark">
            <Image src="/tolong.png" alt="Logo TOLONG" width={44} height={44} priority />
          </div>
          <div>
            <b>TOLONG</b>
            <span>DPD PSI Mesuji</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Admin navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeSection === id ? 'nav-item active' : 'nav-item'} onClick={() => setActiveSection(id)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={18} />
          <span>Password admin dikelola lewat environment Dokploy.</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin Panel</p>
            <h1>{sectionTitle(activeSection)}</h1>
          </div>
          <div className="topbar-actions">
            <label className="searchbox">
              <Search size={18} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode, wilayah, warga..." />
            </label>
            <button className="icon-button" aria-label="Refresh dashboard" onClick={() => void load()}>
              {state === 'loading' ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            </button>
            <button className="icon-button" aria-label="Notifications" onClick={() => setActiveSection('publishing')}>
              <Bell size={18} />
              <span className="dot" />
            </button>
            <button className="icon-button" aria-label="Logout admin" onClick={() => void logout()}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="hero-panel">
          <div>
            <p className="eyebrow">Live API</p>
            <h2>Operasional TOLONG dalam satu server Dokploy</h2>
            <p>Kelola laporan, banner, berita, bantuan, UMKM, lowongan, pengguna, dan notifikasi dari satu dashboard.</p>
          </div>
          <div className="hero-meta">
            <span>{analytics ? `Updated ${formatDate(analytics.generatedAt)}` : 'Menunggu API'}</span>
            <span>{apiBase.replace('https://', '')}</span>
          </div>
        </section>

        {notice && <PanelState title="Berhasil" body={notice} />}
        {state === 'loading' && <PanelState title="Memuat dashboard" body="Mengambil analytics, kategori, user, dan queue laporan dari TOLONG API." />}
        {state === 'error' && (
          <PanelState
            tone="danger"
            title="API admin belum siap"
            body={`${error}. Periksa backend Docker, env API_BASE_URL, migration, atau kategori dasar.`}
          />
        )}
        {categories.length === 0 && (
          <section className="bootstrap-panel">
            <div>
              <b>Kategori aplikasi belum tersedia</b>
              <span>Form berita, UMKM, dan bantuan membutuhkan kategori. Siapkan kategori dasar dulu, lalu ganti dengan data resmi PSI Mesuji saat sudah tersedia.</span>
            </div>
            <button className="primary-button" disabled={saving} onClick={() => void bootstrapDefaults()}>
              {saving ? 'Menyiapkan...' : 'Siapkan Kategori Dasar'}
            </button>
          </section>
        )}

        {activeSection === 'dashboard' && (
          <>
            <KpiGrid analytics={analytics} />
            <DashboardCharts analytics={analytics} />
            <section className="work-grid">
              <Card title="Operational Modules" icon={<Activity />}>
                <div className="module-grid">
                  {modules.map((module) => (
                    <button key={`${module.section}-${module.label}`} className="module-card" onClick={() => setActiveSection(module.section)}>
                      <span className="module-icon">{module.icon}</span>
                      <span>
                        <b>{module.label}</b>
                        <small>{module.body}</small>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </Card>
              <Card title="Rekomendasi Berikutnya" icon={<Bot />}>
                <div className="recommendation-list">
                  {recommendations.map((item) => (
                    <div className="recommendation" key={item}>
                      <CheckCircle2 size={18} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
            <ReportsPanel queue={filteredQueue} status={status} setStatus={setStatus} openStatusPanel={openStatusPanel} />
          </>
        )}

        {activeSection === 'reports' && (
          <>
            <KpiGrid analytics={analytics} />
            <ReportsPanel queue={filteredQueue} status={status} setStatus={setStatus} openStatusPanel={openStatusPanel} />
          </>
        )}

        {activeSection === 'publishing' && (
          <section className="cms-grid">
            <FormCard title="Posting Banner Aplikasi" icon={<ImageIcon />}>
              <FormField label="Judul">
                <input value={forms.banner.title} onChange={(event) => updateForm('banner', { title: event.target.value })} />
              </FormField>
              <FormField label="Subjudul">
                <textarea rows={3} value={forms.banner.subtitle} onChange={(event) => updateForm('banner', { subtitle: event.target.value })} />
              </FormField>
              <UploadControl
                id="banner-media"
                label="Foto Banner"
                accept="image/*"
                media={forms.banner.imageUrl ? [{ url: forms.banner.imageUrl, path: 'banner', type: 'IMAGE', mimeType: 'image/*', sizeBytes: 0 }] : []}
                uploading={Boolean(uploading.banner)}
                onUpload={(file) => void uploadMedia('banner', 'banners', file)}
              />
              <div className="form-grid two">
                <FormField label="CTA Label">
                  <input value={forms.banner.ctaLabel} onChange={(event) => updateForm('banner', { ctaLabel: event.target.value })} />
                </FormField>
                <FormField label="CTA URL">
                  <input value={forms.banner.ctaUrl} onChange={(event) => updateForm('banner', { ctaUrl: event.target.value })} />
                </FormField>
              </div>
              <FormField label="Urutan">
                <input type="number" value={forms.banner.sortOrder} onChange={(event) => updateForm('banner', { sortOrder: event.target.value })} />
              </FormField>
              <button className="primary-button" disabled={saving} onClick={() => void publishBanner()}>Posting Banner</button>
            </FormCard>

            <FormCard title="Posting Berita" icon={<Newspaper />}>
              <FormField label="Judul">
                <input value={forms.news.title} onChange={(event) => updateForm('news', { title: event.target.value, slug: slugify(event.target.value) })} />
              </FormField>
              <FormField label="Slug">
                <input value={forms.news.slug} onChange={(event) => updateForm('news', { slug: event.target.value })} />
              </FormField>
              <FormField label="Kategori Berita">
                <CategorySelect value={forms.news.categoryId} categories={categoryOptions('NEWS')} onChange={(value) => updateForm('news', { categoryId: value })} />
              </FormField>
              <div className="form-grid two">
                <FormField label="Penulis Berita">
                  <input value={forms.news.authorName} onChange={(event) => updateForm('news', { authorName: event.target.value })} />
                </FormField>
                <FormField label="Nama Sumber">
                  <input value={forms.news.sourceName} onChange={(event) => updateForm('news', { sourceName: event.target.value })} />
                </FormField>
              </div>
              <FormField label="URL Sumber, opsional">
                <input value={forms.news.sourceUrl} onChange={(event) => updateForm('news', { sourceUrl: event.target.value })} placeholder="https://..." />
              </FormField>
              <UploadControl
                id="news-media"
                label="Foto atau Video Berita"
                accept="image/*,video/*"
                media={forms.news.media}
                uploading={Boolean(uploading.news)}
                onUpload={(file) => void uploadMedia('news', 'articles', file)}
              />
              <FormField label="Ringkasan">
                <textarea rows={3} value={forms.news.excerpt} onChange={(event) => updateForm('news', { excerpt: event.target.value })} />
              </FormField>
              <FormField label="Isi Artikel">
                <textarea rows={7} value={forms.news.content} onChange={(event) => updateForm('news', { content: event.target.value })} />
              </FormField>
              <label className="check-row">
                <input type="checkbox" checked={forms.news.featured} onChange={(event) => updateForm('news', { featured: event.target.checked })} />
                <span>Jadikan featured news</span>
              </label>
              <button className="primary-button" disabled={saving} onClick={() => void publishNews()}>Publikasikan Berita</button>
            </FormCard>

            <FormCard title="Broadcast Notifikasi" icon={<Bell />}>
              <FormField label="Judul Notifikasi">
                <input value={forms.notification.title} onChange={(event) => updateForm('notification', { title: event.target.value })} />
              </FormField>
              <FormField label="Isi Pesan">
                <textarea rows={4} value={forms.notification.body} onChange={(event) => updateForm('notification', { body: event.target.value })} />
              </FormField>
              <button className="primary-button" disabled={saving} onClick={() => void sendNotification()}>Kirim Notifikasi</button>
            </FormCard>
          </section>
        )}

        {activeSection === 'assistance' && (
          <section className="cms-grid">
            <FormCard title="Program Bantuan Baru" icon={<HandHeart />}>
              <FormField label="Nama Program">
                <input value={forms.assistance.title} onChange={(event) => updateForm('assistance', { title: event.target.value })} />
              </FormField>
              <FormField label="Kategori Bantuan">
                <CategorySelect value={forms.assistance.categoryId} categories={categoryOptions('ASSISTANCE')} onChange={(value) => updateForm('assistance', { categoryId: value })} />
              </FormField>
              <FormField label="Deskripsi">
                <textarea rows={4} value={forms.assistance.description} onChange={(event) => updateForm('assistance', { description: event.target.value })} />
              </FormField>
              <FormField label="Syarat, satu baris per syarat">
                <textarea rows={5} value={forms.assistance.requirements} onChange={(event) => updateForm('assistance', { requirements: event.target.value })} />
              </FormField>
              <FormField label="Kuota">
                <input type="number" value={forms.assistance.quota} onChange={(event) => updateForm('assistance', { quota: event.target.value })} />
              </FormField>
              <label className="check-row">
                <input type="checkbox" checked={forms.assistance.isOpen} onChange={(event) => updateForm('assistance', { isOpen: event.target.checked })} />
                <span>Buka pendaftaran di aplikasi</span>
              </label>
              <button className="primary-button" disabled={saving} onClick={() => void publishAssistance()}>Posting Program Bantuan</button>
            </FormCard>
            <Card title="Distribusi Bantuan" icon={<HandHeart />}>
              <ChartFrame empty={!analytics?.assistanceDistribution.length} emptyText="Belum ada pengajuan bantuan.">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analytics?.assistanceDistribution ?? []} dataKey="value" nameKey="name" outerRadius={96} label>
                      {(analytics?.assistanceDistribution ?? []).map((_, index) => (
                        <Cell key={index} fill={palette[index % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Card>
          </section>
        )}

        {activeSection === 'umkm' && (
          <section className="cms-grid">
            <FormCard title="Posting Produk UMKM" icon={<Store />}>
              <FormField label="Nama Produk">
                <input value={forms.product.name} onChange={(event) => updateForm('product', { name: event.target.value })} />
              </FormField>
              <FormField label="Kategori Produk">
                <CategorySelect value={forms.product.categoryId} categories={categoryOptions('PRODUCT')} onChange={(value) => updateForm('product', { categoryId: value })} />
              </FormField>
              <FormField label="Deskripsi">
                <textarea rows={4} value={forms.product.description} onChange={(event) => updateForm('product', { description: event.target.value })} />
              </FormField>
              <UploadControl
                id="product-media"
                label="Foto Produk"
                accept="image/*"
                media={forms.product.media}
                uploading={Boolean(uploading.product)}
                onUpload={(file) => void uploadMedia('product', 'products', file)}
              />
              <div className="form-grid two">
                <FormField label="Harga">
                  <input type="number" value={forms.product.price} onChange={(event) => updateForm('product', { price: event.target.value })} />
                </FormField>
                <FormField label="WhatsApp">
                  <input value={forms.product.whatsapp} onChange={(event) => updateForm('product', { whatsapp: event.target.value })} placeholder="628..." />
                </FormField>
              </div>
              <div className="form-grid two">
                <FormField label="Nama Penjual">
                  <input value={forms.product.sellerName} onChange={(event) => updateForm('product', { sellerName: event.target.value })} />
                </FormField>
                <FormField label="Kecamatan">
                  <input value={forms.product.district} onChange={(event) => updateForm('product', { district: event.target.value })} />
                </FormField>
              </div>
              <button className="primary-button" disabled={saving} onClick={() => void publishProduct()}>Posting Produk</button>
            </FormCard>
            <Card title="Status Marketplace" icon={<Store />}>
              <div className="metric-list">
                <Metric label="Produk aktif" value={analytics?.summary.products ?? 0} />
                <Metric label="Kategori produk" value={categoryOptions('PRODUCT').length} />
              </div>
            </Card>
          </section>
        )}

        {activeSection === 'jobs' && (
          <section className="cms-grid">
            <FormCard title="Posting Lowongan Kerja" icon={<Briefcase />}>
              <FormField label="Posisi">
                <input value={forms.job.title} onChange={(event) => updateForm('job', { title: event.target.value })} />
              </FormField>
              <FormField label="Perusahaan/Instansi">
                <input value={forms.job.company} onChange={(event) => updateForm('job', { company: event.target.value })} />
              </FormField>
              <FormField label="Deskripsi">
                <textarea rows={5} value={forms.job.description} onChange={(event) => updateForm('job', { description: event.target.value })} />
              </FormField>
              <div className="form-grid two">
                <FormField label="Lokasi">
                  <input value={forms.job.location} onChange={(event) => updateForm('job', { location: event.target.value })} />
                </FormField>
                <FormField label="Tipe">
                  <input value={forms.job.type} onChange={(event) => updateForm('job', { type: event.target.value })} />
                </FormField>
              </div>
              <div className="form-grid two">
                <FormField label="Gaji Minimum">
                  <input type="number" value={forms.job.salaryMin} onChange={(event) => updateForm('job', { salaryMin: event.target.value })} />
                </FormField>
                <FormField label="Gaji Maksimum">
                  <input type="number" value={forms.job.salaryMax} onChange={(event) => updateForm('job', { salaryMax: event.target.value })} />
                </FormField>
              </div>
              <button className="primary-button" disabled={saving} onClick={() => void publishJob()}>Posting Lowongan</button>
            </FormCard>
            <Card title="Status Job Board" icon={<Briefcase />}>
              <div className="metric-list">
                <Metric label="Lowongan aktif" value={analytics?.summary.activeJobs ?? 0} />
                <Metric label="Kategori lowongan" value={categoryOptions('JOB').length} />
              </div>
            </Card>
          </section>
        )}

        {activeSection === 'users' && (
          <section className="queue-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Users & Roles</p>
                <h2>Pengguna dan Hak Akses</h2>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Kontak</th>
                    <th>Wilayah</th>
                    <th>Role</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td><b>{user.displayName}</b></td>
                      <td><small>{user.email ?? user.phone ?? '-'}</small></td>
                      <td>{user.district ?? '-'}{user.village ? `, ${user.village}` : ''}</td>
                      <td><Badge label={formatRole(user.role)} /></td>
                      <td>
                        <select defaultValue={user.role} onChange={(event) => void updateUserRole(user, event.target.value as Role)}>
                          {roles.map((role) => <option key={role} value={role}>{formatRole(role)}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <EmptyState text="Belum ada pengguna pada filter ini." />}
            </div>
          </section>
        )}

        {activeSection === 'security' && (
          <section className="cms-grid">
            <Card title="Security Runtime" icon={<ShieldCheck />}>
              <div className="metric-list">
                <Metric label="Auth admin" value="Cookie session aktif" />
                <Metric label="Password admin" value="Dikelola di env ADMIN_ACCESS_CODE Dokploy" />
                <Metric label="API server" value={apiBase.replace('https://', '')} />
                <Metric label="RBAC roles" value="Super Admin, Ketua DPD, Operator, DPRD Member" />
              </div>
            </Card>
            <Card title="Checklist Sebelum Operator Dipakai" icon={<CheckCircle2 />}>
              <div className="recommendation-list">
                <div className="recommendation"><CheckCircle2 size={18} /><span>Ganti ADMIN_ACCESS_CODE di Dokploy dan redeploy admin.</span></div>
                <div className="recommendation"><CheckCircle2 size={18} /><span>Tambahkan akun user/operator asli melalui Firebase lalu mapping role di menu Users.</span></div>
                <div className="recommendation"><CheckCircle2 size={18} /><span>Aktifkan audit log admin setelah volume operator mulai bertambah.</span></div>
              </div>
            </Card>
          </section>
        )}
      </section>

      {selectedReport && (
        <aside className="action-drawer" aria-label="Update report status">
          <div className="drawer-card">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">Update Status</p>
                <h2>{selectedReport.code}</h2>
              </div>
              <button className="icon-button" aria-label="Close status panel" onClick={() => setSelectedReport(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="drawer-report">
              <b>{selectedReport.title}</b>
              <span>{selectedReport.category.name} - {selectedReport.district}{selectedReport.village ? `, ${selectedReport.village}` : ''}</span>
              <Badge label={selectedReport.status} />
            </div>
            <FormField label="Status baru">
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as Exclude<ReportStatus, 'ALL'>)}>
                {mutableStatuses.map((item) => <option value={item} key={item}>{formatStatus(item)}</option>)}
              </select>
            </FormField>
            <FormField label="Catatan timeline">
              <textarea value={statusNote} onChange={(event) => setStatusNote(event.target.value)} rows={5} />
            </FormField>
            <div className="drawer-actions">
              <button className="secondary-button" onClick={() => setSelectedReport(null)}>Batal</button>
              <button className="primary-button" disabled={saving} onClick={() => void updateReportStatus()}>
                {saving ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}

function KpiGrid({ analytics }: { analytics: Analytics | null }) {
  return (
    <section className="kpi-grid">
      <StatCard title="Total Reports" value={analytics?.summary.reports ?? 0} icon={<ClipboardList />} accent="red" />
      <StatCard title="Active Users" value={analytics?.summary.activeUsers ?? 0} icon={<Users />} accent="blue" />
      <StatCard title="Open SOS" value={analytics?.summary.emergencyOpen ?? 0} icon={<AlertTriangle />} accent="orange" />
      <StatCard title="Assistance" value={analytics?.summary.assistance ?? 0} icon={<HandHeart />} accent="green" />
      <StatCard title="UMKM Products" value={analytics?.summary.products ?? 0} icon={<Store />} accent="blue" />
      <StatCard title="Active Jobs" value={analytics?.summary.activeJobs ?? 0} icon={<Briefcase />} accent="red" />
    </section>
  );
}

function DashboardCharts({ analytics }: { analytics: Analytics | null }) {
  return (
    <section className="dashboard-grid">
      <Card title="Reports per District" icon={<BarChart3 />}>
        <ChartFrame empty={!analytics?.reportsPerDistrict.length} emptyText="Belum ada laporan per kecamatan/desa.">
          <ResponsiveContainer>
            <BarChart data={analytics?.reportsPerDistrict ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="district" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#b7000c" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>
      <Card title="Most Common Issues" icon={<Megaphone />}>
        <div className="issue-list">
          {(analytics?.commonIssues ?? []).length === 0 && <EmptyState text="Kategori isu akan tampil setelah laporan masuk." />}
          {(analytics?.commonIssues ?? []).map((item, index) => (
            <div className="issue-item" key={item.name}>
              <span className="rank">{index + 1}</span>
              <span>{item.name}</span>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Assistance Distribution" icon={<HandHeart />}>
        <ChartFrame empty={!analytics?.assistanceDistribution.length} emptyText="Belum ada pengajuan bantuan.">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={analytics?.assistanceDistribution ?? []} dataKey="value" nameKey="name" outerRadius={96} label>
                {(analytics?.assistanceDistribution ?? []).map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartFrame>
      </Card>
    </section>
  );
}

function ReportsPanel({
  queue,
  status,
  setStatus,
  openStatusPanel
}: {
  queue: ReportQueueItem[];
  status: ReportStatus;
  setStatus: (status: ReportStatus) => void;
  openStatusPanel: (report: ReportQueueItem) => void;
}) {
  return (
    <section className="queue-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Report Queue</p>
          <h2>Antrean Operasional</h2>
        </div>
        <div className="status-filter">
          {statusFilters.map((item) => (
            <button key={item} className={status === item ? 'selected' : ''} onClick={() => setStatus(item)}>
              {formatStatus(item)}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kode</th>
              <th>Laporan</th>
              <th>Wilayah</th>
              <th>Status</th>
              <th>Prioritas</th>
              <th>Waktu</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id}>
                <td><b className="code">{item.code}</b></td>
                <td><b>{item.title}</b><small>{item.category.name} oleh {item.user.displayName}</small></td>
                <td>{item.district}{item.village ? `, ${item.village}` : ''}</td>
                <td><Badge label={item.status} /></td>
                <td>{item.priority}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td><button className="row-action" onClick={() => openStatusPanel(item)}>Update</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {queue.length === 0 && <EmptyState text="Belum ada laporan pada filter ini." />}
      </div>
    </section>
  );
}

function StatCard(props: { title: string; value: number; icon: ReactNode; accent: 'red' | 'blue' | 'green' | 'orange' }) {
  return (
    <article className={`stat-card ${props.accent}`}>
      <div className="stat-icon">{props.icon}</div>
      <span>{props.title}</span>
      <b>{props.value.toLocaleString('id-ID')}</b>
    </article>
  );
}

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-title">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function FormCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="card form-card">
      <div className="card-title">
        <span>{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="form-stack">{children}</div>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function UploadControl({
  id,
  label,
  accept,
  media,
  uploading,
  onUpload
}: {
  id: string;
  label: string;
  accept: string;
  media: UploadedMedia[];
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const item = media[0];
  return (
    <div className="upload-box">
      <div className="upload-head">
        <span>{label}</span>
        <label className="secondary-button upload-button" htmlFor={id}>
          {uploading ? <Loader2 className="spin" size={16} /> : <UploadCloud size={16} />}
          {uploading ? 'Mengunggah...' : 'Pilih File'}
        </label>
        <input
          id={id}
          className="upload-input"
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) onUpload(file);
            event.currentTarget.value = '';
          }}
        />
      </div>
      {item ? (
        <div className="upload-preview">
          {item.type === 'VIDEO' ? (
            <video src={item.url} controls muted />
          ) : item.type === 'IMAGE' ? (
            <div className="image-preview" role="img" aria-label={label} style={{ backgroundImage: `url(${item.url})` }} />
          ) : (
            <div className="document-preview"><FileText size={28} /></div>
          )}
          <div>
            <b>{item.type === 'VIDEO' ? 'Video siap dipakai' : item.type === 'IMAGE' ? 'Gambar siap dipakai' : 'Dokumen siap dipakai'}</b>
            <small>{item.url}</small>
          </div>
        </div>
      ) : (
        <div className="upload-empty">
          {accept.includes('video') ? <Video size={20} /> : <ImageIcon size={20} />}
          <span>Upload file dari komputer, sistem akan membuat URL otomatis.</span>
        </div>
      )}
    </div>
  );
}

function CategorySelect({ value, categories, onChange }: { value: string; categories: Category[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Pilih kategori</option>
      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
    </select>
  );
}

function ChartFrame({ empty, emptyText, children }: { empty: boolean; emptyText: string; children: ReactNode }) {
  return <div className="chart-frame">{empty ? <EmptyState text={emptyText} /> : children}</div>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <FileText size={24} />
      <span>{text}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className={`badge ${String(label).toLowerCase().replaceAll(' ', '_')}`}>{formatStatus(label)}</span>;
}

function PanelState({ title, body, tone = 'info' }: { title: string; body: string; tone?: 'info' | 'danger' }) {
  return (
    <div className={`panel-state ${tone}`}>
      <Bot />
      <div>
        <b>{title}</b>
        <p>{body}</p>
      </div>
    </div>
  );
}

function buildRecommendations(analytics: Analytics | null, queue: ReportQueueItem[], categories: Category[]) {
  const items: string[] = [];
  if (!analytics) return ['Pastikan backend API, database migration, dan seed awal berjalan di Dokploy.'];
  if (categories.length === 0) items.push('Klik Siapkan Kategori Dasar agar form publikasi dapat menyimpan ke aplikasi.');
  if (analytics.summary.reports === 0) items.push('Buat laporan uji agar grafik operasional dan antrean status aktif.');
  if (analytics.summary.activeUsers === 0) items.push('Tambahkan akun admin/operator asli dan mapping role per kecamatan/desa.');
  if (analytics.summary.products === 0) items.push('Posting data UMKM awal agar marketplace mobile tidak kosong.');
  if (analytics.summary.emergencyOpen > 0) items.push('Prioritaskan verifikasi SOS aktif dan assign operator lapangan.');
  if (queue.some((item) => item.priority === 'CRITICAL' || item.status === 'SUBMITTED')) items.push('Tinjau laporan baru/critical lebih dulu dan ubah status timeline.');
  items.push('Aktifkan audit log admin sebelum panel dipakai banyak operator.');
  return items.slice(0, 5);
}

function sectionTitle(section: SectionId) {
  const titles: Record<SectionId, string> = {
    dashboard: 'Dashboard Operasional Mesuji',
    reports: 'Manajemen Laporan',
    assistance: 'Program Bantuan',
    publishing: 'Publikasi Aplikasi',
    umkm: 'UMKM Marketplace',
    jobs: 'Job Board',
    users: 'Users & Roles',
    security: 'Security Center'
  };
  return titles[section];
}

function formatStatus(value: string) {
  if (value === 'ALL') return 'Semua';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatRole(role: string) {
  return role
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function defaultStatusNote(status: string) {
  const notes: Record<string, string> = {
    SUBMITTED: 'Laporan diterima dan menunggu verifikasi operator.',
    VERIFIED: 'Laporan sudah diverifikasi operator.',
    IN_PROGRESS: 'Laporan sedang ditindaklanjuti oleh tim terkait.',
    RESOLVED: 'Laporan selesai ditindaklanjuti.',
    REJECTED: 'Laporan ditolak karena tidak memenuhi kriteria atau data belum valid.'
  };
  return notes[status] ?? `Status diubah ke ${formatStatus(status)}.`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
