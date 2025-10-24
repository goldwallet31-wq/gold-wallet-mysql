import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import jwt from 'jsonwebtoken';

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

    // استخدام Supabase للمصادقة
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

    if (!data || !data.user) {
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تسجيل الدخول' },
        { status: 500 }
      );
    }

    // الحصول على بيانات المستخدم من جدول المستخدمين (لازم موجود لإصدار JWT داخلي)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'تم تسجيل الدخول في Supabase لكن لم يتم العثور على المستخدم في جدول users' },
        { status: 500 }
      );
    }

    // إصدار رمز JWT داخلي متوافق مع /api/auth/verify
    const appToken = jwt.sign(
      { id: userData.id, email: userData.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        token: appToken,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name || data.user.user_metadata?.full_name || email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}