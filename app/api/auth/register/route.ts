import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    // Get connection from pool
    const connection = await pool.getConnection();

    try {
      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if ((existingUsers as any[]).length > 0) {
        return NextResponse.json(
          { error: 'هذا البريد الإلكتروني مسجل بالفعل' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await connection.execute(
        'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
        [email, hashedPassword, full_name || email]
      );

      const insertResult = result as any;
      const userId = insertResult.insertId;

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: userId,
            email,
            full_name: full_name || email,
          },
        },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    );
  }
}

