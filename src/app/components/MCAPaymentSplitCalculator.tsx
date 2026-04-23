import React, { useState, useMemo } from 'react';
import { DollarSign, Calculator, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

interface AmortizationRow {
  period: number;
  beginPrincipal: number;
  payment: number;
  principalAllocated: number;
  profitAllocated: number;
  interestDue: number;
  endPrincipal: number;
}

interface PreviousPayment {
  id: string;
  amount: string;
}

type PaymentFrequency = 'daily' | 'weekly' | 'monthly';

export function MCAPaymentSplitCalculator() {
  const [loanAmount, setLoanAmount] = useState('');
  const [totalPayback, setTotalPayback] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('monthly');
  const [termLength, setTermLength] = useState('');
  const [showAmortization, setShowAmortization] = useState(false);
  const [showPreviousPayments, setShowPreviousPayments] = useState(false);
  const [previousPayments, setPreviousPayments] = useState<PreviousPayment[]>([]);

  const loanAmountNum = parseFloat(loanAmount.replace(/,/g, '')) || 0;
  const totalPaybackNum = parseFloat(totalPayback.replace(/,/g, '')) || 0;
  const paymentReceivedNum = parseFloat(paymentReceived.replace(/,/g, '')) || 0;
  const termLengthNum = parseFloat(termLength) || 0;

  const principalPercent = totalPaybackNum > 0 ? (loanAmountNum / totalPaybackNum) * 100 : 0;
  const profitPercent = totalPaybackNum > 0 ? ((totalPaybackNum - loanAmountNum) / totalPaybackNum) * 100 : 0;

  const totalPreviousPayments = useMemo(() => {
    return previousPayments.reduce((sum, payment) => {
      const amount = parseFloat(payment.amount.replace(/,/g, '')) || 0;
      return sum + amount;
    }, 0);
  }, [previousPayments]);

  const previousPrincipalPaid = useMemo(() => {
    return Math.round((totalPreviousPayments * (principalPercent / 100)) * 100) / 100;
  }, [totalPreviousPayments, principalPercent]);

  const adjustedStartingPrincipal = Math.max(0, loanAmountNum - previousPrincipalPaid);

  const principalAllocation = Math.round((paymentReceivedNum * (principalPercent / 100)) * 100) / 100;
  const profitAllocation = Math.round((paymentReceivedNum - principalAllocation) * 100) / 100;

  const remainingPrincipal = Math.round((adjustedStartingPrincipal - principalAllocation) * 100) / 100;
  
  const getTermLengthUnit = () => {
    switch (paymentFrequency) {
      case 'daily': return 'days';
      case 'weekly': return 'weeks';
      case 'monthly': return 'months';
    }
  };

  const termLengthInMonths = () => {
    switch (paymentFrequency) {
      case 'daily': return termLengthNum / 30;
      case 'weekly': return termLengthNum / 4.33;
      case 'monthly': return termLengthNum;
    }
  };

  const getPeriodsInMonth = () => {
    switch (paymentFrequency) {
      case 'daily': return 30;
      case 'weekly': return 4.33;
      case 'monthly': return 1;
    }
  };

  const monthsForCalculation = termLengthInMonths();
  const monthlyRate = monthsForCalculation > 0 ? 0.12 / monthsForCalculation : 0;
  const periodRate = monthlyRate / getPeriodsInMonth();
  const costOfCapitalPerPeriod = Math.round((remainingPrincipal * periodRate) * 100) / 100;

  const getTotalPeriods = () => {
    return Math.round(termLengthNum);
  };

  const getPeriodLabel = () => {
    switch (paymentFrequency) {
      case 'daily': return 'Day';
      case 'weekly': return 'Week';
      case 'monthly': return 'Month';
    }
  };

  const amortizationSchedule = useMemo(() => {
    if (loanAmountNum <= 0 || totalPaybackNum <= 0 || paymentReceivedNum <= 0 || termLengthNum <= 0) {
      return [];
    }

    const schedule: AmortizationRow[] = [];
    const principalPct = loanAmountNum / totalPaybackNum;
    
    const termInMonths = paymentFrequency === 'daily' 
      ? termLengthNum / 30 
      : paymentFrequency === 'weekly' 
        ? termLengthNum / 4.33 
        : termLengthNum;
    
    const monthlyRateCalc = termInMonths > 0 ? 0.12 / termInMonths : 0;
    const periodsPerMonth = paymentFrequency === 'daily' ? 30 : paymentFrequency === 'weekly' ? 4.33 : 1;
    const periodRateCalc = monthlyRateCalc / periodsPerMonth;
    
    const totalPeriods = Math.round(termLengthNum);

    let remainingPrincipalCalc = adjustedStartingPrincipal;

    for (let period = 1; period <= totalPeriods; period++) {
      if (remainingPrincipalCalc <= 0) {
        break;
      }

      const beginPrincipal = remainingPrincipalCalc;
      const payment = paymentReceivedNum;
      const principalAllocatedCalc = Math.round(payment * principalPct * 100) / 100;
      const profitAllocatedCalc = Math.round((payment - principalAllocatedCalc) * 100) / 100;
      const interestDue = Math.round(beginPrincipal * periodRateCalc * 100) / 100;
      
      remainingPrincipalCalc = Math.max(0, remainingPrincipalCalc - principalAllocatedCalc);
      const endPrincipal = remainingPrincipalCalc;

      schedule.push({
        period,
        beginPrincipal,
        payment,
        principalAllocated: principalAllocatedCalc,
        profitAllocated: profitAllocatedCalc,
        interestDue,
        endPrincipal
      });
    }

    return schedule;
  }, [loanAmountNum, totalPaybackNum, paymentReceivedNum, termLengthNum, paymentFrequency, adjustedStartingPrincipal]);

  const totals = useMemo(() => {
    const totalInterest = amortizationSchedule.reduce((sum, row) => sum + row.interestDue, 0);
    const totalPrincipal = amortizationSchedule.reduce((sum, row) => sum + row.principalAllocated, 0);
    const totalProfit = amortizationSchedule.reduce((sum, row) => sum + row.profitAllocated, 0);
    return { totalInterest, totalPrincipal, totalProfit };
  }, [amortizationSchedule]);

  const formatCurrency = (value: string): string => {
    if (!value) return '';
    const num = value.replace(/[^0-9.]/g, '');
    if (!num) return '';
    
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return parts.join('.');
  };

  const formatNumber = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleCurrencyInput = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const decimalCount = (cleanValue.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    
    setter(cleanValue);
  };

  const handleNumberInput = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setter(cleanValue);
  };

  const addPreviousPayment = () => {
    setPreviousPayments([...previousPayments, { id: Date.now().toString(), amount: '' }]);
  };

  const removePreviousPayment = (id: string) => {
    setPreviousPayments(previousPayments.filter(p => p.id !== id));
  };

  const updatePreviousPaymentAmount = (id: string, amount: string) => {
    setPreviousPayments(previousPayments.map(p => 
      p.id === id ? { ...p, amount } : p
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#2563EB]" />
        </div>
        <h2 className="text-xl font-semibold text-[#111827]">MCA Payment Split Calculator</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">
            Loan Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <input
              type="text"
              value={formatCurrency(loanAmount)}
              onChange={(e) => handleCurrencyInput(setLoanAmount, e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">
            Total Payback
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
            <input
              type="text"
              value={formatCurrency(totalPayback)}
              onChange={(e) => handleCurrencyInput(setTotalPayback, e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">
            Payment Received
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
              <input
                type="text"
                value={formatCurrency(paymentReceived)}
                onChange={(e) => handleCurrencyInput(setPaymentReceived, e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm"
              />
            </div>
            <select
              value={paymentFrequency}
              onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
              className="px-3 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6B7280] mb-2">
            Term Length
          </label>
          <div className="relative">
            <input
              type="text"
              value={termLength}
              onChange={(e) => handleNumberInput(setTermLength, e.target.value)}
              placeholder="0"
              className="w-full pl-4 pr-16 py-2.5 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">{getTermLengthUnit()}</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowPreviousPayments(!showPreviousPayments)}
          className="flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#1E40AF] transition-colors"
        >
          {showPreviousPayments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Previous Payments?
        </button>

        {showPreviousPayments && (
          <div className="mt-3 p-4 bg-[#F5FBFF] rounded-lg border border-[#E5E7EB]">
            <div className="space-y-2 mb-3">
              {previousPayments.map((payment, index) => (
                <div key={payment.id} className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280] w-16">Payment {index + 1}</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] text-sm">$</span>
                    <input
                      type="text"
                      value={formatCurrency(payment.amount)}
                      onChange={(e) => updatePreviousPaymentAmount(payment.id, e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 border border-[#E5E7EB] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all text-[#6B7280] text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removePreviousPayment(payment.id)}
                    className="p-2 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addPreviousPayment}
              className="flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:text-[#1E40AF] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Payment
            </button>

            {previousPayments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B7280]">Total Previous Payments:</span>
                  <span className="font-semibold text-[#111827]">${formatNumber(totalPreviousPayments)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B7280]">Principal Paid:</span>
                  <span className="font-semibold text-[#15803D]">${formatNumber(previousPrincipalPaid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Adjusted Starting Principal:</span>
                  <span className="font-semibold text-[#2563EB]">${formatNumber(adjustedStartingPrincipal)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#ECFDF5] rounded-lg p-4 border border-[#ECFDF5]">
          <p className="text-xs text-[#15803D] font-medium mb-1">Principal %</p>
          <p className="text-3xl font-bold text-[#15803D]">
            {principalPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-[#6B7280] mt-1">Loan ÷ Payback</p>
        </div>
        <div className="bg-[#FCE7F3] rounded-lg p-4 border border-[#FCE7F3]">
          <p className="text-xs text-[#A21CAF] font-medium mb-1">Profit %</p>
          <p className="text-3xl font-bold text-[#A21CAF]">
            {profitPercent.toFixed(2)}%
          </p>
          <p className="text-xs text-[#6B7280] mt-1">(Payback − Loan) ÷ Payback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#10B981] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-xs font-medium">Principal Allocation</p>
          </div>
          <p className="text-3xl font-bold mb-1">
            ${principalAllocation.toFixed(2)}
          </p>
          <p className="text-xs opacity-90">Merchant Advances Outstanding</p>
        </div>

        <div className="bg-[#A855F7] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-xs font-medium">Profit Allocation</p>
          </div>
          <p className="text-3xl font-bold mb-1">
            ${profitAllocation.toFixed(2)}
          </p>
          <p className="text-xs opacity-90">MCA Factor Fee Income</p>
        </div>

        <div className="bg-[#3B82F6] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-xs font-medium">Remaining Principal</p>
          </div>
          <p className="text-3xl font-bold mb-1">
            ${remainingPrincipal.toFixed(2)}
          </p>
          <p className="text-xs opacity-90">
            {previousPayments.length > 0 ? 'Adjusted Principal − Current Allocation' : 'Loan Amount − Principal Allocation'}
          </p>
        </div>

        <div className="bg-[#FF6B00] rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <p className="text-xs font-medium">
              {paymentFrequency === 'daily' ? 'Daily' : paymentFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Cost of Capital
            </p>
          </div>
          <p className="text-3xl font-bold mb-1">
            ${costOfCapitalPerPeriod.toFixed(2)}
          </p>
          <p className="text-xs opacity-90">Remaining × (12% ÷ Term ÷ {getPeriodsInMonth()})</p>
        </div>
      </div>

      {amortizationSchedule.length > 0 && (
        <div className="mt-6 border border-[#E5E7EB] rounded-lg">
          <button
            onClick={() => setShowAmortization(!showAmortization)}
            className="w-full flex items-center justify-between p-4 bg-[#F5FBFF] hover:bg-[#EBF5FF] transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] flex items-center justify-center">
                <Calculator className="w-4 h-4 text-[#2563EB]" />
              </div>
              <span className="font-semibold text-[#111827]">
                Amortization Schedule ({getTotalPeriods()} {paymentFrequency === 'monthly' ? 'Months' : paymentFrequency === 'weekly' ? 'Weeks' : 'Days'})
              </span>
            </div>
            {showAmortization ? (
              <ChevronUp className="w-5 h-5 text-[#6B7280]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#6B7280]" />
            )}
          </button>

          {showAmortization && (
            <div className="p-4">
              {previousPayments.length > 0 && (
                <div className="mb-4 p-3 bg-[#EFF6FF] rounded-lg border border-[#BFDBFE]">
                  <p className="text-xs text-[#1E40AF] font-medium">
                    Note: Schedule starts from adjusted principal of ${formatNumber(adjustedStartingPrincipal)} after {previousPayments.length} previous payment(s) totaling ${formatNumber(totalPreviousPayments)}
                  </p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="text-left py-3 px-2 font-semibold text-[#111827]">{getPeriodLabel()}</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">Begin Principal</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">Payment</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">Principal Allocated</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">Profit Allocated</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">Interest Due</th>
                      <th className="text-right py-3 px-2 font-semibold text-[#111827]">End Principal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.map((row) => (
                      <tr key={row.period} className="border-b border-[#E5E7EB] hover:bg-[#F5FBFF]">
                        <td className="py-3 px-2 text-[#6B7280]">{row.period}</td>
                        <td className="py-3 px-2 text-right text-[#6B7280]">${formatNumber(row.beginPrincipal)}</td>
                        <td className="py-3 px-2 text-right text-[#6B7280]">${formatNumber(row.payment)}</td>
                        <td className="py-3 px-2 text-right text-[#15803D] font-medium">${formatNumber(row.principalAllocated)}</td>
                        <td className="py-3 px-2 text-right text-[#A21CAF] font-medium">${formatNumber(row.profitAllocated)}</td>
                        <td className="py-3 px-2 text-right text-[#B45309] font-medium">${formatNumber(row.interestDue)}</td>
                        <td className="py-3 px-2 text-right text-[#2563EB] font-medium">${formatNumber(row.endPrincipal)}</td>
                      </tr>
                    ))}
                    <tr className="bg-[#F5FBFF] font-semibold">
                      <td className="py-3 px-2 text-[#111827]" colSpan={3}>Totals</td>
                      <td className="py-3 px-2 text-right text-[#15803D]">${formatNumber(totals.totalPrincipal)}</td>
                      <td className="py-3 px-2 text-right text-[#A21CAF]">${formatNumber(totals.totalProfit)}</td>
                      <td className="py-3 px-2 text-right text-[#B45309]">${formatNumber(totals.totalInterest)}</td>
                      <td className="py-3 px-2"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
