import { adminSessionCookie, adminSessionToken } from '../_session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const expectedCode = process.env.ADMIN_ACCESS_CODE;
  if (!expectedCode) {
    return Response.json({ message: 'ADMIN_ACCESS_CODE belum dikonfigurasi di environment admin.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  if (body.code !== expectedCode) {
    return Response.json({ message: 'Kode admin tidak valid.' }, { status: 401 });
  }

  const token = await adminSessionToken();
  if (!token) {
    return Response.json({ message: 'Session admin belum siap.' }, { status: 503 });
  }

  const response = Response.json({ ok: true });
  const secure = new URL(request.url).protocol === 'https:';
  response.headers.append(
    'Set-Cookie',
    `${adminSessionCookie}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure ? '; Secure' : ''}`
  );
  return response;
}
