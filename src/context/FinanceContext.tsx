"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, MonthlyOccurrence, RecurringPaymentStatus, EntryType } from '@/types';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, isBefore, isAfter, format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { useAuth } from './AuthContext';

interface FinanceContextProps {
  currentDate: Date;
  transactions: Transaction[];
  recurringStatuses: RecurringPaymentStatus[];
  currentMonthTransactions: MonthlyOccurrence[];
  summary: { income: number; expense: number; balance: number };
  pendingSummary: { toReceive: number; toPay: number; count: number };
  isFormOpen: boolean;
  editingTransaction: Transaction | null;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'userId'>) => Promise<void>;
  toggleTransactionStatus: (transactionId: string, monthYear: string, isRecurring: boolean, currentPaidState: boolean) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  nextMonth: () => void;
  prevMonth: () => void;
  goToCurrentMonth: () => void;
  openForm: (transaction?: Transaction) => void;
  closeForm: () => void;
  importData: (jsonData: any) => Promise<void>;
  copyToCurrentMonth: (transaction: Transaction) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextProps | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringStatuses, setRecurringStatuses] = useState<RecurringPaymentStatus[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (user) {
      fetch('/api/transactions')
        .then(res => res.json())
        .then(data => {
          setTransactions(data.transactions || []);
          setRecurringStatuses(data.recurringStatuses || []);
        });
    } else {
      setTransactions([]);
      setRecurringStatuses([]);
    }
  }, [user]);

  const importData = async (jsonData: any) => {
    const res = await fetch('/api/transactions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData)
    });
    if (res.ok) {
      const dataRes = await fetch('/api/transactions');
      const data = await dataRes.json();
      setTransactions(data.transactions || []);
      setRecurringStatuses(data.recurringStatuses || []);
    } else {
      throw new Error('Falha ao importar dados');
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    if (res.ok) {
      const newTransaction = await res.json();
      setTransactions((prev) => [...prev, newTransaction]);
    }
  };

  const updateTransaction = async (id: string, transactionData: Omit<Transaction, 'id' | 'userId'>) => {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData)
    });
    if (res.ok) {
      const updated = await res.json();
      setTransactions((prev) => prev.map(t => t.id === id ? updated : t));
    }
  };

  const copyToCurrentMonth = async (transaction: Transaction) => {
    const dueDay = transaction.dueDate ? parseISO(transaction.dueDate).getDate() : transaction.dueDay || 1;
    const newDueDate = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), dueDay), 'yyyy-MM-dd');
    
    await addTransaction({
      description: `${transaction.description} (Cópia)`,
      amount: transaction.amount,
      entryType: transaction.entryType,
      type: 'one-time',
      category: transaction.category,
      paid: false,
      dueDate: newDueDate,
    });
  };

  const toggleTransactionStatus = async (transactionId: string, monthYear: string, isRecurring: boolean, currentPaidState: boolean) => {
    const res = await fetch('/api/transactions/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, monthYear, paid: !currentPaidState, isRecurring })
    });

    if (res.ok) {
      if (isRecurring) {
        setRecurringStatuses((prev) => {
          const existing = prev.find(s => s.transactionId === transactionId && s.monthYear === monthYear);
          if (existing) {
            return prev.map(s => s.transactionId === transactionId && s.monthYear === monthYear ? { ...s, paid: !currentPaidState } : s);
          } else {
            return [...prev, { transactionId, userId: user!.id, monthYear, paid: !currentPaidState }];
          }
        });
      } else {
        setTransactions((prev) => prev.map(t => t.id === transactionId ? { ...t, paid: !currentPaidState } : t));
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTransactions((prev) => prev.filter(t => t.id !== id));
      setRecurringStatuses((prev) => prev.filter(s => s.transactionId !== id));
    }
  };

  const openForm = (transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToCurrentMonth = () => setCurrentDate(new Date());

  // Calculate transactions for current viewed month
  const currentMonthTransactions: MonthlyOccurrence[] = React.useMemo(() => {
    const startOfView = startOfMonth(currentDate);
    const endOfView = endOfMonth(currentDate);
    const currentMonthYear = format(currentDate, 'yyyy-MM');
    const realCurrentMonthYear = format(new Date(), 'yyyy-MM');

    const occurrences: MonthlyOccurrence[] = [];

    transactions.forEach(transaction => {
      if (transaction.type === 'one-time' && transaction.dueDate) {
        const dueDate = parseISO(transaction.dueDate);
        if (isWithinInterval(dueDate, { start: startOfView, end: endOfView })) {
          occurrences.push({
            ...transaction,
            originalId: transaction.id,
            occurrenceDate: transaction.dueDate,
            isPaidInCurrentMonth: transaction.paid,
          });
        }
      } else if (transaction.type === 'recurring' && transaction.startDate) {
        const startDate = parseISO(transaction.startDate);
        const endDate = transaction.endDate ? parseISO(transaction.endDate) : new Date(2100, 11, 31);
        
        // If the recurring transaction is active during this month
        if (isBefore(startDate, endOfView) && isAfter(endDate, startOfView)) {
          // Find if there is a specific status for this month
          const monthStatus = recurringStatuses.find(
            s => s.transactionId === transaction.id && s.monthYear === currentMonthYear
          );
          
          const isPaid = monthStatus ? monthStatus.paid : false;
          
          // Occurrence date should be the day of the start date, but in the current viewed month
          const occurrenceDay = startDate.getDate();
          let occurrenceDateStr = `${currentMonthYear}-${occurrenceDay.toString().padStart(2, '0')}`;
          
          occurrences.push({
            ...transaction,
            originalId: transaction.id,
            occurrenceDate: occurrenceDateStr,
            isPaidInCurrentMonth: isPaid,
          });
        }
      } else if (transaction.type === 'fixed' && transaction.dueDay) {
        // Find if there is a specific status for this month
        const monthStatus = recurringStatuses.find(
          s => s.transactionId === transaction.id && s.monthYear === currentMonthYear
        );
        
        const isPaid = monthStatus ? monthStatus.paid : false;
        
        // Hide fixed transactions in past months if they weren't paid
        if (currentMonthYear < realCurrentMonthYear && !isPaid) {
          return;
        }

        const occurrenceDateStr = `${currentMonthYear}-${transaction.dueDay.toString().padStart(2, '0')}`;
        
        occurrences.push({
          ...transaction,
          originalId: transaction.id,
          occurrenceDate: occurrenceDateStr,
          isPaidInCurrentMonth: isPaid,
        });
      }
    });

    return occurrences.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
  }, [transactions, currentDate, recurringStatuses]);

  const summary = React.useMemo(() => {
    return currentMonthTransactions.reduce(
      (acc, curr) => {
        if (curr.entryType === 'income') {
          acc.income += curr.amount;
          acc.balance += curr.amount;
        } else {
          acc.expense += curr.amount;
          acc.balance -= curr.amount;
        }
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }, [currentMonthTransactions]);

  const pendingSummary = React.useMemo(() => {
    return currentMonthTransactions.reduce(
      (acc, curr) => {
        if (!curr.isPaidInCurrentMonth) {
          acc.count += 1;
          if (curr.entryType === 'income') {
            acc.toReceive += curr.amount;
          } else {
            acc.toPay += curr.amount;
          }
        }
        return acc;
      },
      { toReceive: 0, toPay: 0, count: 0 }
    );
  }, [currentMonthTransactions]);

  return (
    <FinanceContext.Provider value={{
      currentDate,
      transactions,
      recurringStatuses,
      currentMonthTransactions,
      summary,
      pendingSummary,
      isFormOpen,
      editingTransaction,
      addTransaction,
      updateTransaction,
      toggleTransactionStatus,
      deleteTransaction,
      nextMonth,
      prevMonth,
      goToCurrentMonth,
      openForm,
      closeForm,
      importData,
      copyToCurrentMonth
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
