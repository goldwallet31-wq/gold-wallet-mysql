import { NextRequest, NextResponse } from 'next/server'
import supabase from '@/lib/db'
import bcrypt from 'bcryptjs'
import supabaseServer from '@/lib/supabase-server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    // Fail-fast: تأكد من ضبط متغيرات البيئة الضرورية
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const jwtSecret = process.env.JWT_SECRET
    if (!supabaseUrl || !anonKey || !serviceRoleKey || !jwtSecret) {
      return NextResponse.json(
        { error: 'متغيرات Supabase/JWT غير مضبوطة (URL/ANON_KEY/SERVICE_ROLE_KEY/JWT_SECRET). حدّث إعدادات البيئة أولاً.' },
        { status: 500 }
      )
    }

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل لتتوافق مع إعدادات Supabase' },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور لتخزينها في جدول users المحلي (متوافق مع المخطط الحالي)
    const hashedPassword = bcrypt.hashSync(password, 10)

    console.log('Starting user creation process...');
    
    // إنشاء المستخدم عبر مفتاح الخدمة مع تأكيد البريد مباشرةً لتفادي فشل تسجيل الدخول
    const { data: createdUser, error: createError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || email,
      },
    })

    console.log('Auth user creation result:', { createdUser, createError });

    if (createError) {
      console.error('Supabase admin.createUser error:', createError)
      if (createError.message.includes('already registered') || createError.message.includes('User already exists')) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مسجل بالفعل' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: `فشل إنشاء المستخدم: ${createError.message}` },
        { status: (createError as any).status || 400 }
      )
    }

    console.log('Attempting to insert user into users table...');
    
    // تحقق من أن لدينا user.id
    if (!createdUser?.user?.id) {
      console.error('No user ID from auth creation:', createdUser);
      return NextResponse.json(
        { error: 'فشل إنشاء المستخدم: لم يتم الحصول على معرف المستخدم' },
        { status: 500 }
      );
    }

    // إدراج بيانات المستخدم في جدول users المخصص
    const { data: insertedUser, error: userError } = await supabaseServer
      .from('users')
      .insert([
        {
          id: createdUser.user.id,
          email: email,
          full_name: full_name || email,
        }
      ])
      .select('id, email, full_name')
      .single()
    
    console.log('User insertion result:', { insertedUser, userError });

    if (userError) {
      console.error('Error inserting user data:', userError)
      return NextResponse.json(
        { error: 'فشل إدراج بيانات المستخدم في جدول users. تحقق من مفاتيح Supabase وإعدادات البيئة.' },
        { status: 500 }
      )
    }

    // تسجيل الدخول فورًا (اختياري) ثم إصدار توكن داخلي متوافق مع التحقق
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (loginError) {
      console.error('Supabase login after create error:', loginError)
      // لا نمنع الإكمال: نصدر JWT داخلي بغض النظر
    }

    // إصدار JWT داخلي يحتوي على id و email
    const token = jwt.sign(
      { id: insertedUser?.id, email },
      jwtSecret,
      { expiresIn: '7d' }
    )

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
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    )
  }
}