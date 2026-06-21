import { NextResponse, type NextRequest } from 'next/server';

const cookieName = 'tolong_admin_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login' || pathname.startsWith('/api/auth')) return NextResponse.next();

  const expected = await sessionToken();
  const actual = request.cookies.get(cookieName)?.value;
  const authenticated = Boolean(expected) && actual === expected;

  if (authenticated) return NextResponse.next();

  if (pathname.startsWith('/api/admin')) {
    return NextResponse.json({ message: 'Unauthorized admin request' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)']
};

async function sessionToken() {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code) return null;
  const secret = process.env.ADMIN_SESSION_SECRET ?? code;
  const bytes = new TextEncoder().encode(`${code}.${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
