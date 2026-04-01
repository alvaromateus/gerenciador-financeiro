"use client";

import { useFinance } from '@/context/FinanceContext';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, LogOut, Download, Upload } from 'lucide-react';
import { useRef } from 'react';

export default function Header() {
  const { currentDate, nextMonth, prevMonth, goToCurrentMonth, transactions, recurringStatuses, importData } = useFinance();
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify({ transactions, recurringStatuses }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importData(json);
        alert('Dados importados com sucesso!');
      } catch (error) {
        alert('Erro ao importar arquivo JSON. Verifique se o formato está correto.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">Gerenciador Financeiro</span>
        </h1>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-800 rounded-full p-1 mr-2">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button 
              onClick={goToCurrentMonth}
              className="min-w-[120px] text-center font-medium capitalize hover:text-indigo-600 transition-colors"
            >
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </button>
            
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-700 pr-4 mr-2">
            <button 
              onClick={handleExport}
              className="p-2 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="Exportar Dados"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Importar Dados"
            >
              <Upload className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden md:block">
              Olá, {user?.username}
            </span>
            <button 
              onClick={logout}
              className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
