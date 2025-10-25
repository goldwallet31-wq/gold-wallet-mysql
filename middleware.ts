import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// الصفحات التي لا تحتاج إلى تسجيل دخول
const publicPages = ["/login", "/register"]

// الموارد التي لا تحتاج إلى فحص المصادقة
const publicResources = [
  '/_next',
  '/static',
  '/images',
  '/favicon',
  '/api'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // التحقق مما إذا كان المسار من الموارد العامة
  if (publicResources.some(resource => pathname.startsWith(resource))) {
    return NextResponse.next()
  }

  // إنشاء عميل Supabase والاستجابة
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  try {
    // التحقق من الجلسة
    const { data: { session } } = await supabase.auth.getSession()

    // إذا كان المستخدم في صفحة عامة وهو مسجل الدخول
    if (session && publicPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // إذا كان المستخدم في صفحة محمية وغير مسجل الدخول
    if (!session && !publicPages.includes(pathname)) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // إضافة معلومات المستخدم للرؤوس إذا كان مسجل الدخول
    if (session) {
      res.headers.set('x-user-id', session.user.id)
      res.headers.set('x-user-email', session.user.email || '')
    }

    return res
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    // في حالة الخطأ، التحقق إذا كان المسار عام
    if (publicPages.includes(pathname)) {
      return NextResponse.next()
    }

    // إعادة التوجيه إلى صفحة تسجيل الدخول مع رسالة خطأ
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'auth_error')
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

