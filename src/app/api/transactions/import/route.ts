import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { transactions = [], recurringStatuses = [] } = await req.json();
    const db = await getDb();

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

    db.transactions.push(...newTransactions);
    db.recurringStatuses.push(...newStatuses);

    await saveDb(db);

    return NextResponse.json({ success: true, count: newTransactions.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import data' }, { status: 500 });
  }
}
