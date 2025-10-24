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

// PUT - Update a purchase
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request.headers.get('Authorization'));

    if (!decoded) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const purchaseId = params.id;
    const {
      purchase_date,
      weight,
      price_per_gram,
      total_price,
      manufacturing_fee,
      other_expenses,
      notes,
    } = await request.json();

    const connection = await pool.getConnection();

    try {
      // Check if purchase belongs to user
      const [purchases] = await connection.execute(
        'SELECT id FROM purchases WHERE id = ? AND user_id = ?',
        [purchaseId, decoded.id]
      );

      if ((purchases as any[]).length === 0) {
        return NextResponse.json(
          { error: 'المشتراة غير موجودة' },
          { status: 404 }
        );
      }

      // Update purchase
      await connection.execute(
        `UPDATE purchases SET 
         purchase_date = ?, weight = ?, price_per_gram = ?, total_price = ?,
         manufacturing_fee = ?, other_expenses = ?, notes = ?
         WHERE id = ? AND user_id = ?`,
        [
          purchase_date,
          weight,
          price_per_gram,
          total_price,
          manufacturing_fee || 0,
          other_expenses || 0,
          notes || '',
          purchaseId,
          decoded.id,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'تم تحديث المشتراة بنجاح',
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update purchase error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المشتراة' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a purchase
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = verifyToken(request.headers.get('Authorization'));

    if (!decoded) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const purchaseId = params.id;

    const connection = await pool.getConnection();

    try {
      // Check if purchase belongs to user
      const [purchases] = await connection.execute(
        'SELECT id FROM purchases WHERE id = ? AND user_id = ?',
        [purchaseId, decoded.id]
      );

      if ((purchases as any[]).length === 0) {
        return NextResponse.json(
          { error: 'المشتراة غير موجودة' },
          { status: 404 }
        );
      }

      // Delete purchase
      await connection.execute(
        'DELETE FROM purchases WHERE id = ? AND user_id = ?',
        [purchaseId, decoded.id]
      );

      return NextResponse.json(
        {
          success: true,
          message: 'تم حذف المشتراة بنجاح',
        },
        { status: 200 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete purchase error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المشتراة' },
      { status: 500 }
    );
  }
}

