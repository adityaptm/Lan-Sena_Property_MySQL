import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/auth-token';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('lansena_session')?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = decryptToken(token);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: payload });
}
