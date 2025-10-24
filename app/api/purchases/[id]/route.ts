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

    // Check if purchase belongs to user
    const { data: existing, error: checkError } = await supabaseServer
      .from('purchases')
      .select('id')
      .eq('id', purchaseId)
      .eq('user_id', decoded.id)
      .single();

    if (checkError) {
      console.error('Check purchase error:', checkError);
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'المشتراة غير موجودة' },
        { status: 404 }
      );
    }

    // Update purchase
    const { error: updateError } = await supabaseServer
      .from('purchases')
      .update({
        purchase_date,
        weight,
        price_per_gram,
        total_price,
        manufacturing_fee: manufacturing_fee || 0,
        other_expenses: other_expenses || 0,
        notes: notes || '',
      })
      .eq('id', purchaseId)
      .eq('user_id', decoded.id);

    if (updateError) {
      console.error('Update purchase error:', updateError);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء تحديث المشتراة' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم تحديث المشتراة بنجاح',
      },
      { status: 200 }
    );
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

    // Check if purchase belongs to user
    const { data: existing, error: checkError } = await supabaseServer
      .from('purchases')
      .select('id')
      .eq('id', purchaseId)
      .eq('user_id', decoded.id)
      .single();

    if (checkError) {
      console.error('Check purchase error:', checkError);
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'المشتراة غير موجودة' },
        { status: 404 }
      );
    }

    // Delete purchase
    const { error: deleteError } = await supabaseServer
      .from('purchases')
      .delete()
      .eq('id', purchaseId)
      .eq('user_id', decoded.id);

    if (deleteError) {
      console.error('Delete purchase error:', deleteError);
      return NextResponse.json(
        { error: 'حدث خطأ أثناء حذف المشتراة' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'تم حذف المشتراة بنجاح',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete purchase error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المشتراة' },
      { status: 500 }
    );
  }
}