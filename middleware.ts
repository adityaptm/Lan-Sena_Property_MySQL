import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Cek keberadaan cookie sesi lansena_session
  const token = request.cookies.get('lansena_session')?.value;

  // 1. Jika belum login dan mengakses halaman selain /login dan /api -> Redirect ke /login
  if (!token && !pathname.startsWith('/login') && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah ada token login dan mengakses halaman /login -> Redirect ke dashboard /
  if (token && pathname === '/login') {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware di semua route kecuali asset statis, gambar, dan _next
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)',
  ],
};
