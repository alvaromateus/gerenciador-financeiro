"use client";

import Header from "@/components/Header";
import Summary from "@/components/Summary";
import TransactionList from "@/components/TransactionList";
import TransactionForm from "@/components/TransactionForm";
import Auth from "@/components/Auth";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();

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
        <Summary />
        <TransactionList />
      </main>
      <TransactionForm />
    </div>
  );
}
