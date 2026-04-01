"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Summary from "@/components/Summary";
import TransactionList from "@/components/TransactionList";
import TransactionForm from "@/components/TransactionForm";
import InvestmentsView from "@/components/InvestmentsView";
import Auth from "@/components/Auth";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'finance' | 'investments'>('finance');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg max-w-sm mx-auto mb-8">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'finance' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            onClick={() => setActiveTab('finance')}
          >
            Contas Mensais
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'investments' ? 'bg-white dark:bg-zinc-700 text-indigo-600 shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            onClick={() => setActiveTab('investments')}
          >
            Investimentos
          </button>
        </div>

        {activeTab === 'finance' ? (
          <>
            <Summary />
            <TransactionList />
          </>
        ) : (
          <InvestmentsView />
        )}
        
      </main>
      <footer className="w-full text-center py-6 text-sm text-zinc-500 dark:text-zinc-500">
        Desenvolvido por Alvaro Mateus Santana
      </footer>
      {activeTab === 'finance' && <TransactionForm />}
    </div>
  );
}
