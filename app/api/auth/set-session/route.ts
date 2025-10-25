import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'رمز الجلسة مفقود' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken, // نمرر نفس التوكن لأننا نستخدمه كـ dummy refresh token
    })

    if (error) {
      console.error('خطأ في تعيين الجلسة:', error)
      return NextResponse.json(
        { error: 'فشل في تعيين الجلسة' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set-session error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعيين الجلسة' },
      { status: 500 }
    )
  }
}
