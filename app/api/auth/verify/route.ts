import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'لم يتم توفير رمز المصادقة' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as any;

    // Get user from Supabase users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', decoded.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Verify error:', error);

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'انتهت صلاحية الرمز' },
        { status: 401 }
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'رمز غير صحيح' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق' },
      { status: 500 }
    );
  }
}