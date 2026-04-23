import React, { useState } from 'react';
import { AlertCircle, XCircle, CheckCircle, TrendingUp, DollarSign, Percent, AlertTriangle, Calendar, Info, ChevronDown, ChevronUp, Download, X, Maximize2 } from 'lucide-react';
import { saveDeal } from '../utils/api';
import { DealTypeSelectionModal } from './DealTypeSelectionModal';
import { MCAPaymentSplitCalculator } from './MCAPaymentSplitCalculator';

interface BorrowerInfo {
  dealName: string;
  month1Residual: string;
  month2Residual: string;
  month3Residual: string;
  creditScore: string;
  industry: string;
  yearsInBusiness: string;
  factorRate: string;
  loanPercentage: string;
  termLength: string;
  termUnit: 'months' | 'weeks';
  paymentSchedule: 'daily-ach' | 'daily-processing' | 'weekly' | 'monthly' | 'lump-sum' | 'flat';
  processingPercentage: string;
  flatPaymentAmount: string;
  paymentFrequency: 'weekly' | 'bi-monthly' | 'monthly';
  borrowingCostPerMonth: string;
  loanDate: string;
  dueDate: string;
  hasRep: boolean;
  repFirstName: string;
  repLastName: string;
  repCommissionType: 'profit' | 'loan';
  repCommissionPercentage: string;
  paymentType: 'amortizing' | 'interest-only';
  pricingProgram: 'cash-discount' | 'interchange-plus' | 'flat-rate';
  cashDiscountRate: string;
  cardProcessingCost: string;
  estimatedMonthlyProcessingVolume: string;
  leaseFactorRate: string;
  numberOfEquipment: string;
  equipmentCost: string;
  monthlySubscriptionFee: string;
  leaseSalesRepCommission: string;
  leaseDeploymentFee: string;
  residualRepFirstName: string;
  residualRepLastName: string;
  residualRepCommissionPercentage: string;
}

interface RiskAssessment {
  creditRisk: 'High' | 'Moderate' | 'Low';
  businessMaturityRisk: 'High' | 'Moderate' | 'Low';
  industryRisk: 'High' | 'Moderate' | 'Low';
  loanToIncomeRatio: 'High' | 'Moderate' | 'Low';
  loanPercentageRisk: 'High' | 'Moderate' | 'Low';
}

interface AIRecommendation {
  decision: 'APPROVE' | 'DECLINE' | 'REVIEW';
  reason: string;
  riskScore: number;
  adjustedLoanPercentage?: number;
  adjustedFactorRate?: number;
  suggestions?: string[];
  optimizedStrategy?: {
    recommendedPaymentSchedule: string;
    recommendedTermLength: number;
    estimatedROI: number;
    projectedNetProfit: number;
    riskMitigationSteps: string[];
  };
}

interface PaymentScheduleItem {
  paymentNumber: number;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingPrincipal: number;
  totalInterestPaid: number;
}

interface CashFlowScheduleItem {
  month: number;
  monthName?: string; // e.g., "October 2025" for display
  merchantPayment: number; // What merchant pays us this month
  principalReduction: number; // Principal paid down
  factorIncome: number; // Profit/Factor income from merchant
  ourBorrowingCost: number; // 2% we pay on outstanding balance
  principalPaybackToLender: number; // What we pay back to our lender (adjustable)
  remainingBalance: number; // Outstanding loan balance
  monthlyNetProfit: number; // Net profit for this month
  cumulativeProfit: number; // Running total of profit
  payments?: Array<{ // Optional: individual payment details within the month
    paymentNumber: number;
    date: string;
    actualDate?: string; // Actual calendar date for the payment
    amount: number;
    principalPortion: number;
    factorPortion: number;
    remainingBalance: number;
  }>;
}

