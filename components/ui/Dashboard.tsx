'use client';

import React from 'react';
import { DotGridProgress } from './charts/DotGridProgress';
import { SmartBudgetFlow } from './charts/SmartBudgetFlow';
import { OnboardingModal } from './OnboardingModal';
import { SavingsPage } from './SavingsPage';
import { AreaChart } from './charts/AreaChart';
import { TotalSavingsChart } from './charts/TotalSavingsChart';
import { AIInputHub } from './AIInputHub';
import { Transaction, TrendData } from '@/lib/constants';
import { BudgetState, BudgetCategory, BudgetGoal } from '@/lib/budgetTypes';
import { Sparkles, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, ArrowRight } from 'lucide-react';

interface DashboardProps {
  activeTab: string;
  savingsGoals: any[]; // Deprecated, we use internal state now or passed props
  transactions: Transaction[];
  onAnalyze: (text: string, image?: File) => void;
  isLoading: boolean;
  parsedResult: Transaction | null;
  onConfirmTransaction: () => void;
  uploadStatus?: string;
  walletAddress?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeTab,
  savingsGoals,
  transactions,
  onAnalyze,
  isLoading,
  parsedResult,
  onConfirmTransaction,
  uploadStatus,
  walletAddress
}) => {
  // Budget State
  const [budgetState, setBudgetState] = React.useState<BudgetState>({
    monthlyIncome: 0, // Initial 0 to trigger onboarding
    categories: [
      { name: 'Rent & Bills', budgetLimit: 0, currentSpent: 0 },
      { name: 'Food', budgetLimit: 0, currentSpent: 0 },
      { name: 'Shopping', budgetLimit: 0, currentSpent: 0 },
      { name: 'Transport', budgetLimit: 0, currentSpent: 0 },
      { name: 'Entertainment', budgetLimit: 0, currentSpent: 0 },
      { name: 'Investments', budgetLimit: 0, currentSpent: 0 },
    ],
    goals: []
  });
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const [onboardingMode, setOnboardingMode] = React.useState<'setup' | 'add-goals'>('setup');

  // Check for onboarding trigger when user navigates to budgeting or savings tabs
  React.useEffect(() => {
    // Only show onboarding if budget is not set up AND user visits budgeting/savings tab
    if (budgetState.monthlyIncome === 0 && (activeTab === 'budgeting' || activeTab === 'savings')) {
      setOnboardingMode('setup');
      setShowOnboarding(true);
    }
  }, [activeTab, budgetState.monthlyIncome]);

  const handleOnboardingComplete = (income: number, categories: BudgetCategory[], goals: BudgetGoal[]) => {
    setBudgetState(prev => ({
      ...prev,
      monthlyIncome: income > 0 ? income : prev.monthlyIncome,
      categories: categories.length > 0 ? categories : prev.categories,
      goals: goals  // The modal already handles merging in 'add-goals' mode
    }));
    setShowOnboarding(false);
  };

  const handleOpenAddGoals = () => {
    setOnboardingMode('add-goals');
    setShowOnboarding(true);
  };

  const handleIncomeUpdate = (newIncome: number) => {
    setBudgetState(prev => ({ ...prev, monthlyIncome: newIncome }));
  };

  const handleGoalMoneyAction = (goalId: string, amount: number, actionType: 'add' | 'withdraw') => {
    setBudgetState(prev => ({
      ...prev,
      goals: prev.goals.map(goal => {
        if (goal.id === goalId) {
          const newAmount = actionType === 'add'
            ? goal.currentSaved + amount
            : Math.max(0, goal.currentSaved - amount);
          return { ...goal, currentSaved: newAmount };
        }
        return goal;
      })
    }));
  };

  // Format wallet address: 0x1234...5678
  const formatAddress = (addr?: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  // Calculate category breakdown for expenses
  const categoryBreakdown = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  // Merge real spending into budget categories
  const displayCategories = React.useMemo(() => {
    return budgetState.categories.map(cat => ({
      ...cat,
      currentSpent: categoryBreakdown[cat.name] || 0
    }));
  }, [budgetState.categories, categoryBreakdown]);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, amount]) => ({
      label: category,
      amount,
      percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      color: 'bg-primary'
    }));

  // Generate chart data for TotalSavingsChart - group by month
  const chartData = React.useMemo(() => {
    if (transactions.length === 0) {
      // If no transactions, show current month with zero data
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
      return [{ month: currentMonth, savings: 0, expenses: 0 }];
    }

    // Group transactions by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(t => {
      const monthKey = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    // Convert to chart format and sort by date
    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, data]) => ({
        month: new Date(month).toLocaleDateString('en-US', { month: 'short' }),
        savings: data.income,
        expenses: -data.expense // Negative for chart display
      }));
  }, [transactions]);

  // Mock data for charts
  const sankeyData = {
    nodes: [
      { name: "Monthly Income" }, // 0
      { name: "Rent & Bills" }, // 1
      { name: "Food" }, // 2
      { name: "Shopping" }, // 3
      { name: "Savings" }, // 4
      { name: "Investments" } // 5
    ],
    links: [
      { source: 0, target: 1, value: 1200 },
      { source: 0, target: 2, value: 450 },
      { source: 0, target: 3, value: 300 },
      { source: 0, target: 4, value: 350 },
      { source: 0, target: 5, value: 200 },
    ]
  };

  const trendData = [
    { date: 'Feb 1', amount: 1200 },
    { date: 'Feb 5', amount: 900 },
    { date: 'Feb 10', amount: 1600 },
    { date: 'Feb 15', amount: 1100 },
    { date: 'Feb 20', amount: 2100 },
    { date: 'Feb 25', amount: 1750 },
  ];

  // Circular Gauge Component
  const FinancialHealthGauge = ({ score }: { score: number }) => {
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/20"
          />
          {/* Progress Circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-primary">
          <span className="text-3xl font-bold font-serif">{score}</span>
          <span className="text-[10px] uppercase tracking-wider font-medium">Excellent</span>
        </div>
      </div>
    );
  };

  const renderSavingsView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <SavingsPage
        goals={budgetState.goals}
        onOpenOnboarding={handleOpenAddGoals}
        onGoalAction={handleGoalMoneyAction}
      />
    </div>
  );

  const renderBudgetingView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Budget Flow (Smart Budget) - Full Width */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-primary">Budget Distribution</h2>
                <p className="text-sm text-secondary">Visualizing how your ${budgetState.monthlyIncome.toLocaleString()} monthly income is allocated</p>
              </div>
          </div>
          
          <SmartBudgetFlow 
            monthlyIncome={budgetState.monthlyIncome}
            categories={displayCategories}
            onIncomeUpdate={handleIncomeUpdate}
          />
      </div>

      {/* Spending Trend + Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-primary">Spending Trend</h2>
                <div className="flex gap-2">
                   {['Weekly', 'Monthly', 'Yearly'].map(p => (
                     <button key={p} className={`px-3 py-1 text-xs rounded-full border transition-colors ${p === 'Monthly' ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-gray-200'}`}>
                       {p}
                     </button>
                   ))}
                </div>
              </div>
              <div className="relative">
                <AreaChart data={trendData} height={250} />
              </div>
        </div>

        {/* Budget Stats Side Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="font-bold text-primary mb-6">Top Spending Categories</h3>
            <div className="space-y-6">
              {topCategories.map((cat) => (
                <div key={cat.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-primary">{cat.label}</span>
                    <span className="text-secondary">${cat.amount}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${cat.color}`} style={{ width: `${cat.percent}%` }}></div>
                  </div>
                </div>
              ))}
              {topCategories.length === 0 && (
                <div className="text-center text-secondary py-4">No expenses yet</div>
              )}
            </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsView = () => {
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-xl font-bold text-primary">Recent Transactions</h2>
               <div className="text-sm text-secondary">Total: {transactions.length} transactions</div>
            </div>
            {sortedTransactions.length === 0 ? (
              <div className="text-center py-12 text-secondary">
                <p>No transactions yet. Start adding transactions using the AI input above!</p>
              </div>
            ) : (
              <div className="space-y-1">
                 {sortedTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                              {tx.type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                           </div>
                           <div>
                              <div className="font-medium text-primary">{tx.description}</div>
                              <div className="text-xs text-secondary">
                                {new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} • {tx.category}
                              </div>
                           </div>
                        </div>
                        <div className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                           {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                    </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    );
  };

  const renderDashboardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 items-stretch">
        
        {/* Main Content Area - 2 Columns */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
            
            {/* PART 1: AI Input - Prominent */}
            <AIInputHub 
                onAnalyze={onAnalyze} 
                isLoading={isLoading}
                parsedResult={parsedResult}
                onConfirmTransaction={onConfirmTransaction}
            />

            {/* PART 2: Total Savings Chart */}
            <div className="bg-primary rounded-3xl p-6 shadow-sm border border-gray-800 text-white flex-1">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-200">Income vs Expenses</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                             <span className="text-3xl font-bold text-white">${netAmount.toFixed(2)}</span>
                             <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${netAmount >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                               {netAmount >= 0 ? '↗' : '↘'} Net
                             </span>
                        </div>
                    </div>
                    <div className="flex gap-4 text-xs">
                        <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-[#5C8D75]"></div>
                             <span className="text-gray-400">Income</span>
                        </div>
                        <div className="flex items-center gap-1">
                             <div className="w-2 h-2 rounded-full bg-[#E5889E]"></div>
                             <span className="text-gray-400">Expense</span>
                        </div>
                    </div>
                </div>
                <TotalSavingsChart data={chartData} height={220} />
            </div>

        </div>

        {/* Right Sidebar - 1 Column */}
        <div className="space-y-6 flex flex-col h-full">
            
             {/* AI Insights Card (Financial Health) - Gold Theme */}
             <div className="bg-gradient-to-br from-amber-100 to-accent rounded-3xl p-6 text-primary relative overflow-hidden shadow-sm border border-accent/20">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-4">
                       <FinancialHealthGauge score={76} />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Financial Health Score</h3>
                    <p className="text-sm opacity-80 mb-0">
                       You're spending within your means! Keep it up or set a savings goal.
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl -ml-10 -mb-10"></div>
             </div>

             {/* Monthly Overview Widget - Expanding to align bottom */}
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-lg font-serif font-bold text-primary">Overview</h3>
                       <div className="text-xs text-secondary">All Time</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${netAmount >= 0 ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                       {netAmount >= 0 ? '+' : ''}${netAmount.toFixed(2)}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100">
                       <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase mb-2">
                          <TrendingUp className="w-3 h-3" /> In
                       </div>
                       <div className="text-xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
                    </div>
                    <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100">
                       <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase mb-2">
                          <ArrowDownRight className="w-3 h-3" /> Out
                       </div>
                       <div className="text-xl font-bold text-red-500">${totalExpenses.toFixed(2)}</div>
                    </div>
                 </div>

                 <div className="space-y-3 mt-auto">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top Spending</div>
                    {topCategories.length > 0 ? (
                      topCategories.map((item) => (
                         <div key={item.label} className="flex justify-between items-center">
                            <span className="text-secondary text-sm font-medium">{item.label}</span>
                            <span className="text-primary font-bold">${item.amount.toFixed(2)}</span>
                         </div>
                      ))
                    ) : (
                      <div className="text-center text-secondary text-sm py-2">No expenses yet</div>
                    )}
                 </div>
             </div>
        </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-2xl font-serif font-bold text-primary">
               {activeTab === 'dashboard' && 'Dashboard'}
               {activeTab === 'savings' && 'Savings & Goals'}
               {activeTab === 'budgeting' && 'Budgeting & Expenses'}
               {activeTab === 'transactions' && 'Transactions'}
             </h1>
             <p className="text-secondary text-sm">Welcome back, Alex</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-xs font-medium text-secondary">Network: Sepolia</span>
                </div>
                {walletAddress && (
                  <span className="text-xs text-gray-400 font-mono">
                    {formatAddress(walletAddress)}
                  </span>
                )}
             </div>
             <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" />
             </div>
          </div>
        </div>

        {/* Upload Status Banner */}
        {uploadStatus && (
          <div className="mt-4 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex-shrink-0">
              {uploadStatus.includes('✅') ? (
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              ) : uploadStatus.includes('⚠️') ? (
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              ) : (
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              )}
            </div>
            <span className="text-sm font-medium text-indigo-900">{uploadStatus}</span>
          </div>
        )}
      </header>

      {activeTab === 'dashboard' && renderDashboardView()}
      {activeTab === 'savings' && renderSavingsView()}
      {activeTab === 'budgeting' && renderBudgetingView()}
      {activeTab === 'transactions' && renderTransactionsView()}
      
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        existingGoals={budgetState.goals}
        mode={onboardingMode}
      />
    </div>
  );
};