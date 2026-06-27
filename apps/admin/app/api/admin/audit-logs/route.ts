import { proxyAdminGet } from '../_upstream';

export const dynamic = 'force-dynamic';

export function GET() {
  return proxyAdminGet('audit-logs');
}
