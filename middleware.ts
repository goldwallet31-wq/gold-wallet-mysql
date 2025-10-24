import { NextRequest, NextResponse } from "next/server"

// الصفحات التي لا تحتاج إلى تسجيل دخول
const publicPages = ["/login"]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // السماح بالوصول إلى الصفحات العامة
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // السماح بالوصول إلى API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // التحقق من وجود بيانات تسجيل الدخول في الـ cookies أو headers
  // ملاحظة: في بيئة العميل (Client-side)، سنستخدم localStorage
  // لكن في الـ middleware (Server-side)، نحتاج إلى استخدام cookies

  // للآن، سنسمح بالوصول إلى جميع الصفحات
  // والتحقق من تسجيل الدخول سيتم في الـ client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

