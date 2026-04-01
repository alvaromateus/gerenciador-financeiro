import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transactionId, monthYear, paid, isRecurring } = await req.json();
    const db = await getDb();

    if (isRecurring) {
      const existingStatusIndex = db.recurringStatuses.findIndex(
        s => s.transactionId === transactionId && s.monthYear === monthYear && s.userId === user.userId
      );

      if (existingStatusIndex !== -1) {
        db.recurringStatuses[existingStatusIndex].paid = paid;
      } else {
        db.recurringStatuses.push({
          transactionId,
          userId: user.userId,
          monthYear,
          paid
        });
      }
    } else {
      const transactionIndex = db.transactions.findIndex(
        t => t.id === transactionId && t.userId === user.userId
      );

      if (transactionIndex !== -1) {
        db.transactions[transactionIndex].paid = paid;
      }
    }

    await saveDb(db);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
