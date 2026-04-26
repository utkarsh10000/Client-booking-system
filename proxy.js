import { NextResponse } from 'next/server';

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  const publicPaths = ['/login', '/api/auth/login'];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const role = request.cookies.get('auth_role')?.value;

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};