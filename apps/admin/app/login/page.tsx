'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

type AuthStatus = {
  configured: boolean;
  authenticated: boolean;
};

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch('/api/auth/status', { cache: 'no-store' });
      const json = (await response.json()) as AuthStatus;
      setStatus(json);
      if (json.authenticated) window.location.href = '/';
    }
    void loadStatus();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const json = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(json.message ?? 'Login admin gagal');
      window.location.href = new URLSearchParams(window.location.search).get('next') ?? '/';
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login admin gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-mark logo-mark">
          <Image src="/tolong.png" alt="Logo TOLONG" width={70} height={70} priority />
        </div>
        <p className="eyebrow">TOLONG Admin</p>
        <h1>Masuk Dashboard</h1>
        <p className="login-copy">
          Akses ini untuk Super Admin, Ketua DPD, Operator, dan DPRD Member. Gunakan kode admin dari environment deployment.
        </p>

        {status && !status.configured && (
          <div className="login-warning">
            ADMIN_ACCESS_CODE belum dikonfigurasi. Set environment variable ini di Vercel sebelum admin panel dipakai.
          </div>
        )}

        <form onSubmit={submit} className="login-form">
          <label className="field">
            <span>Kode Admin</span>
            <div className="login-input">
              <LockKeyhole size={18} />
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                type="password"
                placeholder="Masukkan kode admin"
                autoComplete="current-password"
              />
            </div>
          </label>
          {message && <p className="login-error">{message}</p>}
          <button className="primary-button login-submit" disabled={loading || !code.trim()}>
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  );
}
