"use client";

import { useFinance } from '@/context/FinanceContext';
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';

export default function Summary() {
  const { summary } = useFinance();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <ArrowUpCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Receitas</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(summary.income)}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <ArrowDownCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Despesas</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatCurrency(summary.expense)}
          </p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${
        summary.balance >= 0 
          ? 'bg-indigo-600 text-white border-indigo-500 dark:border-indigo-700' 
          : 'bg-rose-600 text-white border-rose-500 dark:border-rose-700'
      }`}>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-white/80 font-medium">Saldo Atual</p>
          <p className="text-2xl font-bold">
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>
    </div>
  );
}
