import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { password } = body;

  if (password === process.env.ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });
    return response;
  }

  return NextResponse.json(
    { error: "Contraseña incorrecta" },
    { status: 401 }
  );
}
