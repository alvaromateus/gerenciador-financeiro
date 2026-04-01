import { NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const data = await req.json();
    const db = await getDb();

    const index = db.transactions.findIndex(t => t.id === id && t.userId === user.userId);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    db.transactions[index] = { ...db.transactions[index], ...data };
    await saveDb(db);

    return NextResponse.json(db.transactions[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const db = await getDb();

    const index = db.transactions.findIndex(t => t.id === id && t.userId === user.userId);
    if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    db.transactions.splice(index, 1);
    
    // Also remove any recurring statuses for this transaction
    db.recurringStatuses = db.recurringStatuses.filter(s => s.transactionId !== id);

    await saveDb(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
