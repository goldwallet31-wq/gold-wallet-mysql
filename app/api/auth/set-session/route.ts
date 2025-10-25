import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { accessToken, refreshToken } = await request.json()

    if (!accessToken || !refreshToken) {
      console.error('❌ Missing tokens:', { accessToken, refreshToken })
      return NextResponse.json(
        { error: 'Missing access or refresh token' },
        { status: 400 }
      )
    }

    const supabase = createRouteHandlerClient({ cookies })

    // نحاول ضبط الجلسة باستخدام Supabase helper
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (error) {
      console.error('❌ setSession error:', error)
      return NextResponse.json(
        { error: 'فشل في إنشاء الجلسة على الخادم' },
        { status: 500 }
      )
    }

    console.log('✅ Session saved successfully!')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected set-session error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الجلسة' },
      { status: 500 }
    )
  }
}
