import { NextResponse, type NextRequest } from 'next/server';
import { decryptToken } from '@/lib/auth-token';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ambil session dari cookie lansena_session
  const token = request.cookies.get('lansena_session')?.value;
  let user = null;

  if (token) {
    try {
      user = decryptToken(token);
    } catch {
      user = null;
    }
  }

  // Redirect ke login jika belum login dan mencoba akses route terlindungi
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/api')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect ke dashboard jika sudah login dan mencoba akses halaman login
  if (user && pathname.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};