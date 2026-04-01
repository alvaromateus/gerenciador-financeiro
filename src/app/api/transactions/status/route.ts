import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TransactionModel, RecurringStatusModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transactionId, monthYear, paid, isRecurring } = await req.json();
    await connectToDatabase();

    if (isRecurring) {
      await RecurringStatusModel.findOneAndUpdate(
        { transactionId, monthYear, userId: user.userId },
        { $set: { paid } },
        { upsert: true, new: true }
      );
    } else {
      await TransactionModel.findOneAndUpdate(
        { id: transactionId, userId: user.userId },
        { $set: { paid } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
