import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InvestmentModel, InvestmentTransactionModel, TransactionModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    const { type, amount, date, addToMainBalance } = await req.json();
    await connectToDatabase();

    const investment = await InvestmentModel.findOne({ id, userId: user.userId });
    if (!investment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const numAmount = parseFloat(amount);

    let newCurrentBalance = investment.currentBalance;
    let newTotalInvested = investment.totalInvested;

    if (type === 'DEPOSIT') {
      newCurrentBalance += numAmount;
      newTotalInvested += numAmount;
    } else if (type === 'WITHDRAWAL') {
      newCurrentBalance = Math.max(0, newCurrentBalance - numAmount);
      newTotalInvested = Math.max(0, newTotalInvested - numAmount);

      // Auto-create income in main finance area
      await TransactionModel.create({
        id: uuidv4(),
        userId: user.userId,
        description: `Resgate: ${investment.name}`,
        amount: numAmount,
        entryType: 'income',
        type: 'one-time',
        category: 'Rendimentos',
        paid: true,
        dueDate: date,
      });
      
    } else if (type === 'YIELD') {
      // For Yield, user sends the NEW total balance. We calculate the difference.
      const difference = numAmount - investment.currentBalance;
      newCurrentBalance = numAmount;
      // totalInvested remains the same, as this is yield, not new principal.
      
      // we store the difference as the transaction amount so it reflects the gain/loss
      await InvestmentTransactionModel.create({
        id: uuidv4(),
        investmentId: id,
        userId: user.userId,
        type: 'YIELD',
        amount: difference,
        date,
      });
    } else if (type === 'DIVIDEND') {
      newCurrentBalance += numAmount;
      // totalInvested remains the same for dividends

      if (addToMainBalance) {
        // Create income in main finance area
        await TransactionModel.create({
          id: uuidv4(),
          userId: user.userId,
          description: `Provento: ${investment.name}`,
          amount: numAmount,
          entryType: 'income',
          type: 'one-time',
          category: 'Rendimentos',
          paid: true,
          dueDate: date,
        });
      }
    }

    if (type !== 'YIELD') {
      await InvestmentTransactionModel.create({
        id: uuidv4(),
        investmentId: id,
        userId: user.userId,
        type,
        amount: numAmount,
        date,
      });
    }

    const updated = await InvestmentModel.findOneAndUpdate(
      { id, userId: user.userId },
      { $set: { currentBalance: newCurrentBalance, totalInvested: newTotalInvested } },
      { new: true }
    ).lean();

    const { _id, __v, ...cleanUpdated } = updated;
    return NextResponse.json(cleanUpdated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 });
  }
}
