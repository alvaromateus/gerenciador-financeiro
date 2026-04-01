import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { InvestmentModel, InvestmentTransactionModel } from '@/models';
import { getUserFromCookies } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  try {
    await connectToDatabase();

    const deleted = await InvestmentModel.findOneAndDelete({ id, userId: user.userId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Remove associated transactions
    await InvestmentTransactionModel.deleteMany({ investmentId: id, userId: user.userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
  }
}
