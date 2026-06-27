import type { NextRequest } from 'next/server';
import { apiUrl, upstreamHeaders } from '../_upstream';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const response = await fetch(apiUrl('storage/upload'), {
      method: 'POST',
      cache: 'no-store',
      headers: upstreamHeaders(),
      body: formData
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
        message: error instanceof Error ? error.message : 'Gagal mengunggah file'
      },
      { status: 502 }
    );
  }
}
