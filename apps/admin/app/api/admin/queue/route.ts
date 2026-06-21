import type { NextRequest } from 'next/server';
import { proxyAdminGet } from '../_upstream';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return proxyAdminGet('queue', request.nextUrl.search);
}