export function MCACalculator() {
  const [borrowerInfo, setBorrowerInfo] = useState<BorrowerInfo>({
    dealName: '',
    month1Residual: '',
    month2Residual: '',
    month3Residual: '',
    creditScore: '',
    industry: 'Restaurants & Bars',
    yearsInBusiness: '',
    factorRate: '1.35',
    loanPercentage: '80',
    termLength: '6',
    termUnit: 'months',
    paymentSchedule: 'daily-ach',
    processingPercentage: '15',
    flatPaymentAmount: '',
    paymentFrequency: 'weekly',
    borrowingCostPerMonth: '2',
    loanDate: '',
    dueDate: '',
    hasRep: false,
    repFirstName: '',
    repLastName: '',
    repCommissionType: 'profit',
    repCommissionPercentage: '5',
    paymentType: 'amortizing',
    pricingProgram: 'cash-discount',
    cashDiscountRate: '3.5',
    cardProcessingCost: '2.0',
    estimatedMonthlyProcessingVolume: '',
    leaseFactorRate: '0.0295',
    numberOfEquipment: '1',
    equipmentCost: '',
    monthlySubscriptionFee: '',
    leaseSalesRepCommission: '25',
    leaseDeploymentFee: '300',
    residualRepFirstName: '',
    residualRepLastName: '',
    residualRepCommissionPercentage: '25',
  });

  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [showPaymentSchedule, setShowPaymentSchedule] = useState(false);
  const [showRiskExplainers, setShowRiskExplainers] = useState(false);
  const [showMonthlyDeployment, setShowMonthlyDeployment] = useState(false);
  const [activeTab, setActiveTab] = useState<'mca' | 'residual' | 'lease' | 'summary'>('mca');
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [cashFlowRowsToShow, setCashFlowRowsToShow] = useState(12);
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set());
  const [paybackToLenderPercentage, setPaybackToLenderPercentage] = useState(85); // Default 85% payback
  const [showDealTypeModal, setShowDealTypeModal] = useState(false);
  const [selectedDealTypes, setSelectedDealTypes] = useState<Array<'MCA' | 'Residual Income' | 'Lease Commissions'>>([]);
  const [dealInitiated, setDealInitiated] = useState(false);
  
  // Editable cash flow state
  interface EditableCashFlowRow {
    month: number;
    monthName: string;
    paymentReceived: number;
    principalPaydown: number;
    repCommission: number;
  }
  const [editableCashFlow, setEditableCashFlow] = useState<EditableCashFlowRow[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const industries = [
    'Automotive Services',
    'Construction',
    'E-commerce',
    'Food & Beverage',
    'Healthcare & Medical',
    'Hospitality & Hotels',
    'Manufacturing',
    'Personal Services (Salon, Spa, Gym)',
    'Professional Services (Legal, Accounting)',
    'Real Estate',
    'Restaurants & Bars',
    'Retail',
    'Technology & Software',
    'Transportation & Logistics',
    'Trucking',
    'Wholesale',
    'Other',
  ];

  // Format number with commas and dollar sign
  const formatCurrency = (value: string): string => {
    if (!value) return '';
    const num = value.replace(/[^0-9]/g, '');
    if (!num || num === '0') return '';
    // Parse as integer to avoid floating point issues
    const parsed = parseInt(num, 10);
    if (isNaN(parsed)) return '';
    return parsed.toLocaleString();
  };

  // Handle currency input
  const handleCurrencyInput = (field: keyof BorrowerInfo, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setBorrowerInfo(prev => ({ ...prev, [field]: cleanValue }));
  };

  // Get lease factor rate based on credit score
  const getLeaseFactorRate = (creditScore: number): string => {
    if (creditScore >= 780) return '0.027';  // P - Premium
    if (creditScore >= 720) return '0.028';  // A - Excellent
    if (creditScore >= 680) return '0.029';  // B - Good
    if (creditScore >= 640) return '0.0295'; // C - Average
    if (creditScore >= 600) return '0.0425'; // D - Below Average
    return '0.0449';                          // E - Poor
  };

  // Get lease factor grade based on credit score
  const getLeaseFactorGrade = (creditScore: number): string => {
    if (creditScore >= 780) return 'P - Premium';
    if (creditScore >= 720) return 'A - Excellent';
    if (creditScore >= 680) return 'B - Good';
    if (creditScore >= 640) return 'C - Average';
    if (creditScore >= 600) return 'D - Below Average';
    return 'E - Poor';
  };

  // Get max loan percentage based on credit score
  const getMaxLoanPercentage = (): number => {
    const creditScore = parseFloat(borrowerInfo.creditScore) || 0;
    
    if (creditScore >= 750) return 100;      // Excellent: up to 100%
    if (creditScore >= 700) return 90;       // Good: up to 90%
    if (creditScore >= 680) return 80;       // Fair: up to 80%
    if (creditScore >= 650) return 70;       // Below Average: up to 70%
    if (creditScore >= 620) return 60;       // Poor: up to 60%
    return 50;                                // Very Poor: max 50%
  };

  // Calculate AI-based origination fee (1%-5% based on risk, minimum $500)
  const calculateOriginationFee = (loanAmount: number): { fee: number; percentage: number; reason: string } => {
    const creditScore = parseFloat(borrowerInfo.creditScore) || 0;
    const yearsInBusiness = parseFloat(borrowerInfo.yearsInBusiness) || 0;
    const industry = borrowerInfo.industry;

    // Base percentage calculation
    let feePercentage = 3; // Start at 3% baseline (middle of 1-5% range)
    let riskFactors: string[] = [];

    // Credit Score Risk (most important factor)
    if (creditScore >= 750) {
      feePercentage -= 1.5; // Excellent credit reduces fee
      riskFactors.push('Excellent credit (-1.5%)');
    } else if (creditScore >= 700) {
      feePercentage -= 1.0; // Good credit
      riskFactors.push('Good credit (-1.0%)');
    } else if (creditScore >= 680) {
      feePercentage -= 0.5; // Fair credit
      riskFactors.push('Fair credit (-0.5%)');
    } else if (creditScore >= 650) {
      feePercentage += 0.5; // Below average credit
      riskFactors.push('Below average credit (+0.5%)');
    } else if (creditScore >= 620) {
      feePercentage += 1.0; // Poor credit
      riskFactors.push('Poor credit (+1.0%)');
    } else {
      feePercentage += 1.5; // Very poor credit
      riskFactors.push('Very poor credit (+1.5%)');
    }

    // Business Maturity Risk
    if (yearsInBusiness >= 10) {
      feePercentage -= 0.75; // Well-established business
      riskFactors.push('Established business 10+ years (-0.75%)');
    } else if (yearsInBusiness >= 5) {
      feePercentage -= 0.25; // Moderate maturity
      riskFactors.push('Moderate maturity 5+ years (-0.25%)');
    } else if (yearsInBusiness >= 3) {
      feePercentage += 0.25; // Young business
      riskFactors.push('Young business 3-5 years (+0.25%)');
    } else if (yearsInBusiness >= 1) {
      feePercentage += 0.5; // Very young
      riskFactors.push('Very young business 1-3 years (+0.5%)');
    } else {
      feePercentage += 1.0; // Startup
      riskFactors.push('Startup business <1 year (+1.0%)');
    }

    // Industry Risk
    const highRiskIndustries = ['Restaurants & Bars', 'Construction', 'Retail & Wholesale'];
    const moderateRiskIndustries = ['E-commerce', 'Hospitality & Hotels', 'Food & Beverage', 'Automotive Services'];
    const lowRiskIndustries = ['Healthcare & Medical', 'Professional Services (Legal, Accounting)', 'Technology & Software'];

    if (highRiskIndustries.includes(industry)) {
      feePercentage += 0.75;
      riskFactors.push('High-risk industry (+0.75%)');
    } else if (moderateRiskIndustries.includes(industry)) {
      feePercentage += 0.25;
      riskFactors.push('Moderate-risk industry (+0.25%)');
    } else if (lowRiskIndustries.includes(industry)) {
      feePercentage -= 0.25;
      riskFactors.push('Low-risk industry (-0.25%)');
    }

    // Ensure within 1%-5% range
    feePercentage = Math.max(1, Math.min(5, feePercentage));

    // Calculate actual fee
    const calculatedFee = loanAmount * (feePercentage / 100);
    const finalFee = Math.max(500, calculatedFee); // Minimum $500

    const reason = riskFactors.join(', ');

    return {
      fee: Math.floor(finalFee),
      percentage: parseFloat(feePercentage.toFixed(2)),
      reason: reason || 'Standard risk assessment'
    };
  };

  const calculateMetrics = () => {
    // Use parseInt to avoid floating-point precision errors
    const m1 = parseInt(borrowerInfo.month1Residual.replace(/[^0-9]/g, ''), 10) || 0;
    const m2 = parseInt(borrowerInfo.month2Residual.replace(/[^0-9]/g, ''), 10) || 0;
    const m3 = parseInt(borrowerInfo.month3Residual.replace(/[^0-9]/g, ''), 10) || 0;
    const avgMonthlyResidual = Math.round((m1 + m2 + m3) / 3);
    
    const annualResidual = avgMonthlyResidual * 12;
    const loanPercentage = parseFloat(borrowerInfo.loanPercentage) / 100 || 0.80;
    const loanAmount = Math.floor(avgMonthlyResidual * loanPercentage);
    const factorRate = parseFloat(borrowerInfo.factorRate) || 1.35;
    const paybackAmount = Math.floor(loanAmount * factorRate);
    const grossProfit = paybackAmount - loanAmount;
    const profitPercentage = loanAmount > 0 ? ((grossProfit / loanAmount) * 100) : 0;
    
    const termLength = parseFloat(borrowerInfo.termLength) || 12;
    let paymentFrequency = 1;
    
    if (borrowerInfo.paymentSchedule === 'daily-ach' || borrowerInfo.paymentSchedule === 'daily-processing') {
      paymentFrequency = 22; // ~22 business days per month
    } else if (borrowerInfo.paymentSchedule === 'weekly') {
      paymentFrequency = 4;
    } else if (borrowerInfo.paymentSchedule === 'lump-sum') {
      paymentFrequency = 0; // Single payment at end
    } else if (borrowerInfo.paymentSchedule === 'flat') {
      // For flat payments, calculate based on payment frequency
      if (borrowerInfo.paymentFrequency === 'weekly') {
        paymentFrequency = 4; // 4 weeks per month
      } else if (borrowerInfo.paymentFrequency === 'bi-monthly') {
        paymentFrequency = 2; // Every 2 weeks = 2 payments per month
      } else if (borrowerInfo.paymentFrequency === 'monthly') {
        paymentFrequency = 1; // 1 payment per month
      }
    } else {
      paymentFrequency = 1;
    }
    
    const totalPayments = borrowerInfo.paymentSchedule === 'lump-sum' ? 1 : termLength * paymentFrequency;
    
    // Calculate payment amount
    let paymentAmount = 0;
    if (borrowerInfo.paymentSchedule === 'flat') {
      // For flat payments, use the user-specified amount
      paymentAmount = parseFloat(borrowerInfo.flatPaymentAmount) || 0;
    } else {
      // For percentage-based payments, calculate from payback amount
      paymentAmount = totalPayments > 0 ? Math.ceil(paybackAmount / totalPayments) : 0;
    }
    
    // Calculate what percentage of monthly revenue this represents
    const paymentPercentageOfSales = avgMonthlyResidual > 0 
      ? ((paymentAmount * paymentFrequency) / avgMonthlyResidual) * 100 
      : 0;

    // APR Calculation
    const totalCost = paybackAmount - loanAmount;
    const apr = loanAmount > 0 && termLength > 0 ? ((totalCost / loanAmount) / (termLength / 12)) * 100 : 0;

    // Borrowing cost calculations - FIXED: Now calculated monthly
    const borrowingCostPerMonth = parseFloat(borrowerInfo.borrowingCostPerMonth) / 100 || 0.02;
    
    // Calculate total interest on borrowed money (cost of money) - monthly basis
    let totalInterestCost = 0;
    let monthlyDeployment: Array<{month: number, startingPrincipal: number, principalReduction: number, interestCost: number, endingPrincipal: number}> = [];
    
    if (borrowerInfo.paymentType === 'interest-only') {
      // Interest only: pay interest on full principal for entire term
      totalInterestCost = loanAmount * borrowingCostPerMonth * termLength;
      
      // Generate monthly deployment schedule for interest-only
      for (let month = 1; month <= termLength; month++) {
        const interestCost = loanAmount * borrowingCostPerMonth;
        monthlyDeployment.push({
          month,
          startingPrincipal: loanAmount,
          principalReduction: 0,
          interestCost,
          endingPrincipal: loanAmount,
        });
        totalInterestCost += interestCost;
      }
    } else {
      // Amortizing: calculate based on declining balance MONTHLY
      let remainingPrincipal = loanAmount;
      const paymentsPerMonth = paymentFrequency;
      const monthlyPaybackFromCustomer = paymentAmount * paymentsPerMonth;
      
      for (let month = 1; month <= termLength; month++) {
        const startingPrincipal = remainingPrincipal;
        
        // Calculate interest on current outstanding balance
        const interestCost = remainingPrincipal * borrowingCostPerMonth;
        
        // Principal collected from customer this month
        const principalCollectedFromCustomer = Math.min(monthlyPaybackFromCustomer, remainingPrincipal);
        
        // Principal we actually pay back to our lender (based on slider percentage)
        // Higher payback % = we pay more to lender = faster reduction in our debt = lower interest next month
        const principalPaidToLender = principalCollectedFromCustomer * (paybackToLenderPercentage / 100);
        
        // Our remaining principal is reduced by what we actually pay to the lender
        remainingPrincipal = Math.max(0, remainingPrincipal - principalPaidToLender);
        
        monthlyDeployment.push({
          month,
          startingPrincipal,
          principalReduction: principalPaidToLender,  // What we actually paid to lender
          interestCost,
          endingPrincipal: remainingPrincipal,
        });
        
        totalInterestCost += interestCost;
        
        if (remainingPrincipal <= 0) break;
      }
    }
    
    // Rep commission calculations
    let repCommission = 0;
    if (borrowerInfo.hasRep) {
      const commissionPercentage = parseFloat(borrowerInfo.repCommissionPercentage) / 100 || 0.05;
      if (borrowerInfo.repCommissionType === 'profit') {
        repCommission = grossProfit * commissionPercentage;
      } else {
        repCommission = loanAmount * commissionPercentage;
      }
    }

    // Origination fee - AI-calculated based on risk (this is INCOME for us)
    const originationFeeData = calculateOriginationFee(loanAmount);

    // Net Profit = Gross Profit + Origination Fee - Rep Commission - Cost of Money
    const netProfit = grossProfit + originationFeeData.fee - repCommission - totalInterestCost;

    // Calculate effective cost of money percentage
    // This is the ACTUAL cost based on declining balance, not the nominal monthly rate
    // Example: If we borrow $40k at 2%/month for 6 months with no payback = 12% total ($4,800)
    // But if we pay principal monthly, actual cost is lower due to declining balance
    const effectiveCostOfMoneyPercentage = loanAmount > 0 ? (totalInterestCost / loanAmount) * 100 : 0;

    // Cash Discount Program Calculations
    const cashDiscountRate = parseFloat(borrowerInfo.cashDiscountRate) || 0;
    const cardProcessingCost = parseFloat(borrowerInfo.cardProcessingCost) || 0;
    const netMargin = cashDiscountRate - cardProcessingCost;
    // Auto-populate from 3-month average if not manually set
    const monthlyProcessingVolume = parseFloat(borrowerInfo.estimatedMonthlyProcessingVolume) || avgMonthlyResidual;
    const monthlyResidualIncome = monthlyProcessingVolume * (netMargin / 100);
    
    // Calculate residual rep commission
    const residualRepCommissionPercentage = parseFloat(borrowerInfo.residualRepCommissionPercentage) / 100 || 0.25;
    const hasResidualRep = borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName;
    const residualRepCommissionMonthly = hasResidualRep ? monthlyResidualIncome * residualRepCommissionPercentage : 0;
    const residualRepCommissionAnnual = residualRepCommissionMonthly * 12;
    const residualRepCommissionLTV = residualRepCommissionMonthly * 48; // 48-month LTV
    
    // Net residual income after commission
    const netMonthlyResidualIncome = monthlyResidualIncome - residualRepCommissionMonthly;
    const annualResidualIncome = netMonthlyResidualIncome * 12;
    const ltvResidualIncome = netMonthlyResidualIncome * 48;

    return {
      avgMonthlyResidual,
      annualResidual,
      loanAmount,
      paybackAmount,
      grossProfit,
      profitPercentage,
      paymentAmount,
      paymentPercentageOfSales,
      totalPayments,
      termLength,
      apr,
      borrowingCostPerMonth,
      repCommission,
      totalInterestCost,
      effectiveCostOfMoneyPercentage,
      originationFee: originationFeeData.fee,
      originationFeePercentage: originationFeeData.percentage,
      originationFeeReason: originationFeeData.reason,
      netProfit,
      monthlyDeployment,
      cashDiscountRate,
      cardProcessingCost,
      netMargin,
      monthlyProcessingVolume,
      monthlyResidualIncome,
      annualResidualIncome,
      ltvResidualIncome,
      residualRepCommissionMonthly,
      residualRepCommissionAnnual,
      residualRepCommissionLTV,
      netMonthlyResidualIncome,
    };
  };

  // Generate amortization schedule
  const generateAmortizationSchedule = (): PaymentScheduleItem[] => {
    const metrics = calculateMetrics();
    const schedule: PaymentScheduleItem[] = [];
    
    const monthlyBorrowingRate = metrics.borrowingCostPerMonth;
    let remainingPrincipal = metrics.loanAmount;
    let totalInterestPaid = 0;
    const paymentAmount = metrics.paymentAmount;

    for (let i = 1; i <= metrics.totalPayments; i++) {
      const interestPaid = remainingPrincipal * monthlyBorrowingRate;
      const principalPaid = Math.min(paymentAmount - interestPaid, remainingPrincipal);
      
      totalInterestPaid += interestPaid;
      remainingPrincipal = Math.max(0, remainingPrincipal - principalPaid);

      schedule.push({
        paymentNumber: i,
        paymentAmount,
        principalPaid,
        interestPaid,
        remainingPrincipal,
        totalInterestPaid,
      });

      if (remainingPrincipal <= 0) break;
    }

    return schedule;
  };

  const downloadAmortizationExcel = () => {
    const schedule = generateAmortizationSchedule();
    const metrics = calculateMetrics();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header information
    csvContent += `Deal Name: ${borrowerInfo.dealName}\n`;
    csvContent += `Loan Amount: $${metrics.loanAmount.toLocaleString()}\n`;
    csvContent += `Payback Amount: $${metrics.paybackAmount.toLocaleString()}\n`;
    csvContent += `Factor Rate: ${borrowerInfo.factorRate}\n`;
    csvContent += `Term Length: ${metrics.termLength} months\n`;
    csvContent += `Monthly Payment: $${metrics.paymentAmount.toLocaleString()}\n`;
    csvContent += `APR: ${metrics.apr.toFixed(2)}%\n`;
    csvContent += `\n`;
    
    // Add schedule header
    csvContent += "Payment #,Payment Amount,Principal Paid,Interest Paid,Remaining Principal,Total Interest Paid\n";
    
    // Add schedule data
    schedule.forEach(row => {
      csvContent += `${row.paymentNumber},${row.paymentAmount.toFixed(2)},${row.principalPaid.toFixed(2)},${row.interestPaid.toFixed(2)},${row.remainingPrincipal.toFixed(2)},${row.totalInterestPaid.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${borrowerInfo.dealName || 'MCA-Deal'}_Amortization_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Initialize editable cash flow with defaults
  const initializeEditableCashFlow = () => {
    const metrics = calculateMetrics();
    const termLength = metrics.termLength;
    const loanStartDate = new Date(borrowerInfo.loanDate || new Date());
    
    // Calculate default monthly payment
    const defaultMonthlyPayment = metrics.paybackAmount / termLength;
    
    // Create rows for each month
    const rows: EditableCashFlowRow[] = [];
    for (let i = 0; i < termLength; i++) {
      const monthDate = new Date(loanStartDate);
      monthDate.setMonth(loanStartDate.getMonth() + i);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      rows.push({
        month: i + 1,
        monthName,
        paymentReceived: defaultMonthlyPayment,
        principalPaydown: defaultMonthlyPayment * 0.85, // 85% default
        repCommission: 0, // Will calculate if rep exists
      });
    }
    
    setEditableCashFlow(rows);
  };
  
  // Calculate cash flow metrics from editable data
  const calculateEditableCashFlowMetrics = () => {
    const metrics = calculateMetrics();
    const loanAmount = metrics.loanAmount;
    const monthlyBorrowingRate = metrics.borrowingCostPerMonth;
    
    let remainingBalance = loanAmount;
    let cumulativeProfit = 0;
    let cumulativeBorrowingCost = 0;
    let cumulativeRepCommission = 0;
    
    const results = editableCashFlow.map((row) => {
      // Our borrowing cost on the outstanding balance at START of month
      const ourBorrowingCost = remainingBalance * monthlyBorrowingRate;
      cumulativeBorrowingCost += ourBorrowingCost;
      
      // Calculate what's left after principal paydown and rep commission
      const totalDeductions = row.principalPaydown + row.repCommission;
      const factorIncome = row.paymentReceived - totalDeductions;
      
      // Update remaining balance
      const principalReduction = Math.min(row.principalPaydown, remainingBalance);
      const newRemainingBalance = Math.max(0, remainingBalance - principalReduction);
      
      // Monthly net profit = Payment Received - Principal Paydown - Rep Commission - Borrowing Cost
      const monthlyNetProfit = row.paymentReceived - row.principalPaydown - row.repCommission - ourBorrowingCost;
      cumulativeProfit += monthlyNetProfit;
      cumulativeRepCommission += row.repCommission;
      
      const result = {
        ...row,
        ourBorrowingCost,
        factorIncome,
        principalReduction,
        remainingBalance: newRemainingBalance,
        monthlyNetProfit,
        cumulativeProfit,
      };
      
      remainingBalance = newRemainingBalance;
      return result;
    });
    
    return {
      rows: results,
      totalPaymentReceived: editableCashFlow.reduce((sum, row) => sum + row.paymentReceived, 0),
      totalPrincipalPaydown: editableCashFlow.reduce((sum, row) => sum + row.principalPaydown, 0),
      totalRepCommission: cumulativeRepCommission,
      totalBorrowingCost: cumulativeBorrowingCost,
      totalNetProfit: cumulativeProfit,
    };
  };
  
  // Update a specific cash flow row
  const updateCashFlowRow = (month: number, field: 'paymentReceived' | 'principalPaydown' | 'repCommission', value: number) => {
    setEditableCashFlow(prev => 
      prev.map(row => 
        row.month === month 
          ? { ...row, [field]: value }
          : row
      )
    );
  };

  // Generate comprehensive monthly cash flow schedule
  const generateCashFlowSchedule = (): CashFlowScheduleItem[] => {
    const metrics = calculateMetrics();
    
    const termLength = metrics.termLength;
    const loanAmount = metrics.loanAmount;
    const paybackAmount = metrics.paybackAmount;
    const monthlyBorrowingRate = metrics.borrowingCostPerMonth; // 2% per month
    
    // Get the loan start date
    const loanStartDate = new Date(borrowerInfo.loanDate || new Date());
    
    // Determine payment schedule details
    let daysPerPayment = 30; // Default for monthly
    let totalPayments = termLength; // Default for monthly
    
    if (borrowerInfo.paymentSchedule === 'daily-ach' || borrowerInfo.paymentSchedule === 'daily-processing') {
      daysPerPayment = 1;
      totalPayments = termLength * 22; // ~22 business days per month
    } else if (borrowerInfo.paymentSchedule === 'weekly') {
      daysPerPayment = 7;
      totalPayments = Math.ceil(termLength * 4.33); // ~4.33 weeks per month on average
    } else if (borrowerInfo.paymentSchedule === 'lump-sum') {
      daysPerPayment = termLength * 30;
      totalPayments = 1;
    } else if (borrowerInfo.paymentSchedule === 'flat') {
      if (borrowerInfo.paymentFrequency === 'weekly') {
        daysPerPayment = 7;
        totalPayments = Math.ceil(termLength * 4.33);
      } else if (borrowerInfo.paymentFrequency === 'bi-monthly') {
        daysPerPayment = 14;
        totalPayments = termLength * 2;
      } else if (borrowerInfo.paymentFrequency === 'monthly') {
        daysPerPayment = 30;
        totalPayments = termLength;
      }
    }
    
    // Calculate per-payment amount
    let perPaymentAmount = 0;
    if (borrowerInfo.paymentSchedule === 'flat') {
      perPaymentAmount = parseFloat(borrowerInfo.flatPaymentAmount) || 0;
    } else {
      perPaymentAmount = paybackAmount / totalPayments;
    }
    
    // Step 1: Generate all individual payments with actual dates
    interface IndividualPayment {
      paymentNumber: number;
      date: Date;
      amount: number;
      monthKey: string; // "2025-10" for October 2025
      monthName: string; // "October 2025"
    }
    
    const allPayments: IndividualPayment[] = [];
    for (let i = 0; i < totalPayments; i++) {
      const paymentDate = new Date(loanStartDate);
      paymentDate.setDate(loanStartDate.getDate() + (i * daysPerPayment));
      
      const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = paymentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      allPayments.push({
        paymentNumber: i + 1,
        date: paymentDate,
        amount: perPaymentAmount,
        monthKey,
        monthName,
      });
    }
    
    // Step 2: Group payments by calendar month
    const paymentsByMonth = new Map<string, IndividualPayment[]>();
    allPayments.forEach(payment => {
      if (!paymentsByMonth.has(payment.monthKey)) {
        paymentsByMonth.set(payment.monthKey, []);
      }
      paymentsByMonth.get(payment.monthKey)!.push(payment);
    });
    
    // Debug logging
    console.log('=== CASH FLOW SCHEDULE DEBUG ===');
    console.log('Loan Start Date:', loanStartDate.toLocaleDateString());
    console.log('Total Payments:', totalPayments);
    console.log('Days Per Payment:', daysPerPayment);
    console.log('First 5 payments:', allPayments.slice(0, 5).map(p => ({
      num: p.paymentNumber,
      date: p.date.toLocaleDateString(),
      monthKey: p.monthKey,
      monthName: p.monthName
    })));
    console.log('Grouped by month:', Array.from(paymentsByMonth.entries()).map(([key, payments]) => ({
      monthKey: key,
      monthName: payments[0].monthName,
      count: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    })));
    console.log('================================');
    
    // Step 3: Build schedule by calendar month
    const schedule: CashFlowScheduleItem[] = [];
    let remainingBalance = loanAmount;
    let cumulativeProfit = 0;
    let monthIndex = 1;
    
    // Sort month keys chronologically
    const sortedMonthKeys = Array.from(paymentsByMonth.keys()).sort();
    
    for (const monthKey of sortedMonthKeys) {
      const monthPayments = paymentsByMonth.get(monthKey)!;
      const monthName = monthPayments[0].monthName;
      
      // Calculate total merchant payment for this calendar month
      const merchantPayment = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Our borrowing cost on the outstanding balance at START of month
      const ourBorrowingCost = remainingBalance * monthlyBorrowingRate;
      
      // Calculate principal reduction and factor income
      const totalFactorProfit = paybackAmount - loanAmount;
      const avgMonthlyFactorProfit = totalFactorProfit / termLength;
      
      const principalReduction = Math.min(merchantPayment - avgMonthlyFactorProfit, remainingBalance);
      const factorIncome = merchantPayment - principalReduction;
      
      // Principal payback to lender
      const principalPaybackToLender = principalReduction * (paybackToLenderPercentage / 100);
      
      // Update remaining balance
      const newRemainingBalance = Math.max(0, remainingBalance - principalReduction);
      
      // Monthly net profit
      const retainedPrincipal = principalReduction - principalPaybackToLender;
      const monthlyNetProfit = factorIncome + retainedPrincipal - ourBorrowingCost;
      cumulativeProfit += monthlyNetProfit;
      
      // Build payment breakdown with proper week numbering
      let monthlyRemainingBalance = remainingBalance;
      const payments = monthPayments.map((payment, idx) => {
        const paymentPrincipalPortion = principalReduction / monthPayments.length;
        const paymentFactorPortion = factorIncome / monthPayments.length;
        monthlyRemainingBalance -= paymentPrincipalPortion;
        
        const actualDateStr = payment.date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        let dateStr = '';
        if (borrowerInfo.paymentSchedule === 'daily-ach' || borrowerInfo.paymentSchedule === 'daily-processing') {
          dateStr = `Day ${idx + 1}`;
        } else if (borrowerInfo.paymentSchedule === 'weekly' || 
                   (borrowerInfo.paymentSchedule === 'flat' && borrowerInfo.paymentFrequency === 'weekly')) {
          dateStr = `Week ${idx + 1}`;
        } else if (borrowerInfo.paymentSchedule === 'flat' && borrowerInfo.paymentFrequency === 'bi-monthly') {
          dateStr = `Payment ${idx + 1}`;
        } else {
          dateStr = `Payment ${idx + 1}`;
        }
        
        return {
          paymentNumber: payment.paymentNumber,
          date: dateStr,
          actualDate: actualDateStr,
          amount: payment.amount,
          principalPortion: paymentPrincipalPortion,
          factorPortion: paymentFactorPortion,
          remainingBalance: Math.max(0, monthlyRemainingBalance),
        };
      });
      
      schedule.push({
        month: monthIndex++,
        monthName,
        merchantPayment,
        principalReduction,
        factorIncome,
        ourBorrowingCost,
        principalPaybackToLender,
        remainingBalance: newRemainingBalance,
        monthlyNetProfit,
        cumulativeProfit,
        payments,
      });
      
      remainingBalance = newRemainingBalance;
      if (remainingBalance <= 0) break;
    }
    
    return schedule;
  };

  const downloadCashFlowExcel = () => {
    const schedule = generateCashFlowSchedule();
    const metrics = calculateMetrics();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header information
    csvContent += `Deal Name: ${borrowerInfo.dealName}\n`;
    csvContent += `Loan Amount: $${metrics.loanAmount.toLocaleString()}\n`;
    csvContent += `Payback Amount: $${metrics.paybackAmount.toLocaleString()}\n`;
    csvContent += `Payment Schedule: ${borrowerInfo.paymentSchedule}\n`;
    csvContent += `Term Length: ${metrics.termLength} months\n`;
    csvContent += `Borrowing Cost: ${(metrics.borrowingCostPerMonth * 100).toFixed(0)}% per month\n`;
    csvContent += `\n`;
    
    // Add schedule header
    csvContent += "Month,Merchant Payment,Principal Reduction,Factor Income,Our Borrowing Cost,Principal Payback to Lender,Remaining Balance,Monthly Net Profit,Cumulative Profit\n";
    
    // Add schedule data
    schedule.forEach(row => {
      csvContent += `${row.month},${row.merchantPayment.toFixed(2)},${row.principalReduction.toFixed(2)},${row.factorIncome.toFixed(2)},${row.ourBorrowingCost.toFixed(2)},${row.principalPaybackToLender.toFixed(2)},${row.remainingBalance.toFixed(2)},${row.monthlyNetProfit.toFixed(2)},${row.cumulativeProfit.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${borrowerInfo.dealName || 'MCA-Deal'}_Cash_Flow_Analysis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const assessRisk = (): RiskAssessment => {
    const creditScore = parseFloat(borrowerInfo.creditScore) || 0;
    const yearsInBusiness = parseFloat(borrowerInfo.yearsInBusiness) || 0;
    const metrics = calculateMetrics();
    const loanToIncomeRatio = metrics.annualResidual > 0 ? metrics.loanAmount / metrics.annualResidual : 0;

    const highRiskIndustries = ['Restaurants & Bars', 'Retail', 'Construction', 'Hospitality & Hotels', 'Food & Beverage'];
    const lowRiskIndustries = ['Professional Services (Legal, Accounting)', 'Healthcare & Medical', 'Technology & Software'];

    let industryRisk: 'High' | 'Moderate' | 'Low' = 'Moderate';
    if (highRiskIndustries.includes(borrowerInfo.industry)) {
      industryRisk = 'High';
    } else if (lowRiskIndustries.includes(borrowerInfo.industry)) {
      industryRisk = 'Low';
    }

    return {
      creditRisk: creditScore >= 680 ? 'Low' : creditScore >= 620 ? 'Moderate' : 'High',
      businessMaturityRisk: yearsInBusiness >= 3 ? 'Low' : yearsInBusiness >= 1.5 ? 'Moderate' : 'High',
      industryRisk,
      loanToIncomeRatio: loanToIncomeRatio <= 0.3 ? 'Low' : loanToIncomeRatio <= 0.5 ? 'Moderate' : 'High',
      loanPercentageRisk: parseFloat(borrowerInfo.loanPercentage) > 80 ? 'High' : 'Moderate',
    };
  };

  const getRiskExplanation = (riskType: string, riskLevel: 'High' | 'Moderate' | 'Low'): string => {
    const explanations: Record<string, Record<string, string>> = {
      creditRisk: {
        High: 'Credit score below 620 indicates significant default risk. Historical data shows higher delinquency rates.',
        Moderate: 'Credit score 620-679 is acceptable but requires enhanced monitoring and may warrant adjusted terms.',
        Low: 'Credit score 680+ indicates strong creditworthiness with low historical default rates.',
      },
      businessMaturityRisk: {
        High: 'Business under 1.5 years has limited operating history. New businesses have higher failure rates.',
        Moderate: 'Business 1.5-3 years shows moderate stability but still in growth phase requiring monitoring.',
        Low: 'Business 3+ years demonstrates proven track record and operational stability.',
      },
      industryRisk: {
        High: 'Industry has elevated failure rates, seasonal volatility, and economic sensitivity.',
        Moderate: 'Industry shows average risk profile with standard market fluctuations.',
        Low: 'Industry demonstrates stability, consistent demand, and lower than average failure rates.',
      },
      loanToIncomeRatio: {
        High: 'Loan exceeds 50% of annual income - high repayment burden may strain cash flow.',
        Moderate: 'Loan is 30-50% of annual income - manageable but requires cash flow monitoring.',
        Low: 'Loan under 30% of annual income - low burden with comfortable repayment capacity.',
      },
      loanPercentageRisk: {
        High: 'Loan exceeds 80% of monthly residual - aggressive lending that increases default risk.',
        Moderate: 'Loan at or below 80% of monthly residual - within recommended lending guidelines.',
      },
    };

    return explanations[riskType]?.[riskLevel] || '';
  };

  const generateAIRecommendation = (): AIRecommendation => {
    const risk = assessRisk();
    const metrics = calculateMetrics();
    const creditScore = parseFloat(borrowerInfo.creditScore) || 0;
    const yearsInBusiness = parseFloat(borrowerInfo.yearsInBusiness) || 0;

    let riskScore = 0;
    const suggestions: string[] = [];
    
    if (risk.creditRisk === 'High') riskScore += 30;
    else if (risk.creditRisk === 'Moderate') riskScore += 15;
    
    if (risk.businessMaturityRisk === 'High') riskScore += 25;
    else if (risk.businessMaturityRisk === 'Moderate') riskScore += 12;
    
    if (risk.industryRisk === 'High') riskScore += 20;
    else if (risk.industryRisk === 'Moderate') riskScore += 10;
    
    if (risk.loanToIncomeRatio === 'High') riskScore += 25;
    else if (risk.loanToIncomeRatio === 'Moderate') riskScore += 12;

    if (risk.loanPercentageRisk === 'High') riskScore += 15;

    // AI Optimization Strategy
    const optimizedStrategy = {
      recommendedPaymentSchedule: '',
      recommendedTermLength: 12,
      estimatedROI: 0,
      projectedNetProfit: metrics.netProfit,
      riskMitigationSteps: [] as string[],
    };

    // Determine optimal payment schedule based on risk profile
    if (risk.creditRisk === 'High' || risk.businessMaturityRisk === 'High') {
      optimizedStrategy.recommendedPaymentSchedule = 'Daily ACH';
      optimizedStrategy.riskMitigationSteps.push('Daily payment monitoring for early default detection');
      optimizedStrategy.riskMitigationSteps.push('Weekly cash flow reviews for first 3 months');
    } else if (risk.industryRisk === 'High') {
      optimizedStrategy.recommendedPaymentSchedule = 'Daily ACH';
      optimizedStrategy.riskMitigationSteps.push('Daily ACH reduces exposure to industry volatility');
    } else {
      optimizedStrategy.recommendedPaymentSchedule = borrowerInfo.paymentSchedule === 'daily-ach' ? 'Daily ACH' : 'Weekly';
      optimizedStrategy.riskMitigationSteps.push('Current payment schedule is acceptable for this risk profile');
    }

    // Optimize term length
    if (risk.industryRisk === 'High' || risk.creditRisk === 'High') {
      optimizedStrategy.recommendedTermLength = 6;
      optimizedStrategy.riskMitigationSteps.push('Shorter 6-month term reduces default exposure');
    } else if (risk.creditRisk === 'Low' && risk.businessMaturityRisk === 'Low') {
      optimizedStrategy.recommendedTermLength = 12;
      optimizedStrategy.riskMitigationSteps.push('12-month term maximizes net profit while maintaining acceptable risk');
    } else {
      optimizedStrategy.recommendedTermLength = 9;
      optimizedStrategy.riskMitigationSteps.push('9-month term balances profit optimization with risk management');
    }

    // Calculate ROI
    optimizedStrategy.estimatedROI = metrics.loanAmount > 0 ? (metrics.netProfit / metrics.loanAmount) * 100 : 0;

    // Payment type optimization
    if (borrowerInfo.paymentType === 'amortizing') {
      optimizedStrategy.riskMitigationSteps.push('Amortizing payments reduce cost of money by $' + Math.floor(metrics.loanAmount * 0.02 * (parseFloat(borrowerInfo.termLength) / 2)).toLocaleString());
    } else {
      optimizedStrategy.riskMitigationSteps.push('Consider switching to amortizing to reduce total interest cost');
    }

    if (creditScore < 620) {
      suggestions.push(`Credit score ${creditScore} is below minimum threshold of 620`);
      suggestions.push('Request co-signer with credit score above 650');
      suggestions.push('Consider declining or requiring significant collateral');
      
      return {
        decision: 'DECLINE',
        reason: `Credit score of ${creditScore} falls below acceptable threshold of 620 for MCA lending.`,
        riskScore: Math.max(riskScore, 75),
        suggestions,
        optimizedStrategy,
      };
    }

    if (yearsInBusiness < 1) {
      suggestions.push(`Business has only been operating for ${yearsInBusiness} years`);
      suggestions.push('Require personal guarantee and 6 months bank statements');
      suggestions.push('Business too new - high default risk');
      
      return {
        decision: 'DECLINE',
        reason: 'Business established less than 1 year - insufficient operating history for MCA approval.',
        riskScore: Math.max(riskScore, 70),
        suggestions,
        optimizedStrategy,
      };
    }

    if (riskScore >= 70) {
      if (risk.creditRisk === 'High') {
        suggestions.push(`Credit score ${creditScore} indicates high risk - between 620-680 range`);
      }
      if (risk.businessMaturityRisk === 'High') {
        suggestions.push(`Business only ${yearsInBusiness} years old - limited track record`);
      }
      if (risk.industryRisk === 'High') {
        suggestions.push(`${borrowerInfo.industry} is a high-risk industry with elevated default rates`);
      }
      
      return {
        decision: 'DECLINE',
        reason: 'Multiple high-risk factors detected. Overall risk profile exceeds lending thresholds.',
        riskScore,
        suggestions,
        optimizedStrategy,
      };
    } else if (riskScore >= 45) {
      const originalLoanPercentage = parseFloat(borrowerInfo.loanPercentage);
      const originalFactorRate = parseFloat(borrowerInfo.factorRate);
      const adjustedLoanPercentage = Math.max(originalLoanPercentage * 0.75, 50);
      const adjustedFactorRate = Math.min(originalFactorRate * 1.12, 1.50);
      
      suggestions.push(`Reduce loan percentage from ${originalLoanPercentage}% to ${adjustedLoanPercentage.toFixed(0)}% of monthly average`);
      suggestions.push(`Increase factor rate from ${originalFactorRate} to ${adjustedFactorRate.toFixed(2)} to compensate for risk`);
      
      if (creditScore >= 620 && creditScore < 650) {
        suggestions.push(`Credit score ${creditScore} is acceptable but below ideal - monitor closely`);
      } else if (creditScore >= 650 && creditScore < 680) {
        suggestions.push(`Credit score ${creditScore} is fair - consider monthly check-ins`);
      }
      
      if (yearsInBusiness >= 1 && yearsInBusiness < 2) {
        suggestions.push(`Business is ${yearsInBusiness} years old - require quarterly financial reviews`);
      } else if (yearsInBusiness >= 2 && yearsInBusiness < 3) {
        suggestions.push(`Business maturity acceptable at ${yearsInBusiness} years - biannual reviews recommended`);
      }
      
      if (borrowerInfo.paymentSchedule === 'monthly' || borrowerInfo.paymentSchedule === 'weekly') {
        suggestions.push('Switch to daily ACH payments for better cash flow monitoring and lower default risk');
      }
      
      if (risk.industryRisk === 'High') {
        suggestions.push(`${borrowerInfo.industry} requires weekly sales reports and daily payment reconciliation`);
        suggestions.push('Consider shorter term length (6-9 months) due to industry volatility');
      }
      
      if (parseFloat(borrowerInfo.loanPercentage) > 75) {
        suggestions.push('Loan percentage exceeds conservative threshold - reduce to 70% or below');
      }
      
      return {
        decision: 'REVIEW',
        reason: 'Moderate risk profile detected. Proceed with adjusted terms and enhanced monitoring.',
        riskScore,
        adjustedLoanPercentage,
        adjustedFactorRate,
        suggestions,
        optimizedStrategy,
      };
    } else {
      suggestions.push('All risk factors within acceptable ranges - approved for standard terms');
      
      if (creditScore >= 720) {
        suggestions.push(`Excellent credit score of ${creditScore} - consider offering 1.25-1.30 factor rate as incentive`);
      }
      
      if (yearsInBusiness >= 5) {
        suggestions.push(`Well-established business (${yearsInBusiness} years) - eligible for higher loan amounts in future`);
      }
      
      if (risk.industryRisk === 'Low') {
        suggestions.push(`${borrowerInfo.industry} is a low-risk industry - stable revenue expected`);
      }
      
      if (borrowerInfo.paymentSchedule === 'daily-ach') {
        suggestions.push('Daily ACH payment schedule provides optimal cash flow monitoring');
      }
      
      return {
        decision: 'APPROVE',
        reason: 'Strong borrower profile with low risk indicators. Recommended for funding at standard terms.',
        riskScore,
        suggestions,
        optimizedStrategy,
      };
    }
  };

  const handleAnalyze = () => {
    const risk = assessRisk();
    const aiRec = generateAIRecommendation();
    setRiskAssessment(risk);
    setRecommendation(aiRec);
  };

  const metrics = calculateMetrics();
  const amortizationSchedule = generateAmortizationSchedule();
  const cashFlowSchedule = generateCashFlowSchedule();

  const handleInputChange = (field: keyof BorrowerInfo, value: string | boolean) => {
    setBorrowerInfo(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-adjust loan percentage and lease factor rate when credit score changes
      if (field === 'creditScore') {
        const creditScore = parseFloat(value as string) || 0;
        let maxLoanPercentage = 50;
        
        if (creditScore >= 750) maxLoanPercentage = 100;
        else if (creditScore >= 700) maxLoanPercentage = 90;
        else if (creditScore >= 680) maxLoanPercentage = 80;
        else if (creditScore >= 650) maxLoanPercentage = 70;
        else if (creditScore >= 620) maxLoanPercentage = 60;
        else maxLoanPercentage = 50;
        
        // Always sync loan percentage to match max recommended
        updated.loanPercentage = maxLoanPercentage.toString();
        
        // Auto-update lease factor rate based on credit score
        updated.leaseFactorRate = getLeaseFactorRate(creditScore);
      }
      
      // Auto-populate monthly processing volume from 3-month average when residuals change
      if (field === 'month1Residual' || field === 'month2Residual' || field === 'month3Residual') {
        // Parse as integers to avoid floating-point precision errors
        // Remove all non-digit characters first to ensure clean parsing
        const cleanM1 = (field === 'month1Residual' ? value as string : prev.month1Residual).replace(/[^0-9]/g, '');
        const cleanM2 = (field === 'month2Residual' ? value as string : prev.month2Residual).replace(/[^0-9]/g, '');
        const cleanM3 = (field === 'month3Residual' ? value as string : prev.month3Residual).replace(/[^0-9]/g, '');
        
        const m1 = parseInt(cleanM1, 10) || 0;
        const m2 = parseInt(cleanM2, 10) || 0;
        const m3 = parseInt(cleanM3, 10) || 0;
        const avgResidual = Math.round((m1 + m2 + m3) / 3);
        
        // Only auto-populate if the field is empty
        if (!prev.estimatedMonthlyProcessingVolume && avgResidual > 0) {
          updated.estimatedMonthlyProcessingVolume = avgResidual.toString();
        }
      }
      
      return updated;
    });
  };

  const getPaymentScheduleLabel = () => {
    switch (borrowerInfo.paymentSchedule) {
      case 'daily-ach':
        return 'Daily (% of Sales)';
      case 'weekly':
        return 'Weekly (% of Sales)';
      case 'monthly':
        return 'Monthly (% of Sales)';
      case 'flat':
        const freq = borrowerInfo.paymentFrequency === 'bi-monthly' ? 'Bi-Monthly' : 
                     borrowerInfo.paymentFrequency === 'monthly' ? 'Monthly' : 'Weekly';
        return `${freq} Flat Payment`;
      case 'lump-sum':
        return 'Lump Sum at End';
      default:
        return '';
    }
  };

  const handleToggleDealType = (type: 'MCA' | 'Residual Income' | 'Lease Commissions') => {
    setSelectedDealTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleInitiateDeal = async () => {
    // Open modal to select deal types
    setShowDealTypeModal(true);
    // Pre-select all deal types by default
    setSelectedDealTypes(['MCA', 'Residual Income', 'Lease Commissions']);
  };

  const handleConfirmDealTypes = async () => {
    if (selectedDealTypes.length === 0) {
      alert('Please select at least one deal type to initiate.');
      return;
    }

    const metrics = calculateMetrics();
    const results: Array<{ success: boolean; error?: string; dealType?: string }> = [];

    // Create deals for each selected type
    for (const dealType of selectedDealTypes) {
      // Base deal data common to all types
      const baseDealData = {
        id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealName: borrowerInfo.dealName,
        borrower: borrowerInfo.dealName,
        status: 'Pending' as const,
        loanAmountReceived: metrics.loanAmount,
        repaymentAmountDue: metrics.paybackAmount,
        grossInterest: parseFloat(((metrics.grossProfit / metrics.loanAmount) * 100).toFixed(2)),
        issuer: 'Patrick Johnson',
        amountIssued: metrics.loanAmount,
        borrowTermMonths: metrics.termLength,
        grossRevenue: metrics.paybackAmount,
        costToIssuer: metrics.loanAmount,
        grossProfit: metrics.grossProfit,
        srCommission: metrics.repCommission,
        netProfit: metrics.netProfit,
        profitShares: [],
        borrowerInfo,
        metrics,
        recommendation,
        dailyDefaultRate: 1.50,
        dealType: dealType,
        // Add missing fields from Analyze Deal section
        residualMonth1: parseFloat(borrowerInfo.month1Residual) || 0,
        residualMonth2: parseFloat(borrowerInfo.month2Residual) || 0,
        residualMonth3: parseFloat(borrowerInfo.month3Residual) || 0,
        loanPercentage: parseFloat(borrowerInfo.loanPercentage) || 0,
        borrowingCostPerMonth: parseFloat(borrowerInfo.borrowingCostPerMonth) || 2,
        originationFee: metrics.originationFee,
        originationFeePercentage: metrics.originationFeePercentage,
        originationFeeReason: metrics.originationFeeReason,
        loanToIncomeRatio: metrics.annualResidual > 0 ? metrics.loanAmount / metrics.annualResidual : 0,
        monthlyDeployment: metrics.monthlyDeployment,
        creditScore: parseFloat(borrowerInfo.creditScore) || 0,
        industry: borrowerInfo.industry,
        yearsInBusiness: parseFloat(borrowerInfo.yearsInBusiness) || 0,
        factorRate: borrowerInfo.factorRate,
        termLength: metrics.termLength,
        termUnit: borrowerInfo.termUnit || 'months',
        paymentSchedule: borrowerInfo.paymentSchedule,
        flatPaymentAmount: parseFloat(borrowerInfo.flatPaymentAmount) || 0,
        paymentFrequency: borrowerInfo.paymentFrequency,
        apr: metrics.apr,
        loanDate: borrowerInfo.loanDate,
        dueDate: borrowerInfo.dueDate,
      };

      // Add deal-type specific fields
      let dealData = { ...baseDealData };
      
      if (dealType === 'Residual Income') {
        // Add Residual Income specific fields
        dealData = {
          ...dealData,
          averageMonthlyVolume: parseFloat(borrowerInfo.estimatedMonthlyProcessingVolume) || 0,
          currentEquipmentDetails: `Pricing: ${borrowerInfo.pricingProgram}, Cash Discount: ${borrowerInfo.cashDiscountRate}%, Processing Cost: ${borrowerInfo.cardProcessingCost}%`,
        };
      } else if (dealType === 'Lease Commissions') {
        // Calculate lease commission values
        const leaseFactorRate = parseFloat(borrowerInfo.leaseFactorRate) || 0.030;
        const numberOfEquipment = parseFloat(borrowerInfo.numberOfEquipment) || 1;
        const equipmentCost = parseFloat(borrowerInfo.equipmentCost) || 0;
        const monthlySubscriptionFee = parseFloat(borrowerInfo.monthlySubscriptionFee) || 0;
        const totalMonthlySubscription = numberOfEquipment * monthlySubscriptionFee;
        const upfrontCommission = leaseFactorRate > 0 ? totalMonthlySubscription / leaseFactorRate : 0;
        
        // Add Lease Commission specific fields
        dealData = {
          ...dealData,
          equipmentName: `${numberOfEquipment}x Equipment @ $${equipmentCost.toLocaleString()}/unit`,
          equipmentPrice: numberOfEquipment * equipmentCost,
          upfrontCommission: upfrontCommission,
          monthlyCommissionAmount: totalMonthlySubscription,
        };
      }

      const result = await saveDeal(dealData);
      results.push({ ...result, dealType });
    }

    // Check if all deals were successful
    const allSuccessful = results.every(r => r.success);
    
    if (allSuccessful) {
      setDealInitiated(true);
      setShowDealTypeModal(false);
      // Don't reset selectedDealTypes so we can show what was created
    } else {
      const failed = results.filter(r => !r.success);
      alert(`❌ Some deals failed to save:\n${failed.map(f => `${f.dealType}: ${f.error}`).join('\n')}`);
    }
  };

  const handleOldInitiateDeal = async () => {
    const metrics = calculateMetrics();
    
    const dealData = {
      id: `deal_${Date.now()}`,
      dealName: borrowerInfo.dealName,
      borrower: borrowerInfo.dealName,
      status: 'Pending' as const,
      loanAmountReceived: metrics.loanAmount,
      repaymentAmountDue: metrics.paybackAmount,
      grossInterest: parseFloat(((metrics.grossProfit / metrics.loanAmount) * 100).toFixed(2)),
      issuer: 'Patrick Johnson',
      amountIssued: metrics.loanAmount,
      borrowTermMonths: metrics.termLength,
      grossRevenue: metrics.paybackAmount,
      costToIssuer: metrics.loanAmount,
      grossProfit: metrics.grossProfit,
      srCommission: metrics.repCommission,
      netProfit: metrics.netProfit,
      profitShares: [],
      borrowerInfo,
      metrics,
      recommendation,
      dailyDefaultRate: 1.50,
      // Add missing fields from Analyze Deal section
      residualMonth1: parseFloat(borrowerInfo.month1Residual) || 0,
      residualMonth2: parseFloat(borrowerInfo.month2Residual) || 0,
      residualMonth3: parseFloat(borrowerInfo.month3Residual) || 0,
      loanPercentage: parseFloat(borrowerInfo.loanPercentage) || 0,
      borrowingCostPerMonth: parseFloat(borrowerInfo.borrowingCostPerMonth) || 2,
      originationFee: metrics.originationFee,
      originationFeePercentage: metrics.originationFeePercentage,
      originationFeeReason: metrics.originationFeeReason,
      loanToIncomeRatio: metrics.annualResidual > 0 ? metrics.loanAmount / metrics.annualResidual : 0,
      monthlyDeployment: metrics.monthlyDeployment,
      creditScore: parseFloat(borrowerInfo.creditScore) || 0,
      industry: borrowerInfo.industry,
      yearsInBusiness: parseFloat(borrowerInfo.yearsInBusiness) || 0,
      factorRate: borrowerInfo.factorRate,
      termLength: metrics.termLength,
      termUnit: borrowerInfo.termUnit || 'months',
      paymentSchedule: borrowerInfo.paymentSchedule,
      flatPaymentAmount: parseFloat(borrowerInfo.flatPaymentAmount) || 0,
      paymentFrequency: borrowerInfo.paymentFrequency,
      apr: metrics.apr,
      loanDate: borrowerInfo.loanDate,
      dueDate: borrowerInfo.dueDate,
    };

    const result = await saveDeal(dealData);
    
    if (result.success) {
      alert(`✅ Deal "${borrowerInfo.dealName}" has been initiated and saved!\n\nLoan Amount: $${metrics.loanAmount.toLocaleString()}\nPayback: $${metrics.paybackAmount.toLocaleString()}\nNet Profit: $${metrics.netProfit.toLocaleString()}\n\nThe deal is now in Pending status and can be viewed in the All Deals section.`);
    } else {
      alert(`❌ Failed to save deal: ${result.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Analyze Deal</h1>
        <p className="text-gray-600">
          AI-powered evaluation and risk assessment for merchant cash advance applications
        </p>
      </div>

      {recommendation && (
        <div
          className={`rounded-xl border-2 p-4 sm:p-6 ${
            recommendation.decision === 'APPROVE'
              ? 'bg-green-50 border-green-400'
              : recommendation.decision === 'DECLINE'
              ? 'bg-red-50 border-red-400'
              : 'bg-yellow-50 border-yellow-400'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {recommendation.decision === 'APPROVE' ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            ) : recommendation.decision === 'DECLINE' ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <h2 className="text-lg sm:text-2xl">
                  {recommendation.decision === 'APPROVE' ? 'APPROVED' : recommendation.decision === 'DECLINE' ? 'DECLINED' : 'NEEDS REVIEW'}
                </h2>
                <span
                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                    recommendation.riskScore < 50
                      ? 'bg-green-100 text-green-700'
                      : recommendation.riskScore < 70
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  Risk Score: {recommendation.riskScore}/100
                </span>
              </div>
              <p
                className={`text-sm sm:text-base mb-4 ${
                  recommendation.decision === 'APPROVE'
                    ? 'text-green-800'
                    : recommendation.decision === 'DECLINE'
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }`}
              >
                {recommendation.reason}
              </p>
              
              {recommendation.suggestions && recommendation.suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm mb-2">AI Recommendations:</p>
                  <ul className="space-y-1">
                    {recommendation.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendation.decision === 'APPROVE' && !dealInitiated && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <button
                    onClick={handleInitiateDeal}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Initiate Deal - Move to Pending
                  </button>
                </div>
              )}

              {recommendation.decision === 'APPROVE' && dealInitiated && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-green-900 text-lg">Deal Initiated Successfully!</h4>
                    </div>
                    <p className="text-green-800 text-sm mb-3">
                      The following deals have been pushed to Pending status:
                    </p>
                    <ul className="space-y-2">
                      {selectedDealTypes.map(type => (
                        <li key={type} className="flex items-center gap-2 text-green-900">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{type}</span>
                          <span className="text-sm text-green-700">- {borrowerInfo.dealName}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-green-700 mt-3">
                      ✓ View all deals in the "All Deals" section and filter by type
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {recommendation && recommendation.optimizedStrategy && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 sm:p-6">
          <h3 className="mb-3 sm:mb-4 flex items-center gap-2 text-blue-900 text-base sm:text-lg">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            AI-Optimized Deployment Strategy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mb-4">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Recommended Payment Schedule</p>
              <p className="text-base sm:text-xl text-blue-700">{recommendation.optimizedStrategy.recommendedPaymentSchedule}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Optimal Term Length</p>
              <p className="text-base sm:text-xl text-blue-700">{recommendation.optimizedStrategy.recommendedTermLength} months</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Estimated ROI</p>
              <p className="text-base sm:text-xl text-blue-700">{recommendation.optimizedStrategy.estimatedROI.toFixed(1)}%</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-100">
            <p className="text-xs sm:text-sm mb-2 sm:mb-3">Risk Mitigation & Optimization Steps:</p>
            <ul className="space-y-2">
              {recommendation.optimizedStrategy.riskMitigationSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
            <h3 className="text-base sm:text-lg mb-4 sm:mb-6">Borrower Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Deal Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Johnson's Restaurant MCA"
                  value={borrowerInfo.dealName}
                  onChange={(e) => handleInputChange('dealName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm text-gray-600 mb-2">3-Month Residual History *</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Month 1</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        placeholder="4,500"
                        value={formatCurrency(borrowerInfo.month1Residual)}
                        onChange={(e) => handleCurrencyInput('month1Residual', e.target.value)}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Month 2</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        placeholder="4,700"
                        value={formatCurrency(borrowerInfo.month2Residual)}
                        onChange={(e) => handleCurrencyInput('month2Residual', e.target.value)}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Month 3</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        placeholder="4,600"
                        value={formatCurrency(borrowerInfo.month3Residual)}
                        onChange={(e) => handleCurrencyInput('month3Residual', e.target.value)}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
                {borrowerInfo.month1Residual && borrowerInfo.month2Residual && borrowerInfo.month3Residual && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-800">
                      <span className="font-medium">3-Month Average:</span>{' '}
                      ${((parseFloat(borrowerInfo.month1Residual) + parseFloat(borrowerInfo.month2Residual) + parseFloat(borrowerInfo.month3Residual)) / 3).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Credit Score *</label>
                <input
                  type="number"
                  placeholder="e.g., 720"
                  value={borrowerInfo.creditScore}
                  onChange={(e) => handleInputChange('creditScore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                {borrowerInfo.creditScore && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Max loan percentage: {getMaxLoanPercentage()}%
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Industry *</label>
                <select
                  value={borrowerInfo.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Years in Business *</label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 5"
                  value={borrowerInfo.yearsInBusiness}
                  onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm mb-3">Loan Terms</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Factor Rate *</label>
                    <select
                      value={borrowerInfo.factorRate}
                      onChange={(e) => handleInputChange('factorRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      <option value="1.15">1.15</option>
                      <option value="1.20">1.20</option>
                      <option value="1.25">1.25</option>
                      <option value="1.30">1.30</option>
                      <option value="1.35">1.35</option>
                      <option value="1.40">1.40</option>
                      <option value="1.45">1.45</option>
                      <option value="1.50">1.50</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Loan Percentage *</label>
                    <input
                      type="number"
                      placeholder="80"
                      value={borrowerInfo.loanPercentage}
                      onChange={(e) => handleInputChange('loanPercentage', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                        parseFloat(borrowerInfo.loanPercentage) > 80
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 mt-1">% of avg monthly residual</p>
                    {borrowerInfo.creditScore && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Max loan percentage: {getMaxLoanPercentage()}%
                      </p>
                    )}
                    {parseFloat(borrowerInfo.loanPercentage) > 80 && (
                      <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        High risk: Exceeds recommended 80% threshold
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Term Length *</label>
                      <input
                        type="number"
                        placeholder="12"
                        value={borrowerInfo.termLength}
                        onChange={(e) => handleInputChange('termLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Unit *</label>
                      <select
                        value={borrowerInfo.termUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value as 'months' | 'weeks';
                          const currentTermLength = parseFloat(borrowerInfo.termLength) || 0;
                          const currentUnit = borrowerInfo.termUnit || 'months';
                          let convertedTerm = currentTermLength;
                          
                          // Convert between units if needed
                          if (currentUnit === 'months' && newUnit === 'weeks') {
                            convertedTerm = Math.round(currentTermLength * 4.33);
                          } else if (currentUnit === 'weeks' && newUnit === 'months') {
                            convertedTerm = parseFloat((currentTermLength / 4.33).toFixed(1));
                          }
                          
                          setBorrowerInfo(prev => ({
                            ...prev,
                            termUnit: newUnit,
                            termLength: convertedTerm.toString()
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                      >
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Payment Schedule *</label>
                    <select
                      value={borrowerInfo.paymentSchedule}
                      onChange={(e) => handleInputChange('paymentSchedule', e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                    >
                      <option value="daily-ach">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="flat">Flat Payment Amount</option>
                      <option value="lump-sum">Lump Sum at End</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {borrowerInfo.paymentSchedule === 'lump-sum' ? 'Full payment at term end' : 
                       borrowerInfo.paymentSchedule === 'flat' ? 'Fixed payment amount per period' :
                       'All payments are % of sales'}
                    </p>
                  </div>

                  {borrowerInfo.paymentSchedule === 'flat' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Flat Payment Amount ($) *</label>
                        <input
                          type="number"
                          step="1"
                          placeholder="e.g., 2500"
                          value={borrowerInfo.flatPaymentAmount}
                          onChange={(e) => handleInputChange('flatPaymentAmount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fixed amount paid each period</p>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Payment Frequency *</label>
                        <select
                          value={borrowerInfo.paymentFrequency}
                          onChange={(e) => handleInputChange('paymentFrequency', e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="bi-monthly">Bi-Monthly (Every 2 Weeks)</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">How often payments are made</p>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Borrowing Cost (% per month) *</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="2"
                      value={borrowerInfo.borrowingCostPerMonth}
                      onChange={(e) => handleInputChange('borrowingCostPerMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Interest rate on borrowed capital</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Loan Date (Paperwork Signed)</label>
                      <input
                        type="date"
                        value={borrowerInfo.loanDate}
                        onChange={(e) => handleInputChange('loanDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={borrowerInfo.dueDate}
                        onChange={(e) => handleInputChange('dueDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="hasRep"
                    checked={borrowerInfo.hasRep}
                    onChange={(e) => handleInputChange('hasRep', e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="hasRep" className="text-sm text-gray-700">Deal brought in by rep</label>
                </div>

                {borrowerInfo.hasRep && (
                  <div className="space-y-4 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={borrowerInfo.repFirstName}
                          onChange={(e) => handleInputChange('repFirstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={borrowerInfo.repLastName}
                          onChange={(e) => handleInputChange('repLastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Commission Type *</label>
                      <select
                        value={borrowerInfo.repCommissionType}
                        onChange={(e) => handleInputChange('repCommissionType', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                      >
                        <option value="profit">% of Profit</option>
                        <option value="loan">% of Loan Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Commission Percentage *</label>
                      <input
                        type="number"
                        placeholder="5"
                        value={borrowerInfo.repCommissionPercentage}
                        onChange={(e) => handleInputChange('repCommissionPercentage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg transition-colors mt-6"
              >
                Analyze Deal with AI
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex gap-1">
            <button
              onClick={() => setActiveTab('mca')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                activeTab === 'mca'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">MCA Loan Analysis</span>
                <span className="sm:hidden">MCA</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('residual')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                activeTab === 'residual'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Residual Income</span>
                <span className="sm:hidden">Residual</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('lease')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                activeTab === 'lease'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Percent className="w-4 h-4" />
                <span className="hidden sm:inline">Lease Commission</span>
                <span className="sm:hidden">Lease</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex-1 py-3 px-4 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Summary</span>
                <span className="sm:hidden">Summary</span>
              </div>
            </button>
          </div>

          {/* MCA Tab Content */}
          {activeTab === 'mca' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">Loan Amount</span>
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                  <p className="text-lg sm:text-2xl text-emerald-600">${metrics.loanAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">Payback Amount</span>
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <p className="text-lg sm:text-2xl text-blue-600">${metrics.paybackAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">Net Profit</span>
                    <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                  </div>
                  <p className="text-lg sm:text-2xl text-purple-600">${metrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">APR</span>
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                  </div>
                  <p className="text-lg sm:text-2xl text-orange-600">{metrics.apr.toFixed(1)}%</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-xs sm:text-sm text-gray-600">Net Profit %</span>
                    <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                  </div>
                  <p className="text-lg sm:text-2xl text-indigo-600">{((metrics.netProfit / metrics.loanAmount) * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base sm:text-lg">Payment Schedule</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Schedule Type</p>
                <p className="text-base sm:text-xl truncate">{getPaymentScheduleLabel()}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  {borrowerInfo.paymentSchedule === 'flat' ? 'Flat Payment Amount' : 'Payment Amount (% of Sales)'}
                </p>
                <p className="text-base sm:text-xl text-emerald-600">
                  ${metrics.paymentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {borrowerInfo.paymentSchedule !== 'flat' && ` (${metrics.paymentPercentageOfSales.toFixed(1)}%)`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {borrowerInfo.paymentSchedule === 'flat' ? 'Fixed amount per payment' : 'Purchased Amount of Future Receivables'}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Payments</p>
                <p className="text-base sm:text-xl">{metrics.totalPayments}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Term Length</p>
                <p className="text-base sm:text-xl">{metrics.termLength} months</p>
              </div>
            </div>

            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs text-emerald-700">
                💡 View the detailed monthly cash flow schedule below for complete payment breakdown including our borrowing costs
              </p>
            </div>
              </div>

              {/* Origination Fee Info Box */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-900 mb-1">AI-Calculated Origination Fee (Income)</h4>
                    <p className="text-sm text-green-800 mb-2">
                      <span className="font-semibold">+${metrics.originationFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> ({metrics.originationFeePercentage}% of loan amount)
                    </p>
                    <p className="text-xs text-green-700">
                      This fee is income charged to the borrower. Calculated based on risk factors: {metrics.originationFeeReason}. 
                      Fee ranges from 1%-5% with a minimum of $500.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg mb-3 sm:mb-4">Monthly Cash Flow Analysis</h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Comprehensive view of:</p>
                    <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
                      <li>Merchant payments & principal reduction</li>
                      <li>Our 2% borrowing cost on outstanding balance</li>
                      <li>Monthly payback to lender</li>
                      <li>Net profit per month</li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={() => setShowCashFlowModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                    View Cash Flow Schedule
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg mb-3 sm:mb-4">Financial Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Monthly Residual</span>
                      <span>${metrics.avgMonthlyResidual.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Annual Residual</span>
                      <span>${metrics.annualResidual.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loan to Income Ratio</span>
                      <span>
                        {metrics.annualResidual > 0
                          ? ((metrics.loanAmount / metrics.annualResidual) * 100).toFixed(1)
                          : '0'}%
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">APR</span>
                      <span className="text-orange-600">{metrics.apr.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Gross Profit</span>
                      <span className="text-green-600">${metrics.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {borrowerInfo.hasRep && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">- Rep Commission</span>
                        <span className="text-red-600">-${metrics.repCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">- Cost of Money</span>
                      <div className="text-right">
                        <span className="text-red-600">-${metrics.totalInterestCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <p className="text-xs text-red-700 font-semibold">
                          ({metrics.effectiveCostOfMoneyPercentage.toFixed(2)}% effective rate)
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-gray-600">+ Origination Fee (Income)</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {metrics.originationFeePercentage}% AI-calculated
                            </span>
                          </div>
                        </div>
                        <span className="text-green-600">+${metrics.originationFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{metrics.originationFeeReason}</p>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-gray-900">Net Profit</span>
                      <span className="text-green-600">${metrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {riskAssessment && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h3>Risk Assessment Breakdown</h3>
                    </div>
                    <button
                      onClick={() => setShowRiskExplainers(!showRiskExplainers)}
                      className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      <Info className="w-4 h-4" />
                      {showRiskExplainers ? 'Hide' : 'Show'} Explanations
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(riskAssessment).map(([key, value]) => (
                      <div key={key} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-700">
                            {key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase())}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              value === 'High'
                                ? 'bg-red-100 text-red-700'
                                : value === 'Moderate'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {value}
                          </span>
                        </div>
                        {showRiskExplainers && (
                          <p className="text-sm text-gray-600 mt-2">
                            {getRiskExplanation(key, value)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recommendation && recommendation.decision === 'REVIEW' && (
                <div className="bg-yellow-50 rounded-xl border border-yellow-300 p-6">
                  <h3 className="mb-4 text-yellow-900">Recommended Adjusted Terms</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Original Factor Rate</p>
                      <p className="text-xl line-through text-gray-400">{borrowerInfo.factorRate}</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Adjusted: <span className="text-xl">{recommendation.adjustedFactorRate?.toFixed(2)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Original Loan %</p>
                      <p className="text-xl line-through text-gray-400">{borrowerInfo.loanPercentage}%</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Adjusted: <span className="text-xl">{recommendation.adjustedLoanPercentage?.toFixed(0)}%</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* MCA Payment Split Calculator */}
              <MCAPaymentSplitCalculator />
            </div>
          )}

          {/* Residual Income Tab Content */}
          {activeTab === 'residual' && (
            <div className="space-y-6">
              {/* Input Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-cyan-600 rounded-lg p-2">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Payment Processing Calculator</h3>
                    <p className="text-sm text-gray-600">Calculate monthly residual income from payment processing</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Pricing Program Selector */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Pricing Program *</label>
                    <select
                      value={borrowerInfo.pricingProgram}
                      onChange={(e) => handleInputChange('pricingProgram', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                    >
                      <option value="cash-discount">Cash Discount Program</option>
                      <option value="interchange-plus">Interchange+ Program</option>
                      <option value="flat-rate">Flat Rate Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Monthly Average Processing Volume *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <input
                        type="text"
                        placeholder="50,000"
                        value={formatCurrency(borrowerInfo.estimatedMonthlyProcessingVolume || (metrics.avgMonthlyResidual > 0 ? metrics.avgMonthlyResidual.toString() : ''))}
                        onChange={(e) => handleCurrencyInput('estimatedMonthlyProcessingVolume', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.avgMonthlyResidual > 0 && !borrowerInfo.estimatedMonthlyProcessingVolume
                        ? `Auto-populated from 3-month average: $${metrics.avgMonthlyResidual.toLocaleString()}`
                        : 'Total monthly card transaction volume'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        {borrowerInfo.pricingProgram === 'cash-discount' ? 'Cash Discount Rate (%)' : 
                         borrowerInfo.pricingProgram === 'interchange-plus' ? 'Markup Rate (%)' : 
                         'Flat Rate (%)'} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="3.5"
                        value={borrowerInfo.cashDiscountRate}
                        onChange={(e) => handleInputChange('cashDiscountRate', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {borrowerInfo.pricingProgram === 'cash-discount' ? 'Rate charged to customer' : 
                         borrowerInfo.pricingProgram === 'interchange-plus' ? 'Your markup above interchange' : 
                         'Total flat rate charged'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">
                        {borrowerInfo.pricingProgram === 'cash-discount' ? 'Card Processing Cost (%)' : 
                         borrowerInfo.pricingProgram === 'interchange-plus' ? 'Avg Interchange Cost (%)' : 
                         'Your Processing Cost (%)'} *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2.0"
                        value={borrowerInfo.cardProcessingCost}
                        onChange={(e) => handleInputChange('cardProcessingCost', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Your processing cost</p>
                    </div>
                  </div>

                  {borrowerInfo.estimatedMonthlyProcessingVolume && borrowerInfo.cashDiscountRate && borrowerInfo.cardProcessingCost && (
                    <div className="mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                      <p className="text-sm text-cyan-800">
                        <span className="font-semibold">Net Margin:</span> {metrics.netMargin.toFixed(2)}% 
                        <span className="text-cyan-600"> ({metrics.cashDiscountRate}% - {metrics.cardProcessingCost}%)</span>
                      </p>
                    </div>
                  )}

                  {/* Sales Rep Commission Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">Sales Rep Commission</label>
                      {borrowerInfo.hasRep && (borrowerInfo.repFirstName || borrowerInfo.repLastName) && (
                        <button
                          onClick={() => {
                            handleInputChange('residualRepFirstName', borrowerInfo.repFirstName);
                            handleInputChange('residualRepLastName', borrowerInfo.repLastName);
                          }}
                          className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md hover:bg-emerald-100 transition-colors border border-emerald-200"
                        >
                          Use MCA Rep: {borrowerInfo.repFirstName} {borrowerInfo.repLastName}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">First Name</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={borrowerInfo.residualRepFirstName}
                          onChange={(e) => handleInputChange('residualRepFirstName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Last Name</label>
                        <input
                          type="text"
                          placeholder="Last name"
                          value={borrowerInfo.residualRepLastName}
                          onChange={(e) => handleInputChange('residualRepLastName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Commission %</label>
                        <input
                          type="number"
                          step="1"
                          placeholder="25"
                          value={borrowerInfo.residualRepCommissionPercentage}
                          onChange={(e) => handleInputChange('residualRepCommissionPercentage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                    {(borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName) && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-xs text-orange-800">
                          <span className="font-semibold">{borrowerInfo.residualRepFirstName} {borrowerInfo.residualRepLastName}'s Commission:</span> {borrowerInfo.residualRepCommissionPercentage}% of monthly residual = ${metrics.residualRepCommissionMonthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {metrics.monthlyProcessingVolume > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-cyan-200 p-6">
                      <p className="text-sm text-gray-600 mb-2">Monthly Residual Income</p>
                      <p className="text-3xl font-bold text-cyan-600">
                        ${metrics.netMonthlyResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Per month recurring revenue</p>
                      {(borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName) && (
                        <p className="text-xs text-orange-600 mt-1">After {borrowerInfo.residualRepCommissionPercentage}% commission</p>
                      )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
                      <p className="text-sm text-gray-600 mb-2">Annual Income</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${metrics.annualResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Yearly revenue projection</p>
                      {(borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName) && (
                        <p className="text-xs text-orange-600 mt-1">After {borrowerInfo.residualRepCommissionPercentage}% commission</p>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6">
                      <p className="text-sm text-gray-600 mb-2">48-Month LTV</p>
                      <p className="text-3xl font-bold text-purple-600">
                        ${metrics.ltvResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Lease program lifetime value</p>
                      {(borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName) && (
                        <p className="text-xs text-orange-600 mt-1">After {borrowerInfo.residualRepCommissionPercentage}% commission</p>
                      )}
                    </div>
                  </div>

                  {/* Breakdown Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Revenue Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Monthly Processing Volume</span>
                        <span className="font-semibold text-gray-900">${metrics.monthlyProcessingVolume.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Cash Discount Rate</span>
                        <span className="font-semibold text-cyan-600">{metrics.cashDiscountRate}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600">Processing Cost</span>
                        <span className="font-semibold text-red-600">-{metrics.cardProcessingCost}%</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-semibold">Net Margin</span>
                        <span className="font-semibold text-green-600">{metrics.netMargin.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-cyan-50 -mx-6 px-6 rounded-lg">
                        <span className="font-semibold text-gray-900">Gross Monthly Residual</span>
                        <span className="text-2xl font-bold text-cyan-600">
                          ${metrics.monthlyResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      {(borrowerInfo.residualRepFirstName || borrowerInfo.residualRepLastName) && (
                        <div>
                          <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-gray-600">Sales Rep Commission ({borrowerInfo.residualRepCommissionPercentage}%)</span>
                            <span className="font-semibold text-orange-600">-${metrics.residualRepCommissionMonthly.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 bg-green-50 -mx-6 px-6 rounded-lg">
                            <span className="font-semibold text-gray-900">Net Monthly Residual</span>
                            <span className="text-2xl font-bold text-green-600">
                              ${metrics.netMonthlyResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Yearly Projection */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-6">
                    <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Projected Income Timeline
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/80 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">12 Months</p>
                        <p className="text-xl font-bold text-green-700">
                          ${metrics.annualResidualIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">24 Months</p>
                        <p className="text-xl font-bold text-green-700">
                          ${(metrics.annualResidualIncome * 2).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">36 Months</p>
                        <p className="text-xl font-bold text-green-700">
                          ${(metrics.annualResidualIncome * 3).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg p-4 border-2 border-purple-300">
                        <p className="text-xs text-purple-700 font-semibold mb-1">48 Months (Lease Term)</p>
                        <p className="text-xl font-bold text-purple-700">
                          ${(metrics.annualResidualIncome * 4).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-blue-900 mb-1">48-Month Lease Program</h5>
                        <p className="text-sm text-blue-800">
                          This merchant is being enrolled in a 48-month payment processing lease program. The residual income shown represents 
                          ongoing monthly revenue throughout the lease term, providing predictable recurring income alongside the MCA loan profits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!metrics.monthlyProcessingVolume && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Enter processing volume and rates above to see residual income projections</p>
                </div>
              )}
            </div>
          )}

          {/* Lease Commission Tab Content */}
          {activeTab === 'lease' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-purple-900 mb-1">Equipment Lease Commission Calculator</h5>
                    <p className="text-sm text-purple-800">
                      Calculate upfront commission on equipment lease based on credit factor rate and monthly subscription fee.
                    </p>
                  </div>
                </div>
              </div>

              {/* Equipment Input Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Equipment Details
                </h4>
                <div className="space-y-4">
                  {/* Credit Factor Rate Selector */}
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Credit Factor Rate *
                      <span className="ml-2 text-xs text-purple-600">
                        ({getLeaseFactorGrade(parseFloat(borrowerInfo.creditScore) || 0)})
                      </span>
                    </label>
                    <select
                      value={borrowerInfo.leaseFactorRate}
                      onChange={(e) => handleInputChange('leaseFactorRate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    >
                      <option value="0.027">P - Premium (0.027)</option>
                      <option value="0.028">A - Excellent (0.028)</option>
                      <option value="0.029">B - Good (0.029)</option>
                      <option value="0.0295">C - Average (0.0295)</option>
                      <option value="0.0425">D - Below Average (0.0425)</option>
                      <option value="0.0449">E - Poor (0.0449)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-selected based on credit score ({borrowerInfo.creditScore || '0'}), can be manually adjusted
                    </p>
                  </div>

                  {/* Equipment Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Number of Equipment *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={borrowerInfo.numberOfEquipment}
                        onChange={(e) => handleInputChange('numberOfEquipment', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Equipment Cost Per Unit *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="text"
                          placeholder="1,500"
                          value={formatCurrency(borrowerInfo.equipmentCost)}
                          onChange={(e) => handleCurrencyInput('equipmentCost', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Monthly Subscription Fee *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="text"
                          placeholder="129"
                          value={formatCurrency(borrowerInfo.monthlySubscriptionFee)}
                          onChange={(e) => handleCurrencyInput('monthlySubscriptionFee', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Fees */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Sales Rep Commission (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="25"
                        value={borrowerInfo.leaseSalesRepCommission}
                        onChange={(e) => handleInputChange('leaseSalesRepCommission', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: 25%</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Deployment Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input
                          type="text"
                          placeholder="300"
                          value={formatCurrency(borrowerInfo.leaseDeploymentFee)}
                          onChange={(e) => handleCurrencyInput('leaseDeploymentFee', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Default: $300</p>
                    </div>
                  </div>
                </div>
              </div>

              {(() => {
                const numberOfEquipment = parseFloat(borrowerInfo.numberOfEquipment) || 0;
                const equipmentCost = parseFloat(borrowerInfo.equipmentCost) || 0;
                const monthlySubscriptionFee = parseFloat(borrowerInfo.monthlySubscriptionFee) || 0;
                const leaseFactorRate = parseFloat(borrowerInfo.leaseFactorRate) || 0.0295;
                const salesRepCommissionPct = parseFloat(borrowerInfo.leaseSalesRepCommission) || 25;
                const deploymentFee = parseFloat(borrowerInfo.leaseDeploymentFee) || 300;
                
                const totalEquipmentCost = numberOfEquipment * equipmentCost;
                const totalMonthlySubscription = numberOfEquipment * monthlySubscriptionFee;
                // Lease commission formula: Monthly Subscription ÷ Factor Rate (represents 48-month lease value)
                const upfrontCommission = totalMonthlySubscription / leaseFactorRate;
                const salesRepCommission = upfrontCommission * (salesRepCommissionPct / 100);
                const netCommission = upfrontCommission - salesRepCommission + deploymentFee;
                
                return monthlySubscriptionFee > 0 ? (
                <div className="space-y-6">
                  {/* Commission Summary Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-300 p-8">
                    <div className="text-center mb-6">
                      <p className="text-sm text-gray-600 mb-2">Upfront Commission</p>
                      <p className="text-5xl font-bold text-purple-700">
                        ${upfrontCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-purple-600 mt-2">One-time payment at lease signing</p>
                    </div>

                    <div className="bg-white/80 rounded-lg p-4">
                      <p className="text-center text-xs text-gray-600 mb-3">Calculation Formula (48-Month Lease)</p>
                      <div className="text-center font-mono text-sm space-y-1">
                        <p className="text-gray-700">${monthlySubscriptionFee.toLocaleString()} × {numberOfEquipment} ÷ {leaseFactorRate}</p>
                        <p className="text-purple-700 font-semibold">= ${upfrontCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Equipment Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Equipment Details
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Number of Equipment</span>
                          <span className="font-semibold text-gray-900">{numberOfEquipment}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Cost Per Unit</span>
                          <span className="font-semibold text-gray-900">${equipmentCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Total Equipment Cost</span>
                          <span className="font-bold text-emerald-600">${totalEquipmentCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Monthly Subscription/Unit</span>
                          <span className="font-semibold text-blue-600">${monthlySubscriptionFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Total Monthly Subscription</span>
                          <span className="font-bold text-blue-600">${totalMonthlySubscription.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Commission Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        Commission Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Factor Rate ({getLeaseFactorGrade(parseFloat(borrowerInfo.creditScore) || 0)})</span>
                          <span className="font-semibold text-purple-600">{leaseFactorRate}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Gross Commission</span>
                          <span className="font-bold text-purple-600">${upfrontCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sales Rep ({salesRepCommissionPct}%)</span>
                          <span className="font-semibold text-red-600">-${salesRepCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Deployment Fee</span>
                          <span className="font-semibold text-green-600">+${deploymentFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t-2 border-purple-200 bg-purple-50 -mx-6 px-6 py-3 rounded">
                          <span className="font-bold text-gray-900">Net Company Profit</span>
                          <span className="text-xl font-bold text-purple-700">
                            ${netCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credit Factor Index Reference */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
                    <h4 className="font-semibold text-indigo-900 mb-4">Merchant Credit Factor Index</h4>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.027' ? 'bg-indigo-600 text-white border-2 border-indigo-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">P - Premium</p>
                        <p className="text-sm font-bold">0.027</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.028' ? 'bg-purple-600 text-white border-2 border-purple-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">A - Excellent</p>
                        <p className="text-sm font-bold">0.028</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.029' ? 'bg-blue-600 text-white border-2 border-blue-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">B - Good</p>
                        <p className="text-sm font-bold">0.029</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.0295' ? 'bg-cyan-600 text-white border-2 border-cyan-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">C - Average</p>
                        <p className="text-sm font-bold">0.0295</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.0425' ? 'bg-orange-600 text-white border-2 border-orange-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">D - Below Avg</p>
                        <p className="text-sm font-bold">0.0425</p>
                      </div>
                      <div className={`rounded-lg p-3 text-center ${borrowerInfo.leaseFactorRate === '0.0449' ? 'bg-red-600 text-white border-2 border-red-800' : 'bg-white/60'}`}>
                        <p className="text-xs font-semibold">E - Poor</p>
                        <p className="text-sm font-bold">0.0449</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-3 text-center">
                      Factor rate auto-selected based on credit score, can be adjusted manually
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
                  <Percent className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Enter equipment details above to calculate lease commission</p>
                </div>
              );
              })()}
            </div>
          )}

          {/* Summary Tab Content */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {(() => {
                const metrics = calculateMetrics();
                const monthlySubscriptionFee = parseFloat(borrowerInfo.monthlySubscriptionFee) || 0;
                const numberOfEquipment = parseFloat(borrowerInfo.numberOfEquipment) || 0;
                const leaseFactorRate = parseFloat(borrowerInfo.leaseFactorRate) || 0.0295;
                const salesRepCommissionPct = parseFloat(borrowerInfo.leaseSalesRepCommission) || 25;
                const deploymentFee = parseFloat(borrowerInfo.leaseDeploymentFee) || 300;
                
                const totalMonthlySubscription = numberOfEquipment * monthlySubscriptionFee;
                const leaseCommission = totalMonthlySubscription / leaseFactorRate;
                const salesRepCommission = leaseCommission * (salesRepCommissionPct / 100);
                const netLeaseProfit = leaseCommission - salesRepCommission + deploymentFee;
                
                // Calculate total upfront profit
                const totalUpfrontProfit = metrics.netProfit + netLeaseProfit;
                
                // Calculate monthly profit (from residual income)
                const monthlyResidualProfit = metrics.monthlyResidualIncome * 0.90; // Company keeps 90%
                
                // Calculate yearly profit
                const yearlyResidualProfit = metrics.annualResidualIncome * 0.90;
                
                // Calculate LTV (4-year residual value)
                const residualLTV = yearlyResidualProfit * 4;
                
                // Total merchant value
                const totalMerchantValue = totalUpfrontProfit + residualLTV;
                
                return (
                  <div className="space-y-6">
                    {/* Hero Summary Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
                      <h3 className="text-2xl font-bold mb-2">Total Merchant Value</h3>
                      <p className="text-6xl font-bold mb-4">
                        ${totalMerchantValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-indigo-200">Complete lifetime value including MCA, lease, and residual income (4 years)</p>
                    </div>

                    {/* Profit Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Upfront Profit</p>
                        <p className="text-3xl font-bold text-emerald-600 mb-2">
                          ${totalUpfrontProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex justify-between">
                            <span>MCA Net Profit:</span>
                            <span className="font-semibold">${metrics.netProfit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lease Commission:</span>
                            <span className="font-semibold">${netLeaseProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Monthly Profit</p>
                        <p className="text-3xl font-bold text-blue-600 mb-2">
                          ${monthlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Recurring monthly residual income (90% company share)
                        </p>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Yearly Profit</p>
                        <p className="text-3xl font-bold text-purple-600 mb-2">
                          ${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          Annual residual income projection
                        </p>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border-2 border-orange-200 p-6">
                        <p className="text-sm text-gray-600 mb-2">Residual LTV (4yr)</p>
                        <p className="text-3xl font-bold text-orange-600 mb-2">
                          ${residualLTV.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-gray-500">
                          4-year residual income lifetime value
                        </p>
                      </div>
                    </div>

                    {/* Detailed Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* MCA Deal Breakdown */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                          MCA Deal Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Loan Amount</span>
                            <span className="font-semibold">${metrics.loanAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payback Amount</span>
                            <span className="font-semibold">${metrics.paybackAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Profit</span>
                            <span className="font-semibold text-green-600">${metrics.grossProfit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Origination Fee</span>
                            <span className="font-semibold text-green-600">+${metrics.originationFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cost of Money</span>
                            <div className="text-right">
                              <span className="font-semibold text-red-600">-${metrics.totalInterestCost.toLocaleString()}</span>
                              <p className="text-xs text-red-700">({metrics.effectiveCostOfMoneyPercentage.toFixed(2)}%)</p>
                            </div>
                          </div>
                          {borrowerInfo.hasRep && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rep Commission</span>
                              <span className="font-semibold text-red-600">-${metrics.repCommission.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold">Net MCA Profit</span>
                            <span className="text-lg font-bold text-emerald-600">${metrics.netProfit.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Lease & Residual Summary */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                          Lease & Residual Summary
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Lease Commission</span>
                            <span className="font-semibold">${leaseCommission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Sales Rep Commission</span>
                            <span className="font-semibold text-red-600">-${salesRepCommission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Deployment Fee</span>
                            <span className="font-semibold text-green-600">+${deploymentFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pb-2 border-b border-gray-200">
                            <span className="font-semibold">Net Lease Profit</span>
                            <span className="font-bold text-purple-600">${netLeaseProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between pt-2">
                            <span className="text-gray-600">Monthly Residual</span>
                            <span className="font-semibold">${monthlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Yearly Residual</span>
                            <span className="font-semibold">${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="font-semibold">4-Year Residual LTV</span>
                            <span className="text-lg font-bold text-orange-600">${residualLTV.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Projection */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
                      <h4 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Revenue Timeline
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white/80 rounded-lg p-4 border-2 border-emerald-300">
                          <p className="text-xs text-gray-600 mb-1">Upfront (Month 0)</p>
                          <p className="text-xl font-bold text-emerald-700">
                            ${totalUpfrontProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Year 1</p>
                          <p className="text-xl font-bold text-indigo-700">
                            ${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Year 2</p>
                          <p className="text-xl font-bold text-indigo-700">
                            ${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Year 3</p>
                          <p className="text-xl font-bold text-indigo-700">
                            ${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-lg p-4">
                          <p className="text-xs text-gray-600 mb-1">Year 4</p>
                          <p className="text-xl font-bold text-indigo-700">
                            ${yearlyResidualProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Cash Flow Analysis Modal - Editable */}
      {showCashFlowModal && (() => {
        const metrics = calculateMetrics();
        const cashFlowSchedule = generateCashFlowSchedule();
        const editMetrics = isEditMode && editableCashFlow.length > 0 ? calculateEditableCashFlowMetrics() : null;
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCashFlowModal(false)}>
          <div className="bg-white rounded-xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ maxWidth: '1600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Monthly Cash Flow Analysis</h3>
                <p className="text-sm text-gray-600 mt-1">{borrowerInfo.dealName || 'MCA Deal'} - Complete Payment & Cost Breakdown</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={downloadCashFlowExcel}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel
                </button>
                <button onClick={() => setShowCashFlowModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (!isEditMode && editableCashFlow.length === 0) {
                        initializeEditableCashFlow();
                      }
                      setIsEditMode(!isEditMode);
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      isEditMode 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isEditMode ? '✓ Edit Mode Active' : '📝 Enable Manual Editing'}
                  </button>
                  {isEditMode && (
                    <span className="text-sm text-emerald-900 font-medium">💡 Adjust Payment, Principal, & Commission amounts</span>
                  )}
                </div>
                {isEditMode && editableCashFlow.length > 0 && (
                  <button
                    onClick={initializeEditableCashFlow}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-semibold transition-colors"
                  >
                    🔄 Reset to Defaults
                  </button>
                )}
              </div>

              {/* Summary Cards */}
              {!isEditMode ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
                  <p className="text-lg font-semibold text-emerald-600">${metrics.loanAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Payback Amount</p>
                  <p className="text-lg font-semibold text-blue-600">${metrics.paybackAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Term Length</p>
                  <p className="text-lg font-semibold text-purple-600">{metrics.termLength} months</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Total Cost of Money</p>
                  <p className="text-lg font-semibold text-red-600">${metrics.totalInterestCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-red-700 font-semibold mt-1">
                    {metrics.effectiveCostOfMoneyPercentage.toFixed(2)}% effective
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Borrowing Rate</p>
                  <p className="text-lg font-semibold text-orange-600">{(metrics.borrowingCostPerMonth * 100).toFixed(0)}%/mo</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {borrowerInfo.paymentType === 'interest-only' ? 'Interest Only' : 'Amortizing'}
                  </p>
                </div>
              </div>
              ) : editMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-400">
                    <p className="text-xs text-gray-600 mb-1">Total Payment Received</p>
                    <p className="text-lg font-semibold text-blue-600">${editMetrics.totalPaymentReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-400">
                    <p className="text-xs text-gray-600 mb-1">Total Principal Paydown</p>
                    <p className="text-lg font-semibold text-purple-600">${editMetrics.totalPrincipalPaydown.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border-2 border-orange-400">
                    <p className="text-xs text-gray-600 mb-1">Total Rep Commission</p>
                    <p className="text-lg font-semibold text-orange-600">${editMetrics.totalRepCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 border-2 border-red-400">
                    <p className="text-xs text-gray-600 mb-1">Total Borrowing Cost</p>
                    <p className="text-lg font-semibold text-red-600">${editMetrics.totalBorrowingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 border-2 border-emerald-400">
                    <p className="text-xs text-gray-600 mb-1">Total Net Profit</p>
                    <p className="text-lg font-semibold text-emerald-600">${editMetrics.totalNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}

              {!isEditMode && (
                <>
                  {/* Info Banners */}
              <div className="space-y-3 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>How This Works:</strong> Merchant pays {
                      borrowerInfo.paymentSchedule === 'flat' 
                        ? (borrowerInfo.paymentFrequency === 'bi-monthly' ? 'every 2 weeks' : borrowerInfo.paymentFrequency || 'weekly')
                        : borrowerInfo.paymentSchedule === 'daily-ach' || borrowerInfo.paymentSchedule === 'daily-processing' ? 'daily' 
                        : borrowerInfo.paymentSchedule === 'weekly' ? 'weekly' : 'monthly'
                    }, 
                    but we pay back our lender <strong>monthly</strong> to reduce the outstanding principal and minimize our {(metrics.borrowingCostPerMonth * 100).toFixed(0)}% monthly borrowing cost.
                  </p>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>💡 Effective Cost of Money:</strong> While our nominal rate is {(metrics.borrowingCostPerMonth * 100).toFixed(0)}%/month ({(metrics.borrowingCostPerMonth * 100 * metrics.termLength).toFixed(1)}% over {metrics.termLength} months), 
                    our <strong>actual cost is only {metrics.effectiveCostOfMoneyPercentage.toFixed(2)}%</strong> because we pay down principal monthly, reducing the outstanding balance and interest charges.
                    {borrowerInfo.paymentType === 'interest-only' && ' (Note: Interest-only loans pay full rate as principal stays constant)'}
                  </p>
                </div>
              </div>

              {/* Payback to Lender Adjustment */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="font-semibold text-gray-900">Monthly Payback to Lender: {paybackToLenderPercentage}%</label>
                  <span className="text-sm text-purple-700">
                    Adjust to change effective rate
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={paybackToLenderPercentage}
                  onChange={(e) => setPaybackToLenderPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>50% (Higher profit, slower paydown)</span>
                  <span>100% (Lower profit, faster paydown)</span>
                </div>
              </div>
                </>
              )}

              {/* Cash Flow Table - Dynamic */}
              {!isEditMode ? (
                <>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left">Month</th>
                      <th className="px-3 py-3 text-right">Merchant<br/>Payment</th>
                      <th className="px-3 py-3 text-right">Principal<br/>Reduction</th>
                      <th className="px-3 py-3 text-right">Factor<br/>Income</th>
                      <th className="px-3 py-3 text-right">Our<br/>Borrowing Cost</th>
                      <th className="px-3 py-3 text-right">Payback to<br/>Lender</th>
                      <th className="px-3 py-3 text-right">Remaining<br/>Balance</th>
                      <th className="px-3 py-3 text-right">Monthly<br/>Net Profit</th>
                      <th className="px-3 py-3 text-right">Cumulative<br/>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlowSchedule.slice(0, cashFlowRowsToShow).map((item) => (
                      <React.Fragment key={item.month}>
                        <tr className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-3 font-semibold">
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedMonths);
                                if (newExpanded.has(item.month)) {
                                  newExpanded.delete(item.month);
                                } else {
                                  newExpanded.add(item.month);
                                }
                                setExpandedMonths(newExpanded);
                              }}
                              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                            >
                              {expandedMonths.has(item.month) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              {item.monthName || `Month ${item.month}`}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-right text-blue-600">${item.merchantPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right text-emerald-600">${item.principalReduction.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right text-green-600">${item.factorIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right text-red-600">-${item.ourBorrowingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right text-purple-600">${item.principalPaybackToLender.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right font-semibold">${item.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right font-semibold text-emerald-700">${item.monthlyNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-800">${item.cumulativeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        
                        {/* Expandable Daily/Weekly Payment Breakdown */}
                        {expandedMonths.has(item.month) && item.payments && (
                          <tr className="bg-blue-50">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="bg-white rounded-lg border border-blue-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                                  {borrowerInfo.paymentSchedule === 'daily-ach' || borrowerInfo.paymentSchedule === 'daily-processing' 
                                    ? 'Daily Payment Breakdown' 
                                    : borrowerInfo.paymentSchedule === 'weekly'
                                    ? 'Weekly Payment Breakdown'
                                    : borrowerInfo.paymentSchedule === 'flat'
                                    ? (borrowerInfo.paymentFrequency === 'bi-monthly' ? 'Bi-Monthly Payment Breakdown' : borrowerInfo.paymentFrequency === 'monthly' ? 'Monthly Payment Breakdown' : 'Weekly Payment Breakdown')
                                    : 'Monthly Payment Breakdown'}
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-2 py-2 text-left">#</th>
                                        <th className="px-2 py-2 text-left">Date</th>
                                        <th className="px-2 py-2 text-right">Payment Amount</th>
                                        <th className="px-2 py-2 text-right">Principal Portion</th>
                                        <th className="px-2 py-2 text-right">Factor Portion</th>
                                        <th className="px-2 py-2 text-right">Remaining Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.payments.map((payment, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                          <td className="px-2 py-2">{payment.paymentNumber}</td>
                                          <td className="px-2 py-2">
                                            {payment.actualDate ? (
                                              <div>
                                                <div className="font-medium">{payment.actualDate}</div>
                                                <div className="text-xs text-gray-500">{payment.date}</div>
                                              </div>
                                            ) : (
                                              payment.date
                                            )}
                                          </td>
                                          <td className="px-2 py-2 text-right text-blue-600">${payment.amount.toFixed(2)}</td>
                                          <td className="px-2 py-2 text-right text-emerald-600">${payment.principalPortion.toFixed(2)}</td>
                                          <td className="px-2 py-2 text-right text-green-600">${payment.factorPortion.toFixed(2)}</td>
                                          <td className="px-2 py-2 text-right font-semibold">${payment.remainingBalance.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show More/Less Buttons */}
              {cashFlowSchedule.length > cashFlowRowsToShow && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setCashFlowRowsToShow(prev => Math.min(prev + 12, cashFlowSchedule.length))}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Show More ({cashFlowSchedule.length - cashFlowRowsToShow} remaining)
                  </button>
                </div>
              )}

              {cashFlowSchedule.length === cashFlowRowsToShow && cashFlowRowsToShow > 12 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setCashFlowRowsToShow(12)}
                    className="text-gray-600 hover:text-gray-700 font-semibold"
                  >
                    Show Less
                  </button>
                </div>
              )}
              </>
              ) : editMetrics && (
                <>
                  {/* Editable Manual Table */}
                  <div className="overflow-x-auto border-2 border-emerald-300 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-3 text-left font-bold">Month</th>
                          <th className="px-3 py-3 text-right font-bold">Payment<br/>Received ✏️</th>
                          <th className="px-3 py-3 text-right font-bold">Principal<br/>Paydown ✏️</th>
                          <th className="px-3 py-3 text-right font-bold">Rep<br/>Commission ✏️</th>
                          <th className="px-3 py-3 text-right font-bold">Our<br/>Borrowing Cost</th>
                          <th className="px-3 py-3 text-right font-bold">Factor<br/>Income</th>
                          <th className="px-3 py-3 text-right font-bold">Remaining<br/>Balance</th>
                          <th className="px-3 py-3 text-right font-bold">Monthly<br/>Net Profit</th>
                          <th className="px-3 py-3 text-right font-bold">Cumulative<br/>Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editMetrics.rows.map((row) => (
                          <tr key={row.month} className="border-t border-gray-100 hover:bg-blue-50/30">
                            <td className="px-3 py-3 font-semibold">{row.monthName}</td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={row.paymentReceived}
                                onChange={(e) => updateCashFlowRow(row.month, 'paymentReceived', parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-1 border-2 border-blue-400 rounded bg-blue-50 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 focus:outline-none font-semibold text-blue-700"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={row.principalPaydown}
                                onChange={(e) => updateCashFlowRow(row.month, 'principalPaydown', parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-1 border-2 border-purple-400 rounded bg-purple-50 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 focus:outline-none font-semibold text-purple-700"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-3">
                              <input
                                type="number"
                                value={row.repCommission}
                                onChange={(e) => updateCashFlowRow(row.month, 'repCommission', parseFloat(e.target.value) || 0)}
                                className="w-full text-right px-2 py-1 border-2 border-orange-400 rounded bg-orange-50 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 focus:outline-none font-semibold text-orange-700"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-3 text-right text-red-600 font-semibold">
                              -${row.ourBorrowingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-right text-green-600 font-semibold">
                              ${row.factorIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-right font-bold">
                              ${row.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-700">
                              ${row.monthlyNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-800">
                              ${row.cumulativeProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        );
      })()}

      {/* Deal Type Selection Modal */}
      <DealTypeSelectionModal
        isOpen={showDealTypeModal}
        onClose={() => setShowDealTypeModal(false)}
        selectedTypes={selectedDealTypes}
        onToggleType={handleToggleDealType}
        onConfirm={handleConfirmDealTypes}
      />
    </div>
  );
}