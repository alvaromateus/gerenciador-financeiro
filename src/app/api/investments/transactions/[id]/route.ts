import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InvestmentModel, InvestmentTransactionModel, TransactionModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    await connectToDatabase();
    
    const tx = await InvestmentTransactionModel.findOne({ id, userId: user.userId });
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const investment = await InvestmentModel.findOne({ id: tx.investmentId, userId: user.userId });
    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });

    let newCurrentBalance = investment.currentBalance;
    let newTotalInvested = investment.totalInvested;

    // Reverse the transaction impact
    if (tx.type === 'DEPOSIT') {
      newCurrentBalance -= tx.amount;
      newTotalInvested -= tx.amount;
    } else if (tx.type === 'WITHDRAWAL') {
      newCurrentBalance += tx.amount;
      newTotalInvested += tx.amount;
    } else if (tx.type === 'YIELD') {
      newCurrentBalance -= tx.amount;
    } else if (tx.type === 'DIVIDEND') {
      newCurrentBalance -= tx.amount;
    }

    await InvestmentTransactionModel.deleteOne({ id, userId: user.userId });
    
    await InvestmentModel.findOneAndUpdate(
      { id: tx.investmentId, userId: user.userId },
      { $set: { currentBalance: newCurrentBalance, totalInvested: newTotalInvested } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const { amount, date } = await req.json();
    await connectToDatabase();
    
    const tx = await InvestmentTransactionModel.findOne({ id, userId: user.userId });
    if (!tx) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const investment = await InvestmentModel.findOne({ id: tx.investmentId, userId: user.userId });
    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });

    const numAmount = parseFloat(amount);
    const diff = numAmount - tx.amount;

    let newCurrentBalance = investment.currentBalance;
    let newTotalInvested = investment.totalInvested;

    // Apply the difference
    if (tx.type === 'DEPOSIT') {
      newCurrentBalance += diff;
      newTotalInvested += diff;
    } else if (tx.type === 'WITHDRAWAL') {
      newCurrentBalance -= diff;
      newTotalInvested -= diff;
    } else if (tx.type === 'YIELD' || tx.type === 'DIVIDEND') {
      newCurrentBalance += diff;
    }

    await InvestmentTransactionModel.findOneAndUpdate(
      { id, userId: user.userId },
      { $set: { amount: numAmount, date } }
    );
    
    await InvestmentModel.findOneAndUpdate(
      { id: tx.investmentId, userId: user.userId },
      { $set: { currentBalance: newCurrentBalance, totalInvested: newTotalInvested } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
