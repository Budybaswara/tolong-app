import { adminSessionCookie } from '../_session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const response = Response.json({ ok: true });
  const secure = new URL(request.url).protocol === 'https:';
  response.headers.append(
    'Set-Cookie',
    `${adminSessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
  );
  return response;
}
