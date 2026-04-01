import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const userTransactions = db.transactions.filter(t => t.userId === user.userId);
  const userRecurringStatuses = db.recurringStatuses.filter(s => s.userId === user.userId);

  return NextResponse.json({
    transactions: userTransactions,
    recurringStatuses: userRecurringStatuses
  });
}

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    const db = await getDb();

    const newTransaction: Transaction = {
      ...data,
      id: uuidv4(),
      userId: user.userId,
    };

    db.transactions.push(newTransaction);
    await saveDb(db);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
