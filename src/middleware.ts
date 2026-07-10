import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a la página de mantenimiento y rutas de admin
  if (pathname === '/maintenance' || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Verificar modo mantenimiento
  try {
    const settingsResponse = await fetch(`${request.nextUrl.origin}/api/settings`, {
      cache: 'no-store'
    });
    const data = await settingsResponse.json();
    
    if (data.settings?.maintenance_mode) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
