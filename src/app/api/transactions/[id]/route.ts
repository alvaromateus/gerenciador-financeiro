import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TransactionModel, RecurringStatusModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const data = await req.json();
    await connectToDatabase();

    const existing = await TransactionModel.findOne({ id, userId: user.userId });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Freeze past paid amounts if they don't have one
    await RecurringStatusModel.updateMany(
      { transactionId: id, userId: user.userId, paid: true, amount: { $exists: false } },
      { $set: { amount: existing.amount } }
    );

    const updated = await TransactionModel.findOneAndUpdate(
      { id, userId: user.userId },
      { $set: data },
      { new: true }
    ).lean();

    const { _id, __v, ...cleanTransaction } = updated;
    return NextResponse.json(cleanTransaction);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    await connectToDatabase();

    const deleted = await TransactionModel.findOneAndDelete({ id, userId: user.userId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Also remove any recurring statuses for this transaction
    await RecurringStatusModel.deleteMany({ transactionId: id, userId: user.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
