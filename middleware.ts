import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // تحديث الجلسة (مهم جداً)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = req.nextUrl

  console.log(`🔍 Middleware check: ${pathname}`, { hasSession: !!session })

  // المسارات العامة (لا تحتاج مصادقة)
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // إذا كان المسار عام والمستخدم مسجل دخول، أعده للصفحة الرئيسية
  if (isPublicPath && session) {
    console.log('✅ User logged in, redirecting to home from', pathname)
    return NextResponse.redirect(new URL('/', req.url))
  }

  // إذا كان المسار محمي والمستخدم غير مسجل، أعده لصفحة تسجيل الدخول
  if (!isPublicPath && !session) {
    console.log('❌ No session, redirecting to login from', pathname)
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// تطبيق الـ middleware على جميع المسارات ما عدا الملفات الثابتة
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
