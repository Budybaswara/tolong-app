const cookieName = 'tolong_admin_session';

export const adminSessionCookie = cookieName;

export async function adminSessionToken() {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code) return null;
  const secret = process.env.ADMIN_SESSION_SECRET ?? code;
  return sha256(`${code}.${secret}`);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
