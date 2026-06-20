'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Bot,
  Briefcase,
  ClipboardList,
  HandHeart,
  Image as ImageIcon,
  Newspaper,
  Search,
  ShieldCheck,
  Store,
  TrendingUp,
  Users
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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

type ReportQueueItem = {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  district: string;
  village?: string;
  createdAt: string;
  category: { name: string; color: string };
  user: { displayName: string };
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.tolong-mesuji.id/v1';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [queue, setQueue] = useState<ReportQueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [analyticsResponse, queueResponse] = await Promise.all([
          fetch(`${apiBase}/admin/analytics`, { cache: 'no-store' }),
          fetch(`${apiBase}/admin/queue`, { cache: 'no-store' })
        ]);
        if (!analyticsResponse.ok || !queueResponse.ok) throw new Error('API admin belum merespons dengan sukses');
        const [analyticsJson, queueJson] = (await Promise.all([
          analyticsResponse.json(),
          queueResponse.json()
        ])) as [Analytics, ReportQueueItem[]];
        if (mounted) {
          setAnalytics(analyticsJson);
          setQueue(queueJson);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Gagal memuat data admin');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = analytics?.summary;
  const modules = useMemo(
    () => [
      ['Manage reports', ClipboardList, 'Triase aspirasi, update status, dan catat timeline.'],
      ['Manage assistance', HandHeart, 'Buka program, review pengajuan, dan tandai pencairan.'],
      ['Manage news', Newspaper, 'Publikasikan kategori, artikel, dan berita unggulan.'],
      ['Manage jobs', Briefcase, 'Kelola lowongan, CV masuk, dan status aplikasi.'],
      ['Manage users', Users, 'Atur warga, operator, DPRD Member, dan Ketua DPD.'],
      ['Manage banners', ImageIcon, 'Susun banner dinamis di home dashboard.'],
      ['UMKM marketplace', Store, 'Kurasi produk dan nomor WhatsApp order.'],
      ['Security & RBAC', ShieldCheck, 'Pantau akses role dan aktivitas admin.']
    ] as const,
    []
  );

  return (
    <main className="min-h-screen pb-10">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/30 bg-surface/80 px-5 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-heading font-bold text-white">T</div>
          <div>
            <h1 className="font-heading text-xl font-bold text-primary">TOLONG Admin</h1>
            <p className="text-xs text-[#5f3f3b]">DPD PSI Mesuji Lampung</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#dee8ff]">
            <Search size={20} />
          </button>
          <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#dee8ff]">
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="font-heading text-3xl font-bold text-primary">Executive Summary</h2>
            <p className="text-[#5f3f3b]">Data operasional untuk Super Admin, Ketua DPD, Operator, dan DPRD Member.</p>
          </div>
          <span className="rounded-full bg-[#dee8ff] px-4 py-2 text-sm text-[#263143]">
            {analytics ? `Updated ${new Date(analytics.generatedAt).toLocaleString('id-ID')}` : 'Menunggu API'}
          </span>
        </div>

        {loading && <PanelState title="Memuat dashboard" body="Mengambil analytics dan queue laporan dari TOLONG API." />}
        {error && <PanelState title="API belum siap" body={`${error}. Jalankan backend Docker atau set NEXT_PUBLIC_API_BASE_URL.`} />}

        {analytics && (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Stat title="Total Reports" value={summary?.reports ?? 0} icon={<ClipboardList />} wide />
              <Stat title="Active Users" value={summary?.activeUsers ?? 0} icon={<Users />} />
              <Stat title="Open SOS" value={summary?.emergencyOpen ?? 0} icon={<AlertTriangle />} />
              <Stat title="Approved Assistance" value={summary?.assistance ?? 0} icon={<HandHeart />} />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <section className="glass rounded-2xl p-5">
                <h3 className="mb-4 font-heading text-xl font-bold">Reports per district</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <BarChart data={analytics.reportsPerDistrict}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="district" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#b7000c" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
              <section className="glass rounded-2xl p-5">
                <h3 className="mb-4 font-heading text-xl font-bold">Assistance distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={analytics.assistanceDistribution} dataKey="value" nameKey="name" outerRadius={105} label>
                        {analytics.assistanceDistribution.map((_, index) => (
                          <Cell key={index} fill={['#b7000c', '#004ed0', '#22c55e', '#f97316'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {modules.map(([label, Icon, body]) => (
                <button key={label} className="glass flex min-h-28 items-start gap-3 rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:bg-white">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#dee8ff] text-primary">
                    <Icon />
                  </span>
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="mt-1 block text-sm text-[#5f3f3b]">{body}</span>
                  </span>
                </button>
              ))}
            </div>

            <section className="mt-6 glass rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold">Report operations queue</h3>
                <span className="text-sm text-[#5f3f3b]">{queue.length} laporan terbaru</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
                  <thead className="text-left text-[#5f3f3b]">
                    <tr>
                      <th className="px-3 py-2">Kode</th>
                      <th className="px-3 py-2">Laporan</th>
                      <th className="px-3 py-2">Wilayah</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2">Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((item) => (
                      <tr key={item.id} className="bg-white">
                        <td className="rounded-l-xl px-3 py-3 font-semibold text-primary">{item.code}</td>
                        <td className="px-3 py-3">
                          <b>{item.title}</b>
                          <p className="text-xs text-[#5f3f3b]">{item.category.name} oleh {item.user.displayName}</p>
                        </td>
                        <td className="px-3 py-3">{item.district}{item.village ? `, ${item.village}` : ''}</td>
                        <td className="px-3 py-3"><Badge label={item.status} /></td>
                        <td className="px-3 py-3">{item.priority}</td>
                        <td className="rounded-r-xl px-3 py-3">{new Date(item.createdAt).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function Stat(props: { title: string; value: number; icon: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${props.wide ? 'md:col-span-2' : ''}`}>
      <div className="mb-2 flex justify-between text-[#5f3f3b]">
        <span>{props.title}</span>
        {props.icon}
      </div>
      <div className="flex items-end gap-2">
        <b className="font-heading text-4xl text-primary">{props.value.toLocaleString('id-ID')}</b>
        <span className="mb-1 flex text-sm text-green-600">
          <TrendingUp size={16} /> live
        </span>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return <span className="rounded-full bg-[#dee8ff] px-3 py-1 text-xs font-semibold text-[#263143]">{label.replaceAll('_', ' ')}</span>;
}

function PanelState({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass mb-6 flex items-start gap-3 rounded-2xl p-5">
      <Bot className="mt-1 text-primary" />
      <div>
        <b>{title}</b>
        <p className="text-sm text-[#5f3f3b]">{body}</p>
      </div>
    </div>
  );
}
