"use client";

import { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { format, parseISO, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, Edit, CheckCircle2, Circle, ArrowUpRight, ArrowDownRight, RefreshCw, Search, Copy } from 'lucide-react';
import { EntryType, MonthlyOccurrence, Category } from '@/types';

const CATEGORIES: Category[] = [
  'Mercado', 'Farmácia', 'Combustível', 'Vestuário', 'Streaming', 
  'Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Educação', 
  'Lazer', 'Salário', 'Rendimentos', 'Outros'
];

export default function TransactionList() {
  const { currentMonthTransactions, toggleTransactionStatus, deleteTransaction, currentDate, openForm, transactions, copyToCurrentMonth } = useFinance();
  
  // Filter states
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterEntryType, setFilterEntryType] = useState<string>('all');
  const [filterPaidStatus, setFilterPaidStatus] = useState<string>('all');
  const [filterTxType, setFilterTxType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredTransactions = useMemo(() => {
    return currentMonthTransactions.filter(t => {
      if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterEntryType !== 'all' && t.entryType !== filterEntryType) return false;
      if (filterPaidStatus === 'paid' && !t.isPaidInCurrentMonth) return false;
      if (filterPaidStatus === 'unpaid' && t.isPaidInCurrentMonth) return false;
      if (filterTxType !== 'all' && t.type !== filterTxType) return false;
      
      if (showThisWeek) {
        const today = new Date();
        const txDate = parseISO(t.occurrenceDate);
        if (!isSameWeek(txDate, today, { weekStartsOn: 0 })) return false;
      }
      
      return true;
    });
  }, [currentMonthTransactions, searchTerm, filterCategory, filterEntryType, filterPaidStatus, filterTxType, showThisWeek]);

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, curr) => {
        if (curr.entryType === 'income') acc.income += curr.amount;
        else acc.expense += curr.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

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
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Pesquisar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Ex: Mercado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Categoria</label>
            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Entrada/Saída</label>
            <select 
              value={filterEntryType}
              onChange={e => setFilterEntryType(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Repetição</label>
            <select 
              value={filterTxType}
              onChange={e => setFilterTxType(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos</option>
              <option value="one-time">Único</option>
              <option value="recurring">Recorrente</option>
              <option value="fixed">Fixo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1 uppercase">Status</label>
            <select 
              value={filterPaidStatus}
              onChange={e => setFilterPaidStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Pagos e Pendentes</option>
              <option value="paid">Já Pagos</option>
              <option value="unpaid">Pendentes</option>
            </select>
          </div>

          <button 
            onClick={() => setShowThisWeek(!showThisWeek)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              showThisWeek 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-500'
            }`}
          >
            Vencem essa semana
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Registros do Mês</h2>
          
          <div className="flex gap-4 text-sm bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Receitas Filtradas:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(filteredTotals.income)}</span>
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-700"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 dark:text-zinc-400">Despesas Filtradas:</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(filteredTotals.expense)}</span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">
              Nenhum registro corresponde aos filtros selecionados.
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div 
                key={`${transaction.originalId}-${transaction.occurrenceDate}`} 
                className={`p-4 sm:p-6 flex items-center gap-4 transition-all ${
                  transaction.isPaidInCurrentMonth 
                    ? 'opacity-[0.15] grayscale scale-[0.98] select-none hover:opacity-40' 
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
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
                        if (originalTx) copyToCurrentMonth(originalTx);
                      }}
                      className="text-zinc-400 hover:text-emerald-500 transition-colors p-1"
                      title="Copiar para mês atual"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
