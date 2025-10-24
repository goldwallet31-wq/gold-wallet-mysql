import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // إنشاء عميل Supabase مع الكوكيز
    const supabase = createRouteHandlerClient({ cookies });

    // تسجيل الدخول مع Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase login error:', error);
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    if (!data?.user || !data?.session) {
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تسجيل الدخول' },
        { status: 500 }
      );
    }

    // الحصول على البيانات الإضافية من جدول users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: userData?.full_name || data.user.email
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}