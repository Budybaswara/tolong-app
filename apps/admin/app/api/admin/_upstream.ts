const fallbackApiBase = 'https://dokploy.closeclaw.site/tolong-api/v1';

export function apiUrl(path: string, search = '') {
  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? fallbackApiBase;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}${search}`;
}

export function adminApiUrl(path: string, search = '') {
  return apiUrl(`admin/${path}`, search);
}

export function upstreamHeaders(json = false) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-api-internal-token': process.env.API_INTERNAL_TOKEN ?? '',
    'x-admin-actor': process.env.ADMIN_ACTOR_NAME ?? 'Admin Dashboard'
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function proxyGet(path: string, search = '') {
  try {
    const response = await fetch(apiUrl(path, search), {
      cache: 'no-store',
      headers: path.startsWith('admin/') ? upstreamHeaders() : { Accept: 'application/json' }
    });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json'
      }
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Gagal menghubungi TOLONG API'
      },
      { status: 502 }
    );
  }
}

export function proxyAdminGet(path: string, search = '') {
  return proxyGet(`admin/${path}`, search);
}

export async function proxyJson(path: string, method: 'POST' | 'PATCH', body: unknown) {
  try {
    const response = await fetch(apiUrl(path), {
      method,
      cache: 'no-store',
      headers: path.startsWith('admin/') ? upstreamHeaders(true) : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json'
      }
    });
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Gagal menghubungi TOLONG API'
      },
      { status: 502 }
    );
  }
}

export function proxyAdminJson(path: string, method: 'POST' | 'PATCH', body: unknown) {
  return proxyJson(`admin/${path}`, method, body);
}
