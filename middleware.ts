import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // قائمة الصفحات العامة التي لا تحتاج تسجيل دخول
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some(path => req.nextUrl.pathname === path)
  
  // السماح بالوصول إلى ملفات API
  if (req.nextUrl.pathname.startsWith('/api')) {
    return res
  }

  // السماح بالوصول إلى الصفحات العامة
  if (isPublicPath) {
    return res
  }

  try {
    const supabase = createMiddlewareClient({ req, res })
    
    // التحقق من الجلسة
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // إذا لم يكن هناك جلسة، إعادة التوجيه إلى صفحة تسجيل الدخول
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('❌ Middleware error:', error)
    // في حالة الخطأ، السماح بالمرور ليتم التحقق في useAuth
    return res
  }
}

export const config = {
  matcher: [
    /*
     * تطبيق middleware على جميع الصفحات باستثناء:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
