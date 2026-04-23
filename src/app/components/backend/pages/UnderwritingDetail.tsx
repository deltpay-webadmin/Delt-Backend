import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  ArrowLeft,
  Building2,
  User,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { useUnderwriting, underwritingActions } from '../crmStore';

interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
}

function InfoField({ label, value }: InfoFieldProps) {
  return (
    <div className="py-2.5">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

interface VendorCardProps {
  title: string;
  status: 'success' | 'pending' | 'failed';
  lastPulled?: string;
  onPullData?: () => void;
  children: React.ReactNode;
}

function VendorCard({ title, status, lastPulled, onPullData, children }: VendorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-emerald-600';
      case 'pending':
        return 'text-amber-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'failed':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <div className={`flex items-center gap-1.5 ${getStatusColor(status)}`}>
            {getStatusIcon(status)}
          </div>
        </div>
        {onPullData && (
          <button
            onClick={onPullData}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Pull Data
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        {children}
        {lastPulled && (
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
            Last updated: {lastPulled}
          </p>
        )}
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
  disabled?: boolean;
}

function InputField({ label, value, onChange, type = 'text', suffix, disabled }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function UnderwritingDetail() {
  const { navigate, currentPage } = useAppNavigate();
  const allApps = useUnderwriting();

  // Extract id from /underwriting/{id}
  const appIdFromUrl = currentPage.startsWith('/underwriting/') ? currentPage.split('/underwriting/')[1] : '';
  const storeApp = allApps.find(a => a.id === appIdFromUrl) || allApps[0];

  const [factorRate, setFactorRate] = useState('1.20');
  const [loanPercent, setLoanPercent] = useState('80');
  const [term, setTerm] = useState('12');
  const [paymentType, setPaymentType] = useState('daily');
  const [originationFee, setOriginationFee] = useState('2.5');
  const [returnNote, setReturnNote] = useState('');
  const [returnOpen, setReturnOpen] = useState(false);

  const application = storeApp
    ? {
        id: storeApp.applicationId,
        storeId: storeApp.id,
        businessName: storeApp.businessName,
        ownerName: storeApp.reviewer,
        industry: storeApp.industry,
        yearsInBusiness: (storeApp.monthsInBusiness / 12).toFixed(1),
        creditScore: storeApp.creditScore,
        monthlyRevenue: `$${storeApp.monthlyRevenue.toLocaleString()}`,
        requestedAmount: `$${storeApp.requestedAmount.toLocaleString()}`,
        stage: storeApp.stage,
      }
    : {
        id: 'UW-2026-0143',
        storeId: '',
        businessName: 'Sunrise Cafe & Bakery',
        ownerName: 'Michael Roberts',
        industry: 'Food & Beverage',
        yearsInBusiness: '5.2',
        creditScore: 682,
        monthlyRevenue: '$37,500',
        requestedAmount: '$125,000',
        stage: 'Received' as const,
      };

  const canDecide = application.stage !== 'Approved' && application.stage !== 'Declined';

  const onApprove = () => {
    if (!application.storeId) return;
    underwritingActions.approve(application.storeId);
    toast.success(`${application.businessName} approved`, { description: `${application.requestedAmount} cleared to fund.` });
    navigate('/underwriting');
  };

  const onApproveConditions = () => {
    if (!application.storeId) return;
    underwritingActions.approve(application.storeId);
    toast.success(`${application.businessName} approved with conditions`, {
      description: 'Stipulations will be sent to merchant for docs & e-sign.',
    });
    navigate('/underwriting');
  };

  const onDecline = () => {
    if (!application.storeId) return;
    underwritingActions.decline(application.storeId);
    toast.error(`${application.businessName} declined`, { description: 'Adverse-action letter queued.' });
    navigate('/underwriting');
  };

  const onReturnForInfo = () => {
    if (!returnNote.trim()) {
      setReturnOpen(true);
      return;
    }
    if (!application.storeId) return;
    underwritingActions.setStage(application.storeId, 'Doc Collection');
    toast.info(`Returned to Doc Collection`, { description: returnNote.trim() });
    setReturnNote('');
    setReturnOpen(false);
    navigate('/underwriting');
  };

  const residualHistory = [
    { month: 'January 2026', amount: '$38,200' },
    { month: 'February 2026', amount: '$36,800' },
    { month: 'March 2026', amount: '$37,500' },
  ];

  const riskScore = 78;
  const autoDecision = 'Manual Review';

  const riskFactors = [
    { name: 'Credit Score', score: 75, weight: '25%' },
    { name: 'Cash Flow Stability', score: 82, weight: '30%' },
    { name: 'Industry Risk', score: 70, weight: '15%' },
    { name: 'Time in Business', score: 85, weight: '10%' },
    { name: 'Banking History', score: 78, weight: '20%' },
  ];

  const requestedAmount = 125000;
  const loanAmount = requestedAmount * (parseFloat(loanPercent) / 100);
  const payback = loanAmount * parseFloat(factorRate);
  const originationFeeAmount = loanAmount * (parseFloat(originationFee) / 100);
  const netFunding = loanAmount - originationFeeAmount;
  const grossProfit = payback - loanAmount;
  const borrowingCost = loanAmount * 0.02 * parseFloat(term);
  const netProfit = grossProfit - borrowingCost - originationFeeAmount;
  const dailyPayment = payback / (parseFloat(term) * 22);
  const apr = ((payback - loanAmount) / loanAmount / parseFloat(term) * 12 * 100).toFixed(2);

  const cashFlowData = Array.from({ length: 6 }, (_, i) => {
    const monthPayment = dailyPayment * 22;
    const openingBalance = i === 0 ? loanAmount : loanAmount - (monthPayment * i);
    const principalReduction = monthPayment;
    const monthBorrowingCost = openingBalance * 0.02;
    const monthNetProfit = (monthPayment - principalReduction) - monthBorrowingCost;

    return {
      month: i + 1,
      openingBalance,
      payment: monthPayment,
      principalReduction,
      borrowingCost: monthBorrowingCost,
      netProfit: monthNetProfit,
    };
  });

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className="min-h-full bg-canvas pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <button
            onClick={() => navigate('/underwriting')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Underwriting Queue
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{application.businessName}</h1>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full">
                  {application.id}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Submitted for review • Requested: {application.requestedAmount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (45%) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Borrower Info Card */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Borrower Information</h2>
              </div>
              <div className="px-5 py-4">
                <div className="space-y-1">
                  <InfoField label="Business Name" value={application.businessName} />
                  <InfoField label="Owner Name" value={application.ownerName} />
                  <InfoField label="Industry" value={application.industry} />
                  <InfoField label="Years in Business" value={`${application.yearsInBusiness} years`} />
                  <InfoField
                    label="Credit Score"
                    value={
                      <span className={application.creditScore >= 680 ? 'text-emerald-600' : 'text-amber-600'}>
                        {application.creditScore}
                      </span>
                    }
                  />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-3">3-Month Residual History</p>
                  <div className="space-y-2">
                    {residualHistory.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{item.month}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Plaid Card */}
            <VendorCard
              title="Plaid"
              status="success"
              lastPulled="Apr 9, 2026 at 10:23 AM"
              onPullData={() => console.log('Pulling Plaid data...')}
            >
              <div className="grid grid-cols-2 gap-3">
                <InfoField
                  label="Bank Verification"
                  value={
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Check className="w-4 h-4" />
                      Verified
                    </span>
                  }
                />
                <InfoField label="3-Month Avg Revenue" value="$37,167" />
                <InfoField
                  label="NSF Count"
                  value={<span className="text-emerald-600">0</span>}
                />
                <InfoField
                  label="Negative Balance Days"
                  value={<span className="text-emerald-600">0</span>}
                />
                <InfoField
                  label="IDV Status"
                  value={
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Check className="w-4 h-4" />
                      Verified
                    </span>
                  }
                />
                <InfoField
                  label="OFAC Screening"
                  value={
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Check className="w-4 h-4" />
                      Clear
                    </span>
                  }
                />
              </div>
            </VendorCard>

            {/* CRS Credit Card */}
            <VendorCard
              title="CRS Credit"
              status="success"
              lastPulled="Apr 9, 2026 at 10:24 AM"
              onPullData={() => console.log('Pulling CRS data...')}
            >
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Business Credit Score" value="720" />
                <InfoField label="Personal Credit Score" value="682" />
                <InfoField
                  label="Existing Liens"
                  value={<span className="text-emerald-600">None</span>}
                />
                <InfoField
                  label="Derogatory Marks"
                  value={<span className="text-emerald-600">0</span>}
                />
              </div>
            </VendorCard>

            {/* DataMerch Card */}
            <VendorCard
              title="DataMerch"
              status="success"
              lastPulled="Apr 9, 2026 at 10:24 AM"
              onPullData={() => console.log('Pulling DataMerch data...')}
            >
              <InfoField
                label="Stacking Status"
                value={
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <Check className="w-4 h-4" />
                    Clear
                  </span>
                }
              />
              <p className="text-xs text-gray-500 mt-2">No active positions found</p>
            </VendorCard>

            {/* Risk Score Card */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Risk Assessment</h2>
              </div>
              <div className="px-5 py-4">
                {/* Composite Score */}
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="transform -rotate-90 w-28 h-28">
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        stroke="#E5E7EB"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="45"
                        stroke={getRiskScoreColor(riskScore)}
                        strokeWidth="10"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreTextColor(riskScore)}`}>
                        {riskScore}
                      </span>
                      <span className="text-xs text-gray-500">Risk Score</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-2">Auto-Decision</p>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      <span className="text-base font-semibold text-amber-600">{autoDecision}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Score within manual review threshold (60-80)
                    </p>
                  </div>
                </div>

                {/* Factor Breakdown */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-3">Risk Factor Breakdown</p>
                  <div className="space-y-3">
                    {riskFactors.map((factor, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">{factor.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{factor.weight}</span>
                            <span className={`text-xs font-semibold ${getScoreTextColor(factor.score)}`}>
                              {factor.score}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${factor.score}%`,
                              backgroundColor: getRiskScoreColor(factor.score),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (55%) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Deal Structuring */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Deal Structuring</h2>
              </div>
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Factor Rate"
                    value={factorRate}
                    onChange={setFactorRate}
                    type="number"
                  />
                  <InputField
                    label="Loan Percentage"
                    value={loanPercent}
                    onChange={setLoanPercent}
                    type="number"
                    suffix="%"
                  />
                  <InputField
                    label="Term (Months)"
                    value={term}
                    onChange={setTerm}
                    type="number"
                  />
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Payment Type
                    </label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <InputField
                    label="Origination Fee"
                    value={originationFee}
                    onChange={setOriginationFee}
                    type="number"
                    suffix="%"
                  />
                </div>
              </div>
            </div>

            {/* Deal Summary */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Deal Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${loanAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Total Payback</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${payback.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Net Profit</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">APR</p>
                  <p className="text-2xl font-bold text-gray-900">{apr}%</p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Daily Payment</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${dailyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <p className="text-xs text-gray-600 mb-1">Origination Fee</p>
                  <p className="text-xl font-bold text-gray-900">
                    ${originationFeeAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Cash Flow Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Monthly Cash Flow Projection</h2>
                <p className="text-xs text-gray-500 mt-1">First 6 months</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Opening Balance
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Payment
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Principal Reduction
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Borrowing Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Net Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cashFlowData.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          Month {row.month}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${row.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ${row.payment.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${row.principalReduction.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          -${row.borrowingCost.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                          ${row.netProfit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg lg:pl-64 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 justify-end">
            {returnOpen && (
              <div className="flex-1 max-w-md flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                <input
                  autoFocus
                  value={returnNote}
                  onChange={e => setReturnNote(e.target.value)}
                  placeholder="What's missing from the applicant?"
                  className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-amber-600"
                  onKeyDown={e => {
                    if (e.key === 'Enter') onReturnForInfo();
                    if (e.key === 'Escape') { setReturnOpen(false); setReturnNote(''); }
                  }}
                />
                <button onClick={onReturnForInfo} className="text-xs font-medium text-amber-700 hover:text-amber-900">Send</button>
              </div>
            )}
            <button
              disabled={!canDecide}
              onClick={() => setReturnOpen(v => !v)}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Info className="w-4 h-4" />
              Return for Info
            </button>
            <button
              disabled={!canDecide}
              onClick={onDecline}
              className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Decline
            </button>
            <button
              disabled={!canDecide}
              onClick={onApproveConditions}
              className="px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-4 h-4" />
              Approve with Conditions
            </button>
            <button
              disabled={!canDecide}
              onClick={onApprove}
              className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
