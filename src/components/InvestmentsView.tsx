"use client";

import { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { InvestmentType } from '@/types';
import { Plus, X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Trash2, BarChart3 } from 'lucide-react';
import { format, parseISO, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16'];

export default function InvestmentsView() {
  const { currentMonthInvestments, investments, investmentTransactions, addInvestment, addInvestmentTransaction, deleteInvestment } = useFinance();
  
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [txModalInvestmentId, setTxModalInvestmentId] = useState<string | null>(null);
  const [historyModalInvestmentId, setHistoryModalInvestmentId] = useState<string | null>(null);
  
  // Add Form State
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<InvestmentType>('RENDA_FIXA');
  const [initialBalance, setInitialBalance] = useState('');

  // Transaction Modal State
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'YIELD' | 'DIVIDEND'>('DEPOSIT');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [addToMainBalance, setAddToMainBalance] = useState(false);

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
      addToMainBalance: txType === 'DIVIDEND' ? addToMainBalance : undefined
    });

    setTxModalInvestmentId(null);
    setTxAmount('');
    setAddToMainBalance(false);
  };

  const totalCurrent = currentMonthInvestments.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const totalInvested = currentMonthInvestments.reduce((acc, curr) => acc + curr.totalInvested, 0);
  const totalYield = totalCurrent - totalInvested;

  const getHistoryData = (invId: string) => {
    const inv = investments.find(i => i.id === invId);
    if (!inv) return null;

    const txs = investmentTransactions.filter(t => t.investmentId === invId).sort((a, b) => a.date.localeCompare(b.date));
    if (txs.length === 0) return null;

    const firstDate = parseISO(txs[0].date);
    const today = new Date();
    const endRange = firstDate > today ? firstDate : today;
    const months = eachMonthOfInterval({ start: firstDate, end: endRange });

    const timeline: any[] = [];
    const pieMap = new Map<string, number>();

    let runningBalance = 0;
    let runningInvested = 0;

    months.forEach(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthLabel = format(month, 'MMM/yy', { locale: ptBR });

      const monthTxs = txs.filter(t => t.date.startsWith(monthStr));
      let monthYield = 0;

      monthTxs.forEach(tx => {
        if (tx.type === 'DEPOSIT') {
          runningBalance += tx.amount;
          runningInvested += tx.amount;
        } else if (tx.type === 'WITHDRAWAL') {
          runningBalance = Math.max(0, runningBalance - tx.amount);
          runningInvested = Math.max(0, runningInvested - tx.amount);
        } else if (tx.type === 'YIELD') {
          runningBalance += tx.amount;
          monthYield += tx.amount;
        }
      });

      timeline.push({
        name: monthLabel,
        Patrimônio: runningBalance,
        Investido: runningInvested,
      });

      if (monthYield > 0) {
        pieMap.set(monthLabel, (pieMap.get(monthLabel) || 0) + monthYield);
      }
    });

    const pieData = Array.from(pieMap.entries()).map(([name, value]) => ({ name, value }));

    const composition = [
      { name: 'Aportes', value: runningInvested },
      { name: 'Rendimentos', value: Math.max(0, runningBalance - runningInvested) }
    ].filter(item => item.value > 0);

    return { timeline, pieData, composition, invName: inv.name };
  };

  const historyData = historyModalInvestmentId ? getHistoryData(historyModalInvestmentId) : null;

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
                    <div className="flex flex-wrap justify-end gap-2">
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
                      {inv.type === 'ACAO' && (
                        <button 
                          onClick={() => { setTxType('DIVIDEND'); setTxModalInvestmentId(inv.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Provento
                        </button>
                      )}
                      <button 
                        onClick={() => { setTxType('YIELD'); setTxModalInvestmentId(inv.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-lg text-sm font-medium transition-colors"
                        title="Atualizar Saldo Atual (Rendimento)"
                      >
                        <RefreshCw className="w-4 h-4" /> Atualizar
                      </button>
                      <button 
                        onClick={() => setHistoryModalInvestmentId(inv.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 rounded-lg text-sm font-medium transition-colors"
                        title="Ver Desempenho e Histórico"
                      >
                        <BarChart3 className="w-4 h-4" /> Desempenho
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
                  <option value="ACAO">Ações</option>
                  <option value="CRIPTO">Criptomoedas</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Saldo Atual Inicial (Opcional)</label>
                <input type="number" step="0.01" min="0" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0,00" />
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
                {txType === 'DEPOSIT' ? 'Novo Aporte' : txType === 'WITHDRAWAL' ? 'Resgate' : txType === 'DIVIDEND' ? 'Novo Provento' : 'Atualizar Saldo (Rendimento)'}
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

              {txType === 'DIVIDEND' && (
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="addToMainBalance" 
                    checked={addToMainBalance} 
                    onChange={e => setAddToMainBalance(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="addToMainBalance" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Adicionar como receita nas Contas mensais
                  </label>
                </div>
              )}

              <button type="submit" className={`w-full py-3 text-white rounded-lg font-medium transition-colors mt-4 ${txType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : txType === 'WITHDRAWAL' ? 'bg-rose-600 hover:bg-rose-700' : txType === 'DIVIDEND' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                Confirmar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModalInvestmentId && historyData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <h2 className="text-xl font-bold">Desempenho: {historyData.invName}</h2>
              <button onClick={() => setHistoryModalInvestmentId(null)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Line Chart */}
              <div>
                <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4">Evolução do Patrimônio Mês a Mês</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData.timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                      <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="Patrimônio" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Investido" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart: Monthly Increments */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4 text-center">Incrementos de Rendimento por Mês</h3>
                  {historyData.pieData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={historyData.pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {historyData.pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                      Sem rendimentos positivos registrados.
                    </div>
                  )}
                </div>

                {/* Pie Chart: Composition */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4 text-center">Composição Atual (Aportes x Lucro)</h3>
                  {historyData.composition.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={historyData.composition}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" /> {/* Invested */}
                            <Cell fill="#6366f1" /> {/* Yield */}
                          </Pie>
                          <RechartsTooltip formatter={(value: any) => formatCurrency(Number(value))} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-zinc-400 text-sm">
                      Sem saldo ativo.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
