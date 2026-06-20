import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const cats = [
    ['REPORT','Infrastruktur','construction','#b7000c'], ['REPORT','Kesehatan','local_hospital','#004ed0'],
    ['EMERGENCY','Ambulance','ambulance','#004ed0'], ['EMERGENCY','Pemadam','fire_truck','#b7000c'],
    ['PRODUCT','Kuliner','restaurant','#e60012'], ['PRODUCT','Kerajinan','brush','#004ed0'],
    ['NEWS','Ekonomi','storefront','#004ed0'], ['ASSISTANCE','Pendidikan','school','#004ed0'],
    ['ASSISTANCE','UMKM','storefront','#b7000c'], ['JOB','Administrasi','work','#004ed0']
  ];
  for (const [module,name,icon,color] of cats) await prisma.category.upsert({ where:{ id: module+'-'+name }, update:{}, create:{ id: module+'-'+name, module, name, icon, color } });
  const admin = await prisma.user.upsert({ where:{ email:'admin@tolong-mesuji.id' }, update:{}, create:{ email:'admin@tolong-mesuji.id', displayName:'Super Admin TOLONG', role: Role.SUPER_ADMIN, district:'Mesuji' } });
  const citizen = await prisma.user.upsert({ where:{ email:'warga@tolong-mesuji.id' }, update:{}, create:{ email:'warga@tolong-mesuji.id', displayName:'Warga Mesuji Demo', role: Role.CITIZEN, district:'Tanjung Raya', village:'Brabasan' } });
  const operator = await prisma.user.upsert({ where:{ email:'operator@tolong-mesuji.id' }, update:{}, create:{ email:'operator@tolong-mesuji.id', displayName:'Operator DPD Mesuji', role: Role.OPERATOR, district:'Mesuji' } });
  const existingBanner = await prisma.banner.findFirst({ where:{ title:'Program Bedah Rumah PSI Mesuji' } });
  if (!existingBanner) await prisma.banner.create({ data:{ title:'Program Bedah Rumah PSI Mesuji', subtitle:'Mewujudkan hunian layak bagi masyarakat kurang mampu.', imageUrl:'https://images.unsplash.com/photo-1518780664697-55e3ad937233', ctaLabel:'Lihat Detail', ctaUrl:'/assistance', sortOrder:1 } });
  await prisma.article.upsert({ where:{ slug:'pembangunan-jembatan-mesuji-dimulai' }, update:{}, create:{ slug:'pembangunan-jembatan-mesuji-dimulai', title:'Pembangunan Jembatan Mesuji Dimulai', excerpt:'Tahap awal pembangunan penghubung logistik warga Mesuji resmi dimulai.', content:'Pembangunan jembatan penghubung utama Kabupaten Mesuji memasuki tahap pemancangan pertama dengan prioritas akses logistik warga.', featured:true, publishedAt:new Date(), categoryId:'NEWS-Ekonomi', authorId:admin.id } });
  const existingProduct = await prisma.product.findFirst({ where:{ name:'Krupuk Kemplang Mesuji' } });
  if (!existingProduct) await prisma.product.create({ data:{ name:'Krupuk Kemplang Mesuji', description:'Produk kuliner lokal dengan bahan pilihan.', price:25000, whatsapp:'6281234567890', sellerName:'UMKM Kemplang Jaya', district:'Tanjung Raya', categoryId:'PRODUCT-Kuliner' } });
  const existingJob = await prisma.jobPosting.findFirst({ where:{ title:'Admin Gudang', company:'PT Mesuji Makmur Utama' } });
  if (!existingJob) await prisma.jobPosting.create({ data:{ title:'Admin Gudang', company:'PT Mesuji Makmur Utama', description:'Mengelola stok, laporan gudang, dan koordinasi pengiriman harian.', location:'Simpang Pematang', salaryMin:3500000, salaryMax:4500000, type:'FULL_TIME' } });
  const program = await prisma.assistanceProgram.findFirst({ where:{ title:'Bantuan Modal UMKM Mesuji' } }) ?? await prisma.assistanceProgram.create({ data:{ title:'Bantuan Modal UMKM Mesuji', description:'Program pendampingan dan modal kerja untuk UMKM aktif di Kabupaten Mesuji.', requirements:['KTP Mesuji','Foto usaha','Nomor WhatsApp aktif'], quota:100, categoryId:'ASSISTANCE-UMKM' } });
  const existingApplication = await prisma.assistanceApplication.findFirst({ where:{ programId:program.id, userId:citizen.id } });
  if (!existingApplication) await prisma.assistanceApplication.create({ data:{ programId:program.id, userId:citizen.id, payload:{ nik:'1800000000000001', usaha:'Kemplang rumahan', omzetBulanan:2500000 } } });
  const existingReport = await prisma.report.findFirst({ where:{ code:'MSJ-DEMO-001' } });
  if (!existingReport) await prisma.report.create({ data:{ code:'MSJ-DEMO-001', title:'Jalan rusak menuju sentra UMKM', description:'Permukaan jalan berlubang dan menghambat distribusi produk UMKM Desa Brabasan.', district:'Tanjung Raya', village:'Brabasan', latitude:-4.007421, longitude:105.350921, address:'Jalan poros Brabasan', userId:citizen.id, categoryId:'REPORT-Infrastruktur', priority:'HIGH', timeline:{ create:[{ status:'SUBMITTED', note:'Laporan diterima dari aplikasi warga' }, { status:'VERIFIED', note:'Operator memverifikasi lokasi dan kategori', actorId:operator.id }] } } });
  await prisma.membershipCard.upsert({ where:{ userId:citizen.id }, update:{}, create:{ userId:citizen.id, memberNo:'PSI-MSJ-2026-000001', qrPayload:JSON.stringify({ memberNo:'PSI-MSJ-2026-000001', issuer:'DPD PSI Mesuji Lampung' }), verifiedAt:new Date() } });
  const existingNotification = await prisma.notification.findFirst({ where:{ title:'Selamat datang di TOLONG' } });
  if (!existingNotification) await prisma.notification.create({ data:{ title:'Selamat datang di TOLONG', body:'Pantau aspirasi, bantuan, UMKM, lowongan, dan informasi PSI Mesuji dari satu aplikasi.', type:'SYSTEM', userId:citizen.id } });
}
main().finally(() => prisma.$disconnect());
