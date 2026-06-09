import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // No proteger la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Proteger rutas de admin
  if (pathname.startsWith('/admin')) {
    const authCookie = request.cookies.get('admin_auth');

    if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
