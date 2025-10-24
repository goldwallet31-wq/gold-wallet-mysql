import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabaseServer from '@/lib/supabase-server';

// Helper function to verify token
function verifyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set in environment');
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, secret) as any;
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

    const { data: purchases, error } = await supabaseServer
      .from('purchases')
      .select('id, user_id, purchase_date, weight, price_per_gram, total_price, manufacturing_fee, other_expenses, notes, created_at')
      .eq('user_id', decoded.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Get purchases error:', error);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب المشتريات' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        purchases: purchases ?? [],
      },
      { status: 200 }
    );
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

    const { data: inserted, error } = await supabaseServer
      .from('purchases')
      .insert([
        {
          user_id: decoded.id,
          purchase_date,
          weight,
          price_per_gram,
          total_price,
          manufacturing_fee: manufacturing_fee || 0,
          other_expenses: other_expenses || 0,
          notes: notes || '',
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Create purchase error:', error);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء إضافة المشتراة' },
        { status: 500 }
      );
    }

    const purchaseId = inserted?.id;

    return NextResponse.json(
      {
        success: true,
        purchase: {
          id: purchaseId,
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
  } catch (error) {
    console.error('Create purchase error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة المشتراة' },
      { status: 500 }
    );
  }
}