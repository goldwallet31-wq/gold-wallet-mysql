import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

// Helper function to verify token
function verifyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

// GET - Fetch all purchases for the user
export async function GET(request: NextRequest) {
  try {
    const decoded = verifyToken(request.headers.get('Authorization'));

    if (!decoded) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.execute(
        `SELECT id, user_id, purchase_date, weight, price_per_gram, 
                total_price, manufacturing_fee, other_expenses, notes, created_at 
         FROM purchases WHERE user_id = ? ORDER BY purchase_date DESC`,
        [decoded.id]
      );

      return NextResponse.json(
        {
          success: true,
          purchases: rows,
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get purchases error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المشتريات' },
      { status: 500 }
    );
  }
}

// POST - Create a new purchase
export async function POST(request: NextRequest) {
  try {
    const decoded = verifyToken(request.headers.get('Authorization'));

    if (!decoded) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const {
      purchase_date,
      weight,
      price_per_gram,
      total_price,
      manufacturing_fee,
      other_expenses,
      notes,
    } = await request.json();

    // Validation
    if (!purchase_date || !weight || !price_per_gram || !total_price) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب أن تكون مملوءة' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        `INSERT INTO purchases 
         (user_id, purchase_date, weight, price_per_gram, total_price, 
          manufacturing_fee, other_expenses, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          decoded.id,
          purchase_date,
          weight,
          price_per_gram,
          total_price,
          manufacturing_fee || 0,
          other_expenses || 0,
          notes || '',
        ]
      );

      const insertResult = result as any;

      return NextResponse.json(
        {
          success: true,
          purchase: {
            id: insertResult.insertId,
            user_id: decoded.id,
            purchase_date,
            weight,
            price_per_gram,
            total_price,
            manufacturing_fee: manufacturing_fee || 0,
            other_expenses: other_expenses || 0,
            notes: notes || '',
          },
        },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create purchase error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة المشتراة' },
      { status: 500 }
    );
  }
}

