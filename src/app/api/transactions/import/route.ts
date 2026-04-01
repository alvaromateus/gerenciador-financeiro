import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TransactionModel, RecurringStatusModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transactions = [], recurringStatuses = [] } = await req.json();
    await connectToDatabase();

    const idMap = new Map<string, string>();

    const newTransactions = transactions.map((t: any) => {
      const newId = uuidv4();
      if (t.id) idMap.set(t.id, newId);
      return {
        ...t,
        id: newId,
        userId: user.userId,
        paid: t.paid || false
      };
    });

    const newStatuses = recurringStatuses.map((s: any) => ({
      ...s,
      transactionId: idMap.get(s.transactionId) || s.transactionId,
      userId: user.userId
    }));

    if (newTransactions.length > 0) {
      await TransactionModel.insertMany(newTransactions);
    }
    
    if (newStatuses.length > 0) {
      await RecurringStatusModel.insertMany(newStatuses);
    }

    return NextResponse.json({ success: true, count: newTransactions.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
