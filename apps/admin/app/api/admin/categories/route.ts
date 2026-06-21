import type { NextRequest } from 'next/server';
import { proxyAdminGet, proxyAdminJson } from '../_upstream';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  return proxyAdminGet('categories', request.nextUrl.search);
}

export async function POST(request: NextRequest) {
  return proxyAdminJson('categories', 'POST', await request.json());
}
