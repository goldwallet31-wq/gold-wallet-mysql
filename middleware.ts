import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// الصفحات التي لا تحتاج إلى تسجيل دخول
const publicPages = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // السماح بالوصول إلى الملفات الثابتة
  if (pathname.includes('.')) {
    return NextResponse.next()
  }

  // السماح بالوصول إلى API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // السماح بالوصول إلى الصفحات العامة
  if (publicPages.includes(pathname)) {
    return NextResponse.next()
  }

  try {
    // إنشاء عميل Supabase
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    
    // التحقق من الجلسة
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    // إذا لم يكن هناك جلسة وليست صفحة عامة
    if (!session && !publicPages.includes(pathname)) {
      // حفظ الصفحة الحالية للعودة إليها بعد تسجيل الدخول
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // إذا كان هناك جلسة والصفحة عامة (مثل صفحة تسجيل الدخول)
    if (session && publicPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    return res
  } catch (error) {
    console.error('Middleware auth error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
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

