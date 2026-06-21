import type { NextRequest } from 'next/server';
import { proxyJson } from '../_upstream';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return proxyJson('notifications', 'POST', await request.json());
}
