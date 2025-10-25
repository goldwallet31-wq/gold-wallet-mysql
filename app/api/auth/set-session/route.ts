import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { accessToken, userId } = await request.json()
    
    // التحقق من وجود البيانات المطلوبة
    if (!accessToken || !userId) {
      return NextResponse.json(
        { error: 'بيانات الجلسة غير مكتملة' },
        { status: 400 }
      )
    }

    // إنشاء الرد مع الكوكيز
    const response = NextResponse.json({ success: true })

    // تعيين كوكيز آمنة للجلسة
    response.cookies.set('sb-access-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 ساعات
    })

    response.cookies.set('sb-user-id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8 // 8 ساعات
    })

    return response
  } catch (error) {
    console.error('خطأ في تعيين كوكيز الجلسة:', error)
    return NextResponse.json(
      { error: 'فشل في تعيين كوكيز الجلسة' },
      { status: 500 }
    )
  }
}