import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TransactionModel, RecurringStatusModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    
    // Use .lean() to convert Mongoose documents to plain JS objects, and map _id out
    const userTransactions = await TransactionModel.find({ userId: user.userId }).lean();
    const cleanTransactions = userTransactions.map(({ _id, __v, ...rest }) => rest);
    
    const userRecurringStatuses = await RecurringStatusModel.find({ userId: user.userId }).lean();
    const cleanStatuses = userRecurringStatuses.map(({ _id, __v, ...rest }) => rest);

    return NextResponse.json({
      transactions: cleanTransactions,
      recurringStatuses: cleanStatuses
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    await connectToDatabase();

    const newTransaction = {
      ...data,
      id: uuidv4(),
      userId: user.userId,
    };

    await TransactionModel.create(newTransaction);

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
