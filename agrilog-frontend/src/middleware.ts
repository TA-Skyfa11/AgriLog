import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;

  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/login');

  if (isAuthPage) {
    if (token) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
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
    // Farm trying to access admin
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!pathname.startsWith('/admin') && role === 'ADMIN' && pathname !== '/') {
    // Admin trying to access farm
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
