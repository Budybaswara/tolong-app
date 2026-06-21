import type { NextRequest } from 'next/server';
import { proxyAdminJson } from '../_upstream';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return proxyAdminJson('products', 'POST', await request.json());
}
