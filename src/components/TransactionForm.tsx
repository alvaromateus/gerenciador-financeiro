"use client";

import { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Category, TransactionType, EntryType } from '@/types';
import { Plus, X } from 'lucide-react';

const CATEGORIES: Category[] = [
  'Mercado', 'Farmácia', 'Combustível', 'Vestuário', 'Streaming', 
  'Moradia', 'Transporte', 'Alimentação', 'Saúde', 'Educação', 
  'Lazer', 'Salário', 'Rendimentos', 'Outros'
];

export default function TransactionForm() {
  const { addTransaction, updateTransaction, isFormOpen, closeForm, openForm, editingTransaction } = useFinance();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [entryType, setEntryType] = useState<EntryType>('expense');
  const [type, setType] = useState<TransactionType>('one-time');
  const [category, setCategory] = useState<Category>('Outros');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dueDay, setDueDay] = useState('');

  useEffect(() => {
    if (editingTransaction && isFormOpen) {
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setEntryType(editingTransaction.entryType);
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setDueDate(editingTransaction.dueDate || '');
      setStartDate(editingTransaction.startDate || '');
      setEndDate(editingTransaction.endDate || '');
      setDueDay(editingTransaction.dueDay?.toString() || '');
    } else if (!isFormOpen) {
      resetForm();
    }
  }, [editingTransaction, isFormOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount) return;
    if (type === 'fixed' && (!dueDay || parseInt(dueDay) < 1 || parseInt(dueDay) > 31)) return;

    const payload = {
      description,
      amount: parseFloat(amount),
      entryType,
      type,
      category,
      paid: editingTransaction ? editingTransaction.paid : false,
      dueDate: type === 'one-time' ? dueDate : undefined,
      startDate: type === 'recurring' ? startDate : undefined,
      endDate: type === 'recurring' && endDate ? endDate : undefined,
      dueDay: type === 'fixed' ? parseInt(dueDay) : undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    closeForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setEntryType('expense');
    setType('one-time');
    setCategory('Outros');
    setDueDate('');
    setStartDate('');
    setEndDate('');
    setDueDay('');
  };

  if (!isFormOpen) {
    return (
      <button 
        onClick={() => openForm()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors z-20"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{editingTransaction ? 'Editar Registro' : 'Novo Registro'}</h2>
          <button onClick={() => closeForm()} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${entryType === 'expense' ? 'bg-white dark:bg-zinc-700 text-rose-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              onClick={() => setEntryType('expense')}
            >
              Despesa
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${entryType === 'income' ? 'bg-white dark:bg-zinc-700 text-emerald-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              onClick={() => setEntryType('income')}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Descrição</label>
            <input 
              required
              type="text" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
              placeholder="Ex: Conta de Luz"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                placeholder="0,00"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoria</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'one-time' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              onClick={() => setType('one-time')}
            >
              Único Mês
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'recurring' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              onClick={() => setType('recurring')}
            >
              Recorrente
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${type === 'fixed' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400'}`}
              onClick={() => setType('fixed')}
            >
              Fixa
            </button>
          </div>

          {type === 'one-time' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data de Vencimento</label>
              <input 
                required
                type="date" 
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
              />
            </div>
          )}
          
          {type === 'recurring' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data de Início</label>
                <input 
                  required
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data de Fim (Opcional)</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {type === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dia do Vencimento (1-31)</label>
              <input 
                required
                type="number" 
                min="1"
                max="31"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-100"
                placeholder="Ex: 10"
              />
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
