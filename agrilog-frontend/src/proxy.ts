/* eslint-disable react-hooks/set-state-in-effect */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (isAuthPage) {
    if (token) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (role === 'COMPANY') {
        return NextResponse.redirect(new URL('/company/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Protect all other routes except landing page
  if (!token && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // RBAC checks
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    if (role === 'COMPANY') {
      return NextResponse.redirect(new URL('/company/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (pathname.startsWith('/company') && role !== 'COMPANY') {
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Farm pages: block admin and company
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/company') && pathname !== '/') {
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (role === 'COMPANY') {
      return NextResponse.redirect(new URL('/company/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
