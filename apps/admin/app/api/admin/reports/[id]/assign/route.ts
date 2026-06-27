import type { NextRequest } from 'next/server';
import { proxyAdminJson } from '../../../_upstream';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminJson(`reports/${id}/assign`, 'PATCH', await request.json());
}
