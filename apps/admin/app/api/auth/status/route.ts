import { adminSessionCookie, adminSessionToken } from '../_session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const configured = Boolean(process.env.ADMIN_ACCESS_CODE);
  const token = await adminSessionToken();
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${adminSessionCookie}=`))
    ?.split('=')[1];

  return Response.json({
    configured,
    authenticated: configured && Boolean(token) && cookie === token
  });
}
