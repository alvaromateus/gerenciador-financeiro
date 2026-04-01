export type Category = 
  | 'Mercado' 
  | 'Farmácia' 
  | 'Combustível' 
  | 'Vestuário' 
  | 'Streaming' 
  | 'Moradia' 
  | 'Transporte' 
  | 'Alimentação' 
  | 'Saúde' 
  | 'Educação' 
  | 'Lazer' 
  | 'Salário'
  | 'Rendimentos'
  | 'Outros';

export type TransactionType = 'one-time' | 'recurring' | 'fixed';
export type EntryType = 'income' | 'expense';

export type InvestmentType = 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'CRIPTO' | 'OUTROS';
export type InvestmentTxType = 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  institution: string;
  type: InvestmentType;
  currentBalance: number;
  totalInvested: number;
}

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  userId: string;
  type: InvestmentTxType;
  amount: number;
  date: string;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  entryType: EntryType;
  type: TransactionType;
  category: Category;
  paid: boolean;
  dueDate?: string; // For one-time: YYYY-MM-DD
  startDate?: string; // For recurring: YYYY-MM-DD
  endDate?: string; // For recurring: YYYY-MM-DD (optional)
  dueDay?: number; // For fixed: 1-31
}

export interface MonthlyOccurrence extends Transaction {
  originalId: string;
  occurrenceDate: string; // The specific date this occurrence happens
  isPaidInCurrentMonth: boolean; // Override paid status for recurring
}

// We will store actual payments for recurring transactions to track them month by month.
export interface RecurringPaymentStatus {
  transactionId: string;
  userId: string;
  monthYear: string; // YYYY-MM format
  paid: boolean;
}
