"use client";

import { useFinance } from '@/context/FinanceContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { EntryType, MonthlyOccurrence } from '@/types';

export default function TransactionList() {
  const { currentMonthTransactions, toggleTransactionStatus, deleteTransaction, currentDate, openForm, transactions } = useFinance();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getDayAndMonth = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, "dd 'de' MMM", { locale: ptBR });
    } catch {
      return '';
    }
  };

  if (currentMonthTransactions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
          <RefreshCw className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">Nenhum registro encontrado</h3>
        <p className="text-zinc-500 dark:text-zinc-400">Você não tem receitas ou despesas planejadas para este mês.</p>
      </div>
    );
  }

  const currentMonthYear = format(currentDate, 'yyyy-MM');

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Registros do Mês</h2>
      </div>
      
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {currentMonthTransactions.map((transaction) => (
          <div 
            key={`${transaction.originalId}-${transaction.occurrenceDate}`} 
            className={`p-4 sm:p-6 flex items-center gap-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${transaction.isPaidInCurrentMonth ? 'opacity-75' : ''}`}
          >
            <button
              onClick={() => toggleTransactionStatus(
                transaction.originalId, 
                currentMonthYear, 
                transaction.type === 'recurring' || transaction.type === 'fixed',
                transaction.isPaidInCurrentMonth
              )}
              className="flex-shrink-0 focus:outline-none"
            >
              {transaction.isPaidInCurrentMonth ? (
                <CheckCircle2 className={`w-7 h-7 ${transaction.entryType === 'income' ? 'text-emerald-500' : 'text-indigo-500'}`} />
              ) : (
                <Circle className="w-7 h-7 text-zinc-300 dark:text-zinc-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  transaction.entryType === 'income' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                  {transaction.entryType === 'income' ? 'Receita' : 'Despesa'}
                </span>
                {transaction.type === 'recurring' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                    <RefreshCw className="w-3 h-3" /> Recorrente
                  </span>
                )}
                {transaction.type === 'fixed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <RefreshCw className="w-3 h-3" /> Fixa
                  </span>
                )}
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {transaction.category}
                </span>
              </div>
              <p className={`font-medium text-zinc-900 dark:text-zinc-100 truncate ${transaction.isPaidInCurrentMonth ? 'line-through text-zinc-500 dark:text-zinc-500' : ''}`}>
                {transaction.description}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize mt-0.5">
                Vence: {getDayAndMonth(transaction.occurrenceDate)}
              </p>
            </div>

            <div className="text-right flex flex-col items-end gap-2">
              <div className={`font-semibold flex items-center gap-1 ${
                transaction.entryType === 'income' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : 'text-zinc-900 dark:text-zinc-100'
              }`}>
                {transaction.entryType === 'income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                {formatCurrency(transaction.amount)}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const originalTx = transactions.find(t => t.id === transaction.originalId);
                    if (originalTx) openForm(originalTx);
                  }}
                  className="text-zinc-400 hover:text-indigo-500 transition-colors p-1"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTransaction(transaction.originalId)}
                  className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
