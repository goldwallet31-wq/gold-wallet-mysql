import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    // تشفير كلمة المرور لتخزينها في جدول users المحلي (متوافق مع المخطط الحالي)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // استخدام Supabase للتسجيل
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || email,
        }
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      
      // التحقق من نوع الخطأ
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مسجل بالفعل' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'حدث خطأ أثناء التسجيل' },
        { status: 500 }
      );
    }

    if (!data || !data.user) {
      return NextResponse.json(
        { error: 'حدث خطأ أثناء التسجيل' },
        { status: 500 }
      );
    }

    // إضافة المستخدم إلى جدول المستخدمين المخصص (يتوافق مع جدول users الحالي: BIGSERIAL id + password NOT NULL)
    const { data: insertedUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: email,
          password: hashedPassword,
          full_name: full_name || email,
        }
      ])
      .select('id, email, full_name')
      .single();

    if (userError) {
      console.error('Error inserting user data:', userError);
      // في حالة فشل الإدراج في الجدول المحلي، لا نفشل التسجيل بالكامل لأن المصادقة تمت في Supabase
    }

    // استخدام رمز الجلسة من Supabase (قد يكون فارغًا إذا كان التحقق عبر البريد مطلوبًا)
    const token = data.session?.access_token;

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: insertedUser?.id ?? null,
          email,
          full_name: full_name || email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}