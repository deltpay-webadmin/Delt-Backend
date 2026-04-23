import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function Financials() {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sample financial data
  const financialData = {
    revenue: {
      total: 427000,
      change: 12.5,
      trend: 'up' as const
    },
    expenses: {
      total: 185000,
      change: -3.2,
      trend: 'down' as const
    },
    netProfit: {
      total: 242000,
      change: 18.7,
      trend: 'up' as const
    },
    cashFlow: {
      total: 215000,
      change: 8.4,
      trend: 'up' as const
    }
  };

  const revenueBreakdown = [
    { category: 'MCA Interest Income', amount: 285000, percentage: 66.7, color: 'emerald' },
    { category: 'Lease Commissions', amount: 95000, percentage: 22.2, color: 'blue' },
    { category: 'Residual Income', amount: 47000, percentage: 11.1, color: 'purple' },
  ];

  const expenseBreakdown = [
    { category: 'Sales Rep Commissions', amount: 75000, percentage: 40.5, color: 'red' },
    { category: 'Cost of Capital', amount: 65000, percentage: 35.1, color: 'orange' },
    { category: 'Deployment Fees', amount: 28000, percentage: 15.1, color: 'amber' },
    { category: 'Operating Expenses', amount: 17000, percentage: 9.2, color: 'gray' },
  ];

  const recentTransactions = [
    { id: 1, date: '2026-01-02', description: 'MCA Payment - Eric Spirtas', amount: 18000, type: 'income' },
    { id: 2, date: '2026-01-02', description: 'Commission - Patrick Johnson', amount: -5000, type: 'expense' },
    { id: 3, date: '2026-01-01', description: 'Lease Commission - Francia Carabetta', amount: 8500, type: 'income' },
    { id: 4, date: '2025-12-30', description: 'Deployment Fee - Tech Solutions LLC', amount: -3200, type: 'expense' },
    { id: 5, date: '2025-12-28', description: 'MCA Payment - Downtown Retail Co', amount: 12000, type: 'income' },
  ];

  const getColorClass = (color: string, type: 'bg' | 'text' | 'border') => {
    const colors: Record<string, Record<string, string>> = {
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' },
      orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' },
      gray: { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-200' },
    };
    return colors[color]?.[type] || colors.gray[type];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl mb-2">Financials</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Track revenue, expenses, and cash flow across all deals
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <span className="text-sm font-semibold text-gray-700 mr-2">Period:</span>
        <div className="flex gap-2">
          {(['month', 'quarter', 'year', 'custom'] as const).map(period => (
            <button
              key={period}
              onClick={() => {
                setSelectedPeriod(period);
                if (period === 'custom') {
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(false);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPeriod === period
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 'month' ? 'This Month' : period === 'quarter' ? 'This Quarter' : period === 'year' ? 'This Year' : 'Custom'}
            </button>
          ))}
        </div>
        {showDatePicker && (
          <div className="flex gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${financialData.revenue.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {financialData.revenue.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(financialData.revenue.change)}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
          <p className="text-2xl sm:text-3xl text-gray-900">${financialData.revenue.total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${financialData.expenses.trend === 'down' ? 'text-emerald-600' : 'text-red-600'}`}>
              {financialData.expenses.trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              {Math.abs(financialData.expenses.change)}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl sm:text-3xl text-gray-900">${financialData.expenses.total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${financialData.netProfit.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {financialData.netProfit.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(financialData.netProfit.change)}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Net Profit</p>
          <p className="text-2xl sm:text-3xl text-gray-900">${financialData.netProfit.total.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${financialData.cashFlow.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
              {financialData.cashFlow.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(financialData.cashFlow.change)}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Cash Flow</p>
          <p className="text-2xl sm:text-3xl text-gray-900">${financialData.cashFlow.total.toLocaleString()}</p>
        </div>
      </div>

      {/* Revenue & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg">Revenue Breakdown</h3>
          </div>
          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.category}</span>
                  <span className="text-sm font-semibold text-gray-900">${item.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${getColorClass(item.color, 'bg')} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h3 className="text-lg">Expense Breakdown</h3>
          </div>
          <div className="space-y-4">
            {expenseBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">{item.category}</span>
                  <span className="text-sm font-semibold text-gray-900">${item.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${getColorClass(item.color, 'bg')} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-12 text-right">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Description</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-right py-3 px-4">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4">{transaction.description}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                      transaction.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {transaction.type === 'income' ? '+' : ''}{transaction.amount < 0 ? transaction.amount : `$${transaction.amount.toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}