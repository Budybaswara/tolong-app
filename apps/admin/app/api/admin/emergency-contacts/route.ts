import type { NextRequest } from 'next/server';
import { proxyAdminGet, proxyAdminJson } from '../_upstream';

export const dynamic = 'force-dynamic';

export function GET() {
  return proxyAdminGet('emergency-contacts');
}

export async function POST(request: NextRequest) {
  return proxyAdminJson('emergency-contacts', 'POST', await request.json());
}
