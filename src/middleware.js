import { NextResponse } from 'next/server';
import { createServerClient } from '../lib/supabase-server.js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Permitir acceso a la página de mantenimiento
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Verificar modo mantenimiento primero
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("maintenance_mode")
      .eq("id", 1)
      .single();

    // Si está en modo mantenimiento y no es ruta de admin, redirigir
    if (!error && data?.maintenance_mode && !pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
  }

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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
