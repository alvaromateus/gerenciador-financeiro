import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InvestmentModel, InvestmentTransactionModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectToDatabase();
    
    const userInvestments = await InvestmentModel.find({ userId: user.userId }).lean();
    const cleanInvestments = userInvestments.map(({ _id, __v, ...rest }) => rest);
    
    const userTransactions = await InvestmentTransactionModel.find({ userId: user.userId }).lean();
    const cleanTransactions = userTransactions.map(({ _id, __v, ...rest }) => rest);

    return NextResponse.json({
      investments: cleanInvestments,
      transactions: cleanTransactions
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    await connectToDatabase();

    const newInvestment = {
      ...data,
      id: uuidv4(),
      userId: user.userId,
      currentBalance: data.currentBalance || 0,
      totalInvested: data.totalInvested || 0,
    };

    await InvestmentModel.create(newInvestment);

    if (newInvestment.currentBalance > 0) {
      await InvestmentTransactionModel.create({
        id: uuidv4(),
        investmentId: newInvestment.id,
        userId: user.userId,
        type: 'DEPOSIT',
        amount: newInvestment.currentBalance,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return NextResponse.json(newInvestment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create investment' }, { status: 500 });
  }
}
