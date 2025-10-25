import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { pathname } = req.nextUrl

  // المسارات العامة (لا تحتاج مصادقة)
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // مسارات API والملفات الثابتة - تجاهلها
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return res
  }

  try {
    // تحديث الجلسة (مهم جداً)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log(`🔍 [MIDDLEWARE] ${pathname}`, { 
      hasSession: !!session,
      isPublicPath,
      user: session?.user?.email 
    })

    // إذا كان المسار عام والمستخدم مسجل دخول، أعده للصفحة الرئيسية
    if (isPublicPath && session) {
      console.log('✅ [MIDDLEWARE] User logged in, redirecting to home from', pathname)
      return NextResponse.redirect(new URL('/', req.url))
    }

    // إذا كان المسار محمي والمستخدم غير مسجل، أعده لصفحة تسجيل الدخول
    if (!isPublicPath && !session) {
      console.log('❌ [MIDDLEWARE] No session, redirecting to login from', pathname)
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('❌ [MIDDLEWARE] Error:', error)
    // في حالة حدوث خطأ، اسمح بالوصول للمسارات العامة فقط
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }
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
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}
