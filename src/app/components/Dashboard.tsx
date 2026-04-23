import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  Percent,
  Target,
  Download,
  Mail
} from 'lucide-react';
import { getAllDeals } from '../utils/api';

interface Deal {
  id: string;
  dealName: string;
  borrower: string;
  status: 'Pending' | 'Funded' | 'Declined';
  loanAmountReceived: number;
  repaymentAmountDue: number;
  grossInterest: number;
  issuer: string;
  amountIssued: number;
  borrowerInfo: any;
  metrics: any;
  recommendation: any;
  createdAt: string;
  updatedAt: string;
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    principalAmount?: number;
    factorRateAmount?: number;
  }>;
  netProfit?: number;
  grossProfit?: number;
  dealType?: 'MCA' | 'Lease Commissions' | 'Residual Income';
  upfrontCommission?: number;
  monthlyCommissionAmount?: number;
  averageMonthlyVolume?: number;
}

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showRecentDeals, setShowRecentDeals] = useState(true);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load deals from database
  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const result = await getAllDeals();
    if (result.success && result.deals) {
      setDeals(result.deals);
    }
    setLoading(false);
  };

  // Calculate portfolio analytics
  const portfolioAnalytics = React.useMemo(() => {
    const fundedDeals = deals.filter(d => d.status === 'Funded');
    
    // Calculate total principal outstanding
    const totalPrincipalOutstanding = fundedDeals.reduce((sum, deal) => {
      const totalPaid = (deal.paymentHistory || []).reduce((paidSum, payment) => 
        paidSum + (payment.principalAmount || 0), 0
      );
      const principal = deal.loanAmountReceived || 0;
      return sum + (principal - totalPaid);
    }, 0);

    // Calculate total payments received
    const totalPaymentsReceived = fundedDeals.reduce((sum, deal) => {
      return sum + (deal.paymentHistory || []).reduce((paidSum, payment) => 
        paidSum + payment.amount, 0
      );
    }, 0);

    // Calculate total profit realized (from completed payments)
    const totalProfitRealized = fundedDeals.reduce((sum, deal) => {
      return sum + (deal.paymentHistory || []).reduce((profitSum, payment) => 
        profitSum + (payment.factorRateAmount || 0), 0
      );
    }, 0);

    // Calculate expected total profit
    const expectedTotalProfit = fundedDeals.reduce((sum, deal) => 
      sum + ((deal.repaymentAmountDue || 0) - (deal.loanAmountReceived || 0)), 0
    );

    // Portfolio health score (0-100)
    const totalExpectedRepayment = fundedDeals.reduce((sum, deal) => 
      sum + (deal.repaymentAmountDue || 0), 0
    );
    const portfolioHealthScore = totalExpectedRepayment > 0 
      ? Math.round((totalPaymentsReceived / totalExpectedRepayment) * 100)
      : 0;

    // Average portfolio ROI
    const totalDeployed = fundedDeals.reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0);
    const avgROI = totalDeployed > 0 
      ? ((expectedTotalProfit / totalDeployed) * 100).toFixed(1)
      : '0.0';

    return {
      totalPrincipalOutstanding,
      totalPaymentsReceived,
      totalProfitRealized,
      expectedTotalProfit,
      portfolioHealthScore,
      avgROI,
      totalDeployed
    };
  }, [deals]);

  // Calculate real stats from database
  const stats = {
    totalDeployed: deals.filter(d => d.status === 'Funded').reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0),
    totalRevenue: deals.filter(d => d.status === 'Funded').reduce((sum, d) => sum + ((d.repaymentAmountDue || 0) - (d.loanAmountReceived || 0)), 0),
    activeDeals: deals.filter(d => d.status === 'Funded' || d.status === 'Pending').length,
    avgDealSize: deals.filter(d => d.status === 'Funded').length > 0 
      ? Math.round(deals.filter(d => d.status === 'Funded').reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0) / deals.filter(d => d.status === 'Funded').length)
      : 0,
    monthlyGrowth: 0, // Would need historical data
    revenueGrowth: 0, // Would need historical data
    approvalRate: deals.length > 0 ? Math.round((deals.filter(d => d.status === 'Funded').length / deals.length) * 100) : 0,
    avgFactorRate: deals.filter(d => d.status === 'Funded').length > 0
      ? (deals.filter(d => d.status === 'Funded').reduce((sum, d) => sum + (d.grossInterest || 0), 0) / deals.filter(d => d.status === 'Funded').length).toFixed(2)
      : 0
  };

  const statusBreakdown = {
    approved: deals.filter(d => d.status === 'Funded').length,
    review: deals.filter(d => d.status === 'Pending').length,
    declined: deals.filter(d => d.status === 'Declined').length,
    funded: deals.filter(d => d.status === 'Funded').length
  };

  // Recent deals sorted by date
  const recentDeals = [...deals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(deal => ({
      id: deal.id,
      name: deal.dealName || deal.borrower,
      amount: deal.loanAmountReceived || 0,
      status: deal.status,
      date: new Date(deal.createdAt).toLocaleDateString(),
      factorRate: deal.grossInterest || 0,
      merchant: deal.borrower
    }));

  const exportPortfolioReport = () => {
    // Create CSV content
    const headers = ['Deal Name', 'Merchant', 'Status', 'Loan Amount', 'Repayment Due', 'Payments Received', 'Principal Outstanding', 'Profit Realized', 'Date'];
    const rows = deals.map(deal => {
      const totalPaid = (deal.paymentHistory || []).reduce((sum, p) => sum + (p.principalAmount || 0), 0);
      const principalOutstanding = (deal.loanAmountReceived || 0) - totalPaid;
      const paymentsReceived = (deal.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
      const profitRealized = (deal.paymentHistory || []).reduce((sum, p) => sum + (p.factorRateAmount || 0), 0);
      
      return [
        deal.dealName || deal.borrower,
        deal.borrower,
        deal.status,
        deal.loanAmountReceived || 0,
        deal.repaymentAmountDue || 0,
        paymentsReceived,
        principalOutstanding,
        profitRealized,
        new Date(deal.createdAt).toLocaleDateString()
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delt-pay-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Funded':
      case 'Approved':
        return 'text-emerald-700 bg-emerald-50';
      case 'Pending':
      case 'Review':
        return 'text-orange-700 bg-orange-50';
      case 'Declined':
        return 'text-red-700 bg-red-50';
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded':
      case 'Approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pending':
      case 'Review':
        return <Clock className="w-4 h-4" />;
      case 'Declined':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-2">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your MCA portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportPortfolioReport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Portfolio
          </button>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm transition-colors ${
                timeRange === range
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
              {range === '1y' && 'Last Year'}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Deployed */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.monthlyGrowth}%</span>
            </div>
          </div>
          <p className="text-emerald-100 text-sm mb-1">Total Deployed</p>
          <p className="text-3xl">${stats.totalDeployed.toLocaleString()}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>{stats.revenueGrowth}%</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
        </div>

        {/* Active Deals */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Active Deals</p>
          <p className="text-3xl text-gray-900">{stats.activeDeals}</p>
        </div>

        {/* Avg Deal Size */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-1">Avg Deal Size</p>
          <p className="text-3xl text-gray-900">${stats.avgDealSize.toLocaleString()}</p>
        </div>
      </div>

      {/* Status Breakdown & Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Deal Status Breakdown</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">Funded</span>
                </div>
                <span className="text-gray-900">{statusBreakdown.funded}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-600 rounded-full h-2 transition-all"
                  style={{ width: `${deals.length > 0 ? (statusBreakdown.funded / deals.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-gray-700">Under Review</span>
                </div>
                <span className="text-gray-900">{statusBreakdown.review}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-orange-600 rounded-full h-2 transition-all"
                  style={{ width: `${deals.length > 0 ? (statusBreakdown.review / deals.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-gray-700">Declined</span>
                </div>
                <span className="text-gray-900">{statusBreakdown.declined}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-red-600 rounded-full h-2 transition-all"
                  style={{ width: `${deals.length > 0 ? (statusBreakdown.declined / deals.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl">Performance Metrics</h2>
            <Percent className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Approval Rate</span>
                <span className="text-2xl text-emerald-600">{stats.approvalRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full h-3 transition-all"
                  style={{ width: `${stats.approvalRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Avg Factor Rate</span>
                <span className="text-2xl text-blue-600">{stats.avgFactorRate}%</span>
              </div>
              <p className="text-sm text-gray-500">Average interest rate across all funded deals</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl text-gray-900">{deals.length}</p>
                  <p className="text-sm text-gray-600">Total Deals</p>
                </div>
                <div>
                  <p className="text-2xl text-emerald-600">${Math.round(stats.totalRevenue / (statusBreakdown.funded || 1)).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Avg Profit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Type Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Deal Type Breakdown</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* MCA Deals */}
            {(() => {
              const mcaDeals = deals.filter(d => !d.dealType || d.dealType === 'MCA');
              const fundedMCA = mcaDeals.filter(d => d.status === 'Funded');
              const totalMCADeployed = fundedMCA.reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0);
              const totalMCARevenue = fundedMCA.reduce((sum, d) => sum + ((d.repaymentAmountDue || 0) - (d.loanAmountReceived || 0)), 0);
              const mcaPaymentsReceived = fundedMCA.reduce((sum, deal) => {
                return sum + (deal.paymentHistory || []).reduce((paidSum, payment) => 
                  paidSum + payment.amount, 0
                );
              }, 0);
              
              return (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold">
                      {mcaDeals.length} deals
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">MCA Deals</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Total Deployed</p>
                      <p className="text-2xl font-semibold text-blue-900">${totalMCADeployed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Expected Revenue</p>
                      <p className="text-xl font-semibold text-blue-900">${totalMCARevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Payments Received</p>
                      <p className="text-xl font-semibold text-blue-900">${mcaPaymentsReceived.toLocaleString()}</p>
                    </div>
                    <div className="pt-2 border-t border-blue-300">
                      <p className="text-xs text-blue-700 mb-1">Active Deals</p>
                      <p className="text-lg font-semibold text-blue-900">{mcaDeals.filter(d => d.status === 'Funded' || d.status === 'Pending').length}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Residual Income Deals */}
            {(() => {
              const residualDeals = deals.filter(d => d.dealType === 'Residual Income');
              const fundedResidual = residualDeals.filter(d => d.status === 'Funded');
              const totalResidualDeployed = fundedResidual.reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0);
              const totalResidualRevenue = fundedResidual.reduce((sum, d) => sum + ((d.repaymentAmountDue || 0) - (d.loanAmountReceived || 0)), 0);
              const avgMonthlyVolume = fundedResidual.length > 0 
                ? fundedResidual.reduce((sum, d) => sum + (d.averageMonthlyVolume || 0), 0) / fundedResidual.length 
                : 0;
              const residualPaymentsReceived = fundedResidual.reduce((sum, deal) => {
                return sum + (deal.paymentHistory || []).reduce((paidSum, payment) => 
                  paidSum + payment.amount, 0
                );
              }, 0);
              
              return (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-semibold">
                      {residualDeals.length} deals
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">Residual Income</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Total Deployed</p>
                      <p className="text-2xl font-semibold text-purple-900">${totalResidualDeployed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Expected Revenue</p>
                      <p className="text-xl font-semibold text-purple-900">${totalResidualRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-700 mb-1">Avg Monthly Volume</p>
                      <p className="text-xl font-semibold text-purple-900">${Math.round(avgMonthlyVolume).toLocaleString()}</p>
                    </div>
                    <div className="pt-2 border-t border-purple-300">
                      <p className="text-xs text-purple-700 mb-1">Active Deals</p>
                      <p className="text-lg font-semibold text-purple-900">{residualDeals.filter(d => d.status === 'Funded' || d.status === 'Pending').length}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lease Commission Deals */}
            {(() => {
              const leaseDeals = deals.filter(d => d.dealType === 'Lease Commissions');
              const fundedLease = leaseDeals.filter(d => d.status === 'Funded');
              const totalLeaseDeployed = fundedLease.reduce((sum, d) => sum + (d.loanAmountReceived || 0), 0);
              const totalUpfrontCommission = fundedLease.reduce((sum, d) => sum + (d.upfrontCommission || 0), 0);
              const totalMonthlyCommission = fundedLease.reduce((sum, d) => sum + (d.monthlyCommissionAmount || 0), 0);
              const leasePaymentsReceived = fundedLease.reduce((sum, deal) => {
                return sum + (deal.paymentHistory || []).reduce((paidSum, payment) => 
                  paidSum + payment.amount, 0
                );
              }, 0);
              
              return (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-semibold">
                      {leaseDeals.length} deals
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Lease Commissions</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-emerald-700 mb-1">Total Deployed</p>
                      <p className="text-2xl font-semibold text-emerald-900">${totalLeaseDeployed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 mb-1">Upfront Commissions</p>
                      <p className="text-xl font-semibold text-emerald-900">${totalUpfrontCommission.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-700 mb-1">Monthly Commissions</p>
                      <p className="text-xl font-semibold text-emerald-900">${totalMonthlyCommission.toLocaleString()}/mo</p>
                    </div>
                    <div className="pt-2 border-t border-emerald-300">
                      <p className="text-xs text-emerald-700 mb-1">Active Deals</p>
                      <p className="text-lg font-semibold text-emerald-900">{leaseDeals.filter(d => d.status === 'Funded' || d.status === 'Pending').length}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl">Recent Deals</h2>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                {recentDeals.length} deals
              </span>
            </div>
            <button
              onClick={() => setShowRecentDeals(!showRecentDeals)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {showRecentDeals ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showRecentDeals && (
          <div className="overflow-x-auto">
            {recentDeals.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm text-gray-600">Deal Name</th>
                    <th className="text-left py-3 px-6 text-sm text-gray-600">Merchant</th>
                    <th className="text-right py-3 px-6 text-sm text-gray-600">Amount</th>
                    <th className="text-center py-3 px-6 text-sm text-gray-600">Factor Rate</th>
                    <th className="text-center py-3 px-6 text-sm text-gray-600">Status</th>
                    <th className="text-left py-3 px-6 text-sm text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">{deal.name}</td>
                      <td className="py-4 px-6 text-gray-600">{deal.merchant}</td>
                      <td className="py-4 px-6 text-right">${deal.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">{deal.factorRate}%</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${getStatusColor(deal.status)}`}>
                            {getStatusIcon(deal.status)}
                            {deal.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{deal.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No deals found</p>
                <p className="text-sm text-gray-500 mt-1">Create your first deal to see it here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portfolio Analytics */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Portfolio Analytics</h2>
            <button
              onClick={exportPortfolioReport}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Principal Outstanding */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Principal Outstanding</p>
              <p className="text-3xl text-gray-900">${portfolioAnalytics.totalPrincipalOutstanding.toLocaleString()}</p>
            </div>

            {/* Total Payments Received */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Payments Received</p>
              <p className="text-3xl text-gray-900">${portfolioAnalytics.totalPaymentsReceived.toLocaleString()}</p>
            </div>

            {/* Total Profit Realized */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Total Profit Realized</p>
              <p className="text-3xl text-gray-900">${portfolioAnalytics.totalProfitRealized.toLocaleString()}</p>
            </div>

            {/* Expected Total Profit */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Expected Total Profit</p>
              <p className="text-3xl text-gray-900">${portfolioAnalytics.expectedTotalProfit.toLocaleString()}</p>
            </div>

            {/* Portfolio Health Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-gray-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Portfolio Health Score</p>
              <p className="text-3xl text-gray-900">{portfolioAnalytics.portfolioHealthScore}%</p>
            </div>

            {/* Average Portfolio ROI */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">Average Portfolio ROI</p>
              <p className="text-3xl text-gray-900">{portfolioAnalytics.avgROI}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}