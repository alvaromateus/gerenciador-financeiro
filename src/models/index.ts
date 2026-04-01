import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  entryType: { type: String, required: true },
  type: { type: String, required: true },
  category: { type: String, required: true },
  paid: { type: Boolean, default: false },
  dueDate: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  dueDay: { type: Number },
});

export const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

const RecurringStatusSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  monthYear: { type: String, required: true },
  paid: { type: Boolean, required: true },
});

export const RecurringStatusModel = mongoose.models.RecurringStatus || mongoose.model('RecurringStatus', RecurringStatusSchema);

const InvestmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  institution: { type: String, required: true },
  type: { type: String, required: true },
  currentBalance: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
});

export const InvestmentModel = mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema);

const InvestmentTransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  investmentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
});

export const InvestmentTransactionModel = mongoose.models.InvestmentTransaction || mongoose.model('InvestmentTransaction', InvestmentTransactionSchema);
