import type { NextRequest } from 'next/server';
import { proxyAdminJson } from '../../../_upstream';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyAdminJson(`users/${id}/role`, 'PATCH', await request.json());
}
