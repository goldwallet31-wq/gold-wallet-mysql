import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

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

    // Get user from database
    const result = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
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

