// ============================================================
// GET /api/health
// Lightweight liveness probe for Railway deployment.
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      version: process.env['NEXT_PUBLIC_APP_VERSION'] ?? '0.1.0',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
