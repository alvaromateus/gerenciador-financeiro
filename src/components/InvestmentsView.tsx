"use client";

import { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { InvestmentType } from '@/types';
import { Plus, X, TrendingUp, ArrowDownCircle, ArrowUpCircle, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvestmentsView() {
  const { currentMonthInvestments, addInvestment, addInvestmentTransaction, deleteInvestment } = useFinance();
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [txModalInvestmentId, setTxModalInvestmentId] = useState<string | null>(null);
  
  // Add Form State
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<InvestmentType>('RENDA_FIXA');
  const [initialBalance, setInitialBalance] = useState('');

  // Transaction Modal State
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'YIELD'>('DEPOSIT');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !institution) return;

    await addInvestment({
      name,
      institution,
      type,
      currentBalance: initialBalance ? parseFloat(initialBalance) : 0,
      totalInvested: initialBalance ? parseFloat(initialBalance) : 0,
    });

    setName('');
    setInstitution('');
    setType('RENDA_FIXA');
    setInitialBalance('');
    setIsAddFormOpen(false);
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txModalInvestmentId || !txAmount) return;

    await addInvestmentTransaction(txModalInvestmentId, {
      type: txType,
      amount: parseFloat(txAmount),
      date: txDate,
    });

    setTxModalInvestmentId(null);
    setTxAmount('');
  };

  const totalCurrent = currentMonthInvestments.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const totalInvested = currentMonthInvestments.reduce((acc, curr) => acc + curr.totalInvested, 0);
  const totalYield = totalCurrent - totalInvested;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Patrimônio (Neste mês)</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Total Investido (Neste mês)</p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{formatCurrency(totalInvested)}</p>
        </div>
        <div className={`p-6 rounded-2xl shadow-sm border ${totalYield >= 0 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
          <p className="text-sm font-medium opacity-80">Rendimento Acumulado</p>
          <p className="text-xl font-bold mt-1">{totalYield >= 0 ? '+' : ''}{formatCurrency(totalYield)}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Investimentos no período</h2>
          <button 
            onClick={() => setIsAddFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {currentMonthInvestments.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">Nenhum investimento cadastrado ou não há saldo neste mês.</div>
          ) : (
            currentMonthInvestments.map(inv => {
              const yieldValue = inv.currentBalance - inv.totalInvested;
              const yieldPercent = inv.totalInvested > 0 ? (yieldValue / inv.totalInvested) * 100 : 0;

              return (
                <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-medium rounded">
                        {inv.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{inv.institution}</span>
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{inv.name}</h3>
                    
                    <div className="flex gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-zinc-500">Aplicado: </span>
                        <span className="font-medium">{formatCurrency(inv.totalInvested)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Rendimento: </span>
                        <span className={`font-medium ${yieldValue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {yieldValue >= 0 ? '+' : ''}{formatCurrency(yieldValue)} ({yieldPercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(inv.currentBalance)}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setTxType('DEPOSIT'); setTxModalInvestmentId(inv.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Aporte
                      </button>
                      <button 
                        onClick={() => { setTxType('WITHDRAWAL'); setTxModalInvestmentId(inv.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/40 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ArrowDownCircle className="w-4 h-4" /> Resgate
                      </button>
                      <button 
                        onClick={() => { setTxType('YIELD'); setTxModalInvestmentId(inv.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-medium transition-colors"
                        title="Atualizar Saldo Atual (Rendimento)"
                      >
                        <RefreshCw className="w-4 h-4" /> Atualizar
                      </button>
                      <button 
                        onClick={() => deleteInvestment(inv.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors ml-2"
                        title="Excluir Investimento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">Novo Investimento</h2>
              <button onClick={() => setIsAddFormOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInvestment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Ativo / Fundo</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Tesouro Selic 2029" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instituição / Corretora</label>
                <input required type="text" value={institution} onChange={e => setInstitution(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: XP Investimentos" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select value={type} onChange={e => setType(e.target.value as InvestmentType)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="RENDA_FIXA">Renda Fixa</option>
                  <option value="RENDA_VARIAVEL">Renda Variável</option>
                  <option value="CRIPTO">Criptomoedas</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mt-4">
                Cadastrar Investimento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {txModalInvestmentId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-bold">
                {txType === 'DEPOSIT' ? 'Novo Aporte' : txType === 'WITHDRAWAL' ? 'Resgate' : 'Atualizar Saldo (Rendimento)'}
              </h2>
              <button onClick={() => setTxModalInvestmentId(null)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {txType === 'YIELD' ? 'Qual é o NOVO SALDO TOTAL desse investimento hoje?' : 'Valor'}
                </label>
                <input required type="number" step="0.01" min="0" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0,00" />
                {txType === 'YIELD' && <p className="text-xs text-zinc-500 mt-1">O sistema calculará automaticamente o rendimento ou perda com base no saldo anterior.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input required type="date" value={txDate} onChange={e => setTxDate(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <button type="submit" className={`w-full py-3 text-white rounded-lg font-medium transition-colors mt-4 ${txType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : txType === 'WITHDRAWAL' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
