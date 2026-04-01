"use client";

import { useFinance } from '@/context/FinanceContext';
import { ArrowDownCircle, ArrowUpCircle, Wallet, AlertCircle } from 'lucide-react';

export default function Summary() {
  const { summary, pendingSummary } = useFinance();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="text-sm text-white/80 font-medium">Saldo Previsto</p>
            <p className="text-2xl font-bold">
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">
            {pendingSummary.count} {pendingSummary.count === 1 ? 'conta pendente' : 'contas pendentes'} neste mês
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">A receber: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(pendingSummary.toReceive)}</span>
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">A pagar: </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(pendingSummary.toPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
