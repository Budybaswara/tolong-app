import { proxyAdminJson } from '../_upstream';

export const dynamic = 'force-dynamic';

export function POST() {
  return proxyAdminJson('bootstrap-defaults', 'POST', {});
}
