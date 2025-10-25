import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// الصفحات التي لا تحتاج إلى تسجيل دخول
const publicPages = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // السماح بالوصول إلى الموارد الثابتة والصور
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // السماح بالوصول إلى الصفحات العامة
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  // السماح بالوصول إلى API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // إنشاء عميل Supabase والتحقق من الجلسة
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // إذا لم تكن هناك جلسة، قم بإعادة التوجيه إلى صفحة تسجيل الدخول
    if (!session && !publicPages.includes(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // إضافة معلومات الجلسة للاستجابة
    if (session) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-email', session.user.email || '')
    }

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // إنشاء عميل Supabase
    const response = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res: response })

    // التحقق من جلسة المستخدم
    const { data: { session } } = await supabase.auth.getSession()

    // إذا لم يكن المستخدم مسجل الدخول، قم بإعادة توجيهه إلى صفحة تسجيل الدخول
    if (!session) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Auth error:', error)
    // في حالة حدوث خطأ، قم بإعادة توجيه المستخدم إلى صفحة تسجيل الدخول
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }
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

