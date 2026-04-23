// DealDetails Component - Displays detailed view of a deal with edit capabilities
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  User, 
  Building2, 
  FileText, 
  Upload, 
  Download, 
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  BarChart3,
  AlertCircle,
  Percent,
  ChevronDown
} from 'lucide-react';
import { updateDeal } from '../utils/api';
import { ExportDealReport } from './ExportDealReport';

interface Deal {
  id: string;
  status: 'Funded' | 'Pending' | 'Declined';
  borrower: string;
  loanAmountReceived: number;
  repaymentAmountDue: number;
  grossInterest: number;
  loanDate?: string;
  dueDate?: string;
  payments?: Array<{ date: string; amount: number }>;
  monthlyPayments?: Array<{ month: string; amount: number }>;
  dailyDefaultRate: number;
  issuer: string;
  amountIssued: number;
  borrowTermMonths?: number;
  grossRevenue: number;
  costToIssuer: number;
  grossProfit: number;
  srCommission: number;
  netProfit: number;
  profitShares: Array<{ name: string; amount: number }>;
  dealType?: 'MCA' | 'Lease Commissions' | 'Residual Income';
  borrowerInfo?: any;
  metrics?: any;
  recommendation?: any;
  apr?: number;
  creditScore?: number;
  industry?: string;
  yearsInBusiness?: number;
  factorRate?: string;
  loanPercentage?: number;
  termLength?: number;
  termUnit?: 'months' | 'weeks';
  paymentSchedule?: string;
  fixedMonthlyPayment?: number;
  flatPaymentAmount?: number;
  paymentFrequency?: 'weekly' | 'bi-monthly' | 'monthly';
  dealBroughtByRep?: boolean;
  repCommissionType?: 'profit' | 'loan';
  repCommissionPercentage?: number;
  repCommissionAmount?: number;
  repFirstName?: string;
  repLastName?: string;
  files?: DealFile[];
  paymentHistory?: Payment[];
  issuerEntity?: 'Anshu Arora' | 'IPF Sourcing' | 'Nexridge Holdings';
  commissionPayouts?: Array<{
    id: string;
    date: string;
    recipient: string;
    amount: number;
    type: 'sales_rep' | 'profit_share' | 'issuer';
    note?: string;
  }>;
  // New fields from Analyze Deal section
  residualMonth1?: number;
  residualMonth2?: number;
  residualMonth3?: number;
  borrowingCostPerMonth?: number;
  originationFee?: number;
  originationFeePercentage?: number;
  originationFeeReason?: string;
  loanToIncomeRatio?: number;
  monthlyDeployment?: Array<{
    month: number;
    startingPrincipal: number;
    merchantPayment: number;
    principalReduction: number;
    factorIncome: number;
    ourBorrowingCost: number;
    principalPaybackToLender: number;
    remainingBalance: number;
    monthlyNetProfit: number;
    cumulativeProfit: number;
  }>;
  deltPayRetainedPercentage?: number;
  
  // Monthly Cash Flow Analysis overrides
  monthlyPaymentOverrides?: Record<string, number>;
  principalPaidOverrides?: Record<string, number>;
  repCommissionOverrides?: Record<string, number>;
  additionalMonths?: number;
  
  // Residual Income specific fields
  averageMonthlyVolume?: number;
  merchantStatements?: DealFile[];
  currentEquipmentDetails?: string;
  
  // Lease Commission specific fields
  equipmentName?: string;
  equipmentPrice?: number;
  equipmentQuote?: DealFile[];
  upfrontCommission?: number;
  monthlyCommissionAmount?: number;
}

// Industry list matching NewDealDrawer
const INDUSTRIES = [
  'Restaurants & Food Service',
  'Bars & Nightclubs',
  'Retail - Clothing & Apparel',
  'Retail - Electronics',
  'Retail - General Merchandise',
  'Healthcare - Medical Practice',
  'Healthcare - Dental',
  'Healthcare - Veterinary',
  'Professional Services - Legal',
  'Professional Services - Accounting',
  'Professional Services - Consulting',
  'Construction - General Contractor',
  'Construction - Specialty Trade',
  'Real Estate',
  'Automotive - Sales',
  'Automotive - Repair & Service',
  'Beauty & Personal Care - Salon',
  'Beauty & Personal Care - Spa',
  'Fitness & Wellness',
  'Hospitality - Hotels & Lodging',
  'Transportation & Logistics',
  'Manufacturing',
  'Wholesale & Distribution',
  'Technology & IT Services',
  'Marketing & Advertising',
  'Entertainment & Recreation',
  'Education & Training',
  'Home Services - Plumbing',
  'Home Services - HVAC',
  'Home Services - Electrical',
  'Home Services - Landscaping',
  'Cleaning Services',
  'E-commerce',
  'Insurance',
  'Financial Services',
  'Other'
];

// Factor rate options matching MCACalculator
const FACTOR_RATES = ['1.15', '1.20', '1.25', '1.30', '1.35', '1.40', '1.45', '1.50'];

interface DealFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedDate: string;
  category: string;
}

interface Payment {
  id: string;
  date: string;
  amount: number;
  method: string;
  note?: string;
  principalAmount?: number;
  factorRateAmount?: number;
}

interface DealDetailsProps {
  deal: Deal;
  onBack: () => void;
  onUpdate?: (updatedDeal: Deal) => void;
}

// Helper function to format date strings without timezone issues
const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString();
};

// Helper function to get month name from loan date and month offset
const getMonthName = (loanDate: string | undefined, monthOffset: number) => {
  if (!loanDate) return `Month ${monthOffset}`;
  
  const [year, month, day] = loanDate.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Add months to the start date
  const targetDate = new Date(startDate);
  targetDate.setMonth(targetDate.getMonth() + monthOffset - 1);
  
  return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Helper function to calculate actual monthly payments from payment history
const calculateActualMonthlyPayments = (paymentHistory: Payment[], loanDate: string | undefined, termLength: number) => {
  if (!loanDate || !paymentHistory || paymentHistory.length === 0) {
    return {};
  }
  
  const monthlyPayments: Record<number, number> = {};
  
  // Parse loan date
  const [year, month, day] = loanDate.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // For each payment, determine which month it belongs to
  paymentHistory.forEach(payment => {
    const [pYear, pMonth, pDay] = payment.date.split('-');
    const paymentDate = new Date(parseInt(pYear), parseInt(pMonth) - 1, parseInt(pDay));
    
    // Calculate month offset from loan date
    const monthsDiff = (paymentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (paymentDate.getMonth() - startDate.getMonth());
    
    // Month is 1-indexed (Month 1, Month 2, etc.)
    const monthNumber = monthsDiff + 1;
    
    // Only count payments within the loan term
    if (monthNumber >= 1 && monthNumber <= termLength) {
      monthlyPayments[monthNumber] = (monthlyPayments[monthNumber] || 0) + payment.amount;
    }
  });
  
  return monthlyPayments;
};

export function DealDetails({ deal, onBack, onUpdate }: DealDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingFinancial, setIsEditingFinancial] = useState(false);
  const [isDealInfoExpanded, setIsDealInfoExpanded] = useState(true);
  const [isFinancialBreakdownExpanded, setIsFinancialBreakdownExpanded] = useState(true);
  const [editedDeal, setEditedDeal] = useState(deal);
  const [files, setFiles] = useState<DealFile[]>(deal.files || []);
  const [payments, setPayments] = useState<Payment[]>(deal.paymentHistory || []);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ date: '', amount: '', method: 'ACH', note: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [showCostOfMoneyAnalysis, setShowCostOfMoneyAnalysis] = useState(false);
  const [cashFlowViewMode, setCashFlowViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [expandedCashFlowMonths, setExpandedCashFlowMonths] = useState<Set<number>>(new Set());
  const [progressTab, setProgressTab] = useState<'repayment' | 'commission' | 'distribution'>('repayment');
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editedPaymentData, setEditedPaymentData] = useState<{ date: string; amount: string; method: string; note: string }>({ date: '', amount: '', method: 'ACH', note: '' });
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [commissionPayouts, setCommissionPayouts] = useState<Array<{
    id: string;
    date: string;
    recipient: string;
    amount: number;
    type: 'sales_rep' | 'profit_share' | 'issuer';
    note?: string;
  }>>(deal.commissionPayouts || []);
  const [showAddCommissionPayout, setShowAddCommissionPayout] = useState(false);
  const [showDeleteCommissionModal, setShowDeleteCommissionModal] = useState(false);
  const [commissionToDelete, setCommissionToDelete] = useState<string | null>(null);
  const [newCommissionPayout, setNewCommissionPayout] = useState({
    date: '',
    recipient: '',
    amount: '',
    type: 'sales_rep' as 'sales_rep' | 'profit_share' | 'issuer',
    note: ''
  });
  
  // State for manual monthly payment overrides
  const [monthlyPaymentOverrides, setMonthlyPaymentOverrides] = useState<Record<string, number>>(deal.monthlyPaymentOverrides || {});
  const [principalPaidOverrides, setPrincipalPaidOverrides] = useState<Record<string, number>>(deal.principalPaidOverrides || {});
  const [repCommissionOverrides, setRepCommissionOverrides] = useState<Record<string, number>>(deal.repCommissionOverrides || {});
  const [isEditingMonthlyPayments, setIsEditingMonthlyPayments] = useState(false);
  const [additionalMonths, setAdditionalMonths] = useState<number>(deal.additionalMonths || 0);

  // Sync editedDeal state when deal prop changes
  useEffect(() => {
    console.log('🔄 DealDetails useEffect - Recalculating financials');
    console.log('Incoming deal:', deal.id, deal.borrower);
    console.log('Loan Amount:', deal.loanAmountReceived);
    console.log('Repayment Due:', deal.repaymentAmountDue);
    
    // Load overrides from deal
    setMonthlyPaymentOverrides(deal.monthlyPaymentOverrides || {});
    setPrincipalPaidOverrides(deal.principalPaidOverrides || {});
    setRepCommissionOverrides(deal.repCommissionOverrides || {});
    setAdditionalMonths(deal.additionalMonths || 0);
    
    // Calculate APR if missing
    let updatedDeal = { ...deal };
    let needsAutoSave = false;
    
    // Always calculate Gross Revenue and Gross Profit from Repayment Due and Loan Amount
    if (updatedDeal.loanAmountReceived && updatedDeal.repaymentAmountDue) {
      const correctGrossRevenue = updatedDeal.repaymentAmountDue;
      const correctGrossProfit = updatedDeal.repaymentAmountDue - updatedDeal.loanAmountReceived;
      const correctCostToIssuer = updatedDeal.loanAmountReceived;
      
      // Check if values are incorrect in database
      if (updatedDeal.grossRevenue !== correctGrossRevenue) {
        console.log('⚠️ Correcting Gross Revenue from', updatedDeal.grossRevenue, 'to', correctGrossRevenue);
        updatedDeal.grossRevenue = correctGrossRevenue;
        needsAutoSave = true;
      }
      if (updatedDeal.grossProfit !== correctGrossProfit) {
        console.log('⚠️ Correcting Gross Profit from', updatedDeal.grossProfit, 'to', correctGrossProfit);
        updatedDeal.grossProfit = correctGrossProfit;
        needsAutoSave = true;
      }
      if (updatedDeal.costToIssuer !== correctCostToIssuer) {
        console.log('⚠️ Correcting Cost to Issuer from', updatedDeal.costToIssuer, 'to', correctCostToIssuer);
        updatedDeal.costToIssuer = correctCostToIssuer;
        needsAutoSave = true;
      }
      
      console.log('✅ Calculated Gross Revenue:', updatedDeal.grossRevenue);
      console.log('✅ Calculated Gross Profit:', updatedDeal.grossProfit);
      console.log('✅ Cost to Issuer:', updatedDeal.costToIssuer);
    }
    
    // Auto-correct rep commission if it's wrong
    if (updatedDeal.dealBroughtByRep && updatedDeal.repCommissionPercentage && updatedDeal.repCommissionType) {
      const base = updatedDeal.repCommissionType === 'profit' 
        ? updatedDeal.grossProfit 
        : updatedDeal.loanAmountReceived;
      const correctCommissionAmount = (base * updatedDeal.repCommissionPercentage) / 100;
      
      // Check if commission is incorrect (allow for small floating point differences)
      if (Math.abs((updatedDeal.repCommissionAmount || 0) - correctCommissionAmount) > 0.01) {
        console.log('⚠️ Correcting Rep Commission from', updatedDeal.repCommissionAmount, 'to', correctCommissionAmount);
        console.log('  Type:', updatedDeal.repCommissionType);
        console.log('  Base:', base);
        console.log('  Percentage:', updatedDeal.repCommissionPercentage);
        updatedDeal.repCommissionAmount = correctCommissionAmount;
        needsAutoSave = true;
      }
    }
    
    if (!updatedDeal.apr && updatedDeal.loanAmountReceived && updatedDeal.repaymentAmountDue) {
      const termLength = updatedDeal.borrowTermMonths || updatedDeal.termLength || 9;
      const grossProfit = updatedDeal.repaymentAmountDue - updatedDeal.loanAmountReceived;
      const apr = updatedDeal.loanAmountReceived > 0 ? ((grossProfit / updatedDeal.loanAmountReceived) / (termLength / 12)) * 100 : 0;
      updatedDeal.apr = parseFloat(apr.toFixed(2));
    }
    
    // Normalize borrowingCostPerMonth to percentage format (2 for 2%)
    if (updatedDeal.borrowingCostPerMonth !== undefined) {
      const currentValue = updatedDeal.borrowingCostPerMonth;
      let normalizedValue = currentValue;
      
      // If less than 1, it's in decimal form (0.02), convert to percentage (2)
      if (currentValue < 1) {
        normalizedValue = currentValue * 100;
        console.log('⚠️ Correcting borrowingCostPerMonth from decimal', currentValue, 'to percentage', normalizedValue);
        needsAutoSave = true;
      }
      // If greater than 100, it's likely bad data (2000), divide by 100
      else if (currentValue > 100) {
        normalizedValue = currentValue / 100;
        console.log('⚠️ Correcting borrowingCostPerMonth from', currentValue, 'to', normalizedValue);
        needsAutoSave = true;
      }
      
      updatedDeal.borrowingCostPerMonth = normalizedValue;
    }
    
    setEditedDeal(updatedDeal);
    setFiles(deal.files || []);
    setPayments(deal.paymentHistory || []);
    
    // Auto-save corrected financial values to database if needed
    if (needsAutoSave && deal.id) {
      console.log('💾 Auto-saving corrected financial values to database...');
      updateDeal(deal.id, updatedDeal).then(result => {
        if (result.success) {
          console.log('✅ Financial values auto-corrected and saved');
          onUpdate?.(result.deal);
        } else {
          console.error('❌ Failed to auto-save corrections:', result.error);
        }
      });
    }
  }, [deal]);

  // Auto-recalculate commission when base values change
  useEffect(() => {
    if (editedDeal.dealBroughtByRep && editedDeal.repCommissionPercentage && editedDeal.repCommissionType) {
      const base = editedDeal.repCommissionType === 'profit' 
        ? editedDeal.grossProfit 
        : editedDeal.loanAmountReceived;
      const newCommissionAmount = (base * editedDeal.repCommissionPercentage) / 100;
      
      // Only update if the commission amount has actually changed
      if (Math.abs((editedDeal.repCommissionAmount || 0) - newCommissionAmount) > 0.01) {
        setEditedDeal(prev => ({
          ...prev,
          repCommissionAmount: newCommissionAmount
        }));
      }
    }
  }, [editedDeal.grossProfit, editedDeal.loanAmountReceived, editedDeal.repCommissionType, editedDeal.repCommissionPercentage, editedDeal.dealBroughtByRep]);

  // Auto-save monthly payment overrides whenever they change
  useEffect(() => {
    const saveOverrides = async () => {
      if (deal.id) {
        const updatedDeal = {
          ...deal,
          monthlyPaymentOverrides,
          principalPaidOverrides,
          repCommissionOverrides,
          additionalMonths
        };
        await updateDeal(deal.id, updatedDeal);
      }
    };
    
    // Debounce the save to avoid excessive updates
    const timeoutId = setTimeout(() => {
      saveOverrides();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [monthlyPaymentOverrides, principalPaidOverrides, repCommissionOverrides, additionalMonths, deal.id]);

  // Calculate repayment progress
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const repaymentProgress = deal.repaymentAmountDue > 0 ? (totalPaid / deal.repaymentAmountDue) * 100 : 0;
  const remainingBalance = (deal.repaymentAmountDue || 0) - totalPaid;

  // Calculate cost of money analysis
  const calculateCostOfMoneyAnalysis = (dealData = deal) => {
    const loanAmount = dealData.loanAmountReceived || 0;
    const termLengthRaw = dealData.borrowTermMonths || 6;
    const termUnit = dealData.termUnit || 'months';
    const repaymentAmount = dealData.repaymentAmountDue || 0;
    
    // Convert to months if the term is in weeks
    const termLengthInMonths = termUnit === 'weeks' ? termLengthRaw / 4.33 : termLengthRaw;
    
    // Calculate monthly payment we receive from merchant
    let monthlyPaymentFromMerchant;
    if (dealData.paymentSchedule === 'flat' && dealData.flatPaymentAmount) {
      // For flat payment schedules, use the flat payment amount
      const paymentsPerMonth = dealData.paymentFrequency === 'weekly' ? 4 : dealData.paymentFrequency === 'bi-monthly' ? 2 : 1;
      monthlyPaymentFromMerchant = dealData.flatPaymentAmount * paymentsPerMonth;
    } else {
      // For other schedules, calculate from repayment amount
      const paymentsPerMonth = dealData.paymentSchedule === 'Daily' ? 22 : dealData.paymentSchedule === 'Weekly' ? 4 : 1;
      const totalPayments = termLengthInMonths * paymentsPerMonth;
      const paymentAmount = repaymentAmount / totalPayments;
      monthlyPaymentFromMerchant = paymentAmount * paymentsPerMonth;
    }
    
    // Always use 2% per month (0.02 as decimal)
    const borrowingCostPerMonth = 0.02;
    
    // Calculate monthly rep commission
    const totalCommission = dealData.repCommissionAmount || 0;
    const monthlyCommission = totalCommission / termLengthInMonths;
    
    const monthlySchedule = [];
    let remainingPrincipal = loanAmount;
    let totalCost = 0;
    
    for (let month = 1; month <= Math.ceil(termLengthInMonths); month++) {
      const startingBalance = remainingPrincipal;
      
      // Principal gets paid FIRST from the merchant payment
      const principalReduction = Math.min(
        monthlyPaymentFromMerchant, // Can't pay more than what merchant pays
        remainingPrincipal // Can't pay more than what's remaining
      );
      
      // Calculate ending balance after principal reduction
      const endingBalance = remainingPrincipal - principalReduction;
      
      // Borrowing cost is 2% of the STARTING balance (before principal is paid)
      // BUT if ending balance is 0 or negative (loan paid off), borrowing cost should be $0
      const monthlyCost = endingBalance <= 0 ? 0 : startingBalance * borrowingCostPerMonth;
      
      totalCost += monthlyCost;
      
      // Update remaining principal for next iteration
      remainingPrincipal = endingBalance;
      
      monthlySchedule.push({
        month,
        startingBalance,
        principalReduction,
        borrowingCost: monthlyCost,
        endingBalance: remainingPrincipal,
        cumulativeCost: totalCost
      });
      
      if (remainingPrincipal <= 0) break;
    }
    
    const effectiveRate = loanAmount > 0 ? (totalCost / loanAmount) * 100 : 0;
    
    return {
      totalCost,
      effectiveRate,
      nominalRate: (dealData.borrowingCostPerMonth || 2),
      monthlySchedule,
      loanAmount,
      termLength: termLengthInMonths
    };
  };

  // Auto-calculate financial metrics when editing
  const handleEditChange = (field: string, value: any) => {
    const updated = { ...editedDeal, [field]: value };

    // Auto-calculate when loan amount or repayment amount changes
    if (field === 'loanAmountReceived' || field === 'repaymentAmountDue') {
      const loanAmount = field === 'loanAmountReceived' ? value : editedDeal.loanAmountReceived;
      const repaymentAmount = field === 'repaymentAmountDue' ? value : editedDeal.repaymentAmountDue;
      
      // Calculate gross profit
      const grossProfit = repaymentAmount - loanAmount;
      updated.grossProfit = grossProfit;
      updated.grossRevenue = repaymentAmount;
      updated.costToIssuer = loanAmount;
      
      // Calculate gross interest %
      const grossInterest = loanAmount > 0 ? ((grossProfit / loanAmount) * 100) : 0;
      updated.grossInterest = parseFloat(grossInterest.toFixed(2));
      
      // Calculate APR
      const termLength = editedDeal.borrowTermMonths || editedDeal.termLength || 6;
      const apr = loanAmount > 0 && termLength > 0 ? ((grossProfit / loanAmount) / (termLength / 12)) * 100 : 0;
      updated.apr = parseFloat(apr.toFixed(2));

      // Recalculate net profit (gross profit - commission)
      const srCommission = editedDeal.srCommission || 0;
      updated.netProfit = grossProfit - srCommission;
    }

    setEditedDeal(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Funded': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Declined': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Declined': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const [uploadCategory, setUploadCategory] = useState('Other');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFile: DealFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedDate: new Date().toISOString().split('T')[0],
        category: uploadCategory
      };
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      
      // Auto-save to deal
      const updatedDeal = { ...editedDeal, files: updatedFiles };
      setEditedDeal(updatedDeal);
      await updateDeal(deal.id, updatedDeal);
      
      // Reset upload category to default
      setUploadCategory('Other');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    setFileToDelete(null);
    
    // Auto-save to deal
    const updatedDeal = { ...editedDeal, files: updatedFiles };
    setEditedDeal(updatedDeal);
    await updateDeal(deal.id, updatedDeal);
  };

  const handleDeletePayment = async (paymentId: string) => {
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    setPayments(updatedPayments);
    setPaymentToDelete(null);
    
    // Auto-save to deal
    const updatedDeal = { ...editedDeal, paymentHistory: updatedPayments };
    setEditedDeal(updatedDeal);
    const result = await updateDeal(deal.id, updatedDeal);
    if (result.success && onUpdate) {
      onUpdate(result.deal);
    }
  };

  const handleDeleteCommissionPayout = async (payoutId: string) => {
    const updatedPayouts = commissionPayouts.filter(p => p.id !== payoutId);
    setCommissionPayouts(updatedPayouts);
    setCommissionToDelete(null);
    
    // Auto-save to deal
    const updatedDeal = { ...editedDeal, commissionPayouts: updatedPayouts };
    setEditedDeal(updatedDeal);
    try {
      await updateDeal(deal.id, updatedDeal);
      if (onUpdate) {
        onUpdate(updatedDeal);
      }
    } catch (error) {
      console.error('Error deleting commission payout:', error);
      alert('Failed to delete commission payout. Please try again.');
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.date || !newPayment.amount) {
      alert('Please fill in date and amount');
      return;
    }

    const payment: Payment = {
      id: Date.now().toString(),
      date: newPayment.date,
      amount: parseFloat(newPayment.amount),
      method: newPayment.method,
      note: newPayment.note || undefined
    };

    const updatedPayments = [...payments, payment].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setPayments(updatedPayments);
    setNewPayment({ date: '', amount: '', method: 'ACH', note: '' });
    setShowAddPayment(false);
    
    // Auto-save to deal
    const updatedDeal = { ...editedDeal, paymentHistory: updatedPayments };
    setEditedDeal(updatedDeal);
    const result = await updateDeal(deal.id, updatedDeal);
    if (result.success && onUpdate) {
      onUpdate(result.deal);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment.id);
    setEditedPaymentData({
      date: payment.date,
      amount: payment.amount.toString(),
      method: payment.method,
      note: payment.note || ''
    });
  };

  const handleSaveEditedPayment = async () => {
    if (!editedPaymentData.date || !editedPaymentData.amount) {
      alert('Please fill in date and amount');
      return;
    }

    const updatedPayments = payments.map(p => 
      p.id === editingPayment 
        ? {
            ...p,
            date: editedPaymentData.date,
            amount: parseFloat(editedPaymentData.amount),
            method: editedPaymentData.method,
            note: editedPaymentData.note || undefined
          }
        : p
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setPayments(updatedPayments);
    setEditingPayment(null);
    
    // Auto-save to deal
    const updatedDeal = { ...editedDeal, paymentHistory: updatedPayments };
    setEditedDeal(updatedDeal);
    const result = await updateDeal(deal.id, updatedDeal);
    if (result.success && onUpdate) {
      onUpdate(result.deal);
    }
  };

  const toggleMonthExpanded = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const handleSave = async () => {
    console.log('Saving deal with ID:', deal.id);
    console.log('Deal data being sent:', editedDeal);
    const result = await updateDeal(deal.id, editedDeal);
    console.log('Save result:', result);
    if (result.success && result.deal) {
      onUpdate?.(result.deal);
      setIsEditing(false);
    } else {
      console.error('Failed to save deal:', result.error);
      alert('Failed to save changes: ' + (result.error || 'Unknown error'));
    }
  };

  const handleSaveSection = async (section: 'overview' | 'info' | 'financial', setEditing: (val: boolean) => void) => {
    console.log('========== SAVE SECTION START ==========');
    console.log('Section:', section);
    console.log('Deal ID:', deal.id);
    console.log('Key fields being saved:');
    console.log('- dailyDefaultRate:', editedDeal.dailyDefaultRate);
    console.log('- residualMonth1:', editedDeal.residualMonth1);
    console.log('- residualMonth2:', editedDeal.residualMonth2);
    console.log('- residualMonth3:', editedDeal.residualMonth3);
    console.log('- borrowingCostPerMonth:', editedDeal.borrowingCostPerMonth);
    console.log('- apr:', editedDeal.apr);
    console.log('- factorRate:', editedDeal.factorRate);
    console.log('- originationFee:', editedDeal.originationFee);
    console.log('- grossRevenue:', editedDeal.grossRevenue);
    console.log('- grossProfit:', editedDeal.grossProfit);
    console.log('Edited deal data:', JSON.stringify(editedDeal, null, 2));
    
    if (!deal.id) {
      console.error('ERROR: No deal ID found!');
      alert('Error: Cannot save - deal ID is missing');
      return;
    }

    // Validate sales rep fields if commission is enabled
    if (section === 'financial' && editedDeal.dealBroughtByRep) {
      if (!editedDeal.repFirstName || !editedDeal.repLastName) {
        alert('Please enter the sales rep\'s first and last name');
        return;
      }
      if (!editedDeal.repCommissionType) {
        alert('Please select a commission type');
        return;
      }
      if (!editedDeal.repCommissionPercentage || editedDeal.repCommissionPercentage <= 0) {
        alert('Please enter a valid commission percentage');
        return;
      }
    }
    
    // Recalculate profit shares before saving
    if (section === 'financial') {
      const analysis = calculateCostOfMoneyAnalysis(editedDeal);
      const netProfit = (editedDeal.grossProfit || 0) - analysis.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
      const anshuShare = netProfit * 0.375;
      const patrickShare = netProfit * 0.375;
      
      editedDeal.profitShares = [
        { name: 'Anshu Arora', amount: anshuShare, percentage: 37.5 },
        { name: 'Patrick Lowenthal', amount: patrickShare, percentage: 37.5 }
      ];
      
      console.log('📊 Recalculated profit shares:');
      console.log('- Net Profit:', netProfit);
      console.log('- Anshu Arora:', anshuShare);
      console.log('- Patrick Lowenthal:', patrickShare);
    }
    
    const result = await updateDeal(deal.id, editedDeal);
    
    console.log('Save result:', JSON.stringify(result, null, 2));
    console.log('========== SAVE SECTION END ==========');
    
    if (result.success && result.deal) {
      console.log('✅ Save successful! Updating parent component...');
      // Update the editedDeal state with the saved data to prevent stale state
      setEditedDeal(result.deal);
      // Call parent update callback
      onUpdate?.(result.deal);
      // Close edit mode
      setEditing(false);
      // No alert - just save silently
    } else {
      console.error('❌ Save failed:', result.error);
      alert('Failed to save changes: ' + (result.error || 'Unknown error. Check console for details.'));
    }
  };

  const handleCancel = () => {
    setEditedDeal(deal);
    setIsEditing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // SVG circle progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (repaymentProgress / 100) * circumference;

  // Compute cost of money analysis data for modal
  const costOfMoneyData = React.useMemo(() => {
    if (!showCostOfMoneyAnalysis) return null;
    return calculateCostOfMoneyAnalysis();
  }, [showCostOfMoneyAnalysis, deal, editedDeal]);

  // Helper function to download Excel
  const downloadCostOfMoneyExcel = () => {
    if (!costOfMoneyData) return;
    const analysis = costOfMoneyData;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add header information
    csvContent += `Monthly Cash Flow Analysis\n`;
    csvContent += `${deal.borrower} - Complete Payment & Cost Breakdown\n\n`;
    csvContent += `Loan Amount,$${analysis.loanAmount.toLocaleString()}\n`;
    csvContent += `Term Length,${deal.termUnit === 'weeks' ? `${deal.borrowTermMonths || deal.termLength || 6} weeks` : `${analysis.termLength} months`}\n`;
    csvContent += `Borrowing Rate,2%/month\n`;
    csvContent += `Total Cost of Money,$${analysis.totalCost.toLocaleString()}\n`;
    csvContent += `Effective Rate,${analysis.effectiveRate.toFixed(2)}%\n\n`;
    
    // Add table header
    csvContent += "Month,Starting Balance,Payment Received,Principal Paid,Rep Commission,Gross Profit,Borrowing Cost,Ending Balance\n";
    
    // Calculate payment per month for all rows
    let monthlyPaymentReceived;
    
    if (deal.paymentSchedule === 'flat' && deal.flatPaymentAmount) {
      // For flat payment schedules, use the flat payment amount directly
      const paymentsPerMonth = deal.paymentFrequency === 'weekly' ? 4.33 : deal.paymentFrequency === 'bi-monthly' ? 2 : 1;
      monthlyPaymentReceived = deal.flatPaymentAmount * paymentsPerMonth;
    } else {
      // For other schedules, calculate from repayment amount
      const paymentsPerMonth = deal.paymentSchedule === 'Daily' ? 22 : deal.paymentSchedule === 'Weekly' ? 4 : 1;
      const totalPayments = analysis.termLength * paymentsPerMonth;
      const paymentAmount = (deal.repaymentAmountDue || 0) / totalPayments;
      monthlyPaymentReceived = paymentAmount * paymentsPerMonth;
    }
    
    const totalCommission = deal.repCommissionAmount || 0;
    const monthlyCommission = totalCommission / analysis.termLength;
    
    // Add table data
    analysis.monthlySchedule.forEach(row => {
      const grossProfit = monthlyPaymentReceived - row.principalReduction - monthlyCommission;
      csvContent += `${getMonthName(editedDeal.loanDate, row.month)},$${row.startingBalance.toFixed(2)},$${monthlyPaymentReceived.toFixed(2)},$${row.principalReduction.toFixed(2)},$${monthlyCommission.toFixed(2)},$${grossProfit.toFixed(2)},$${row.borrowingCost.toFixed(2)},$${row.endingBalance.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${deal.borrower}_Cost_of_Money_Analysis.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Sticky Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl">{deal.borrower}</h1>
                {deal.dealType && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {deal.dealType}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Deal ID: {deal.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportDealReport deal={deal} />
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${getStatusColor(deal.status)}`}>
              {getStatusIcon(deal.status)}
              {deal.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Left Column - Scrollable Deal Details */}
          <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg">Deal Overview</h2>
              {!isEditingOverview ? (
                <button
                  onClick={() => setIsEditingOverview(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSection('overview', setIsEditingOverview)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedDeal(deal);
                      setIsEditingOverview(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isEditingOverview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={editedDeal.loanAmountReceived?.toLocaleString() || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          const numValue = parseFloat(value) || 0;
                          const updated = { ...editedDeal, loanAmountReceived: numValue };
                          
                          // Calculate Gross Revenue and Gross Profit
                          if (editedDeal.repaymentAmountDue) {
                            updated.grossRevenue = editedDeal.repaymentAmountDue;
                            updated.grossProfit = editedDeal.repaymentAmountDue - numValue;
                            updated.costToIssuer = numValue;
                          }
                          
                          // Recalculate gross interest and factor rate
                          if (editedDeal.repaymentAmountDue && numValue > 0) {
                            const grossInterestPercent = ((editedDeal.repaymentAmountDue - numValue) / numValue) * 100;
                            updated.grossInterest = parseFloat(grossInterestPercent.toFixed(2));
                            updated.factorRate = (1 + (grossInterestPercent / 100)).toFixed(2);
                          }
                          
                          // Recalculate APR
                          const termLength = editedDeal.borrowTermMonths || editedDeal.termLength;
                          if (termLength && termLength > 0 && editedDeal.repaymentAmountDue) {
                            const grossProfit = editedDeal.repaymentAmountDue - numValue;
                            const apr = numValue > 0 ? ((grossProfit / numValue) / (termLength / 12)) * 100 : 0;
                            updated.apr = parseFloat(apr.toFixed(2));
                          }
                          
                          setEditedDeal(updated);
                        }}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Repayment Due</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={editedDeal.repaymentAmountDue?.toLocaleString() || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          const numValue = parseFloat(value) || 0;
                          const updated = { ...editedDeal, repaymentAmountDue: numValue };
                          
                          // Calculate Gross Revenue and Gross Profit
                          if (editedDeal.loanAmountReceived) {
                            updated.grossRevenue = numValue;
                            updated.grossProfit = numValue - editedDeal.loanAmountReceived;
                            updated.costToIssuer = editedDeal.loanAmountReceived;
                          }
                          
                          // Auto-calculate gross interest and factor rate
                          if (editedDeal.loanAmountReceived && editedDeal.loanAmountReceived > 0) {
                            const grossInterestPercent = ((numValue - editedDeal.loanAmountReceived) / editedDeal.loanAmountReceived) * 100;
                            updated.grossInterest = parseFloat(grossInterestPercent.toFixed(2));
                            updated.factorRate = (1 + (grossInterestPercent / 100)).toFixed(2);
                          }
                          
                          // Recalculate APR
                          const termLength = editedDeal.borrowTermMonths || editedDeal.termLength;
                          if (termLength && termLength > 0 && editedDeal.loanAmountReceived) {
                            const grossProfit = numValue - editedDeal.loanAmountReceived;
                            const apr = editedDeal.loanAmountReceived > 0 ? ((grossProfit / editedDeal.loanAmountReceived) / (termLength / 12)) * 100 : 0;
                            updated.apr = parseFloat(apr.toFixed(2));
                          }
                          
                          setEditedDeal(updated);
                        }}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gross Interest (%)</label>
                    <input
                      type="number"
                      value={editedDeal.grossInterest}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                      title="Auto-calculated from Repayment Due - Loan Amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Gross Profit</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={editedDeal.grossProfit?.toLocaleString() || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d]/g, '');
                          
                        }}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">APR (%)</label>
                    <input
                      type="number"
                      value={editedDeal.apr || 0}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none"
                      title="Auto-calculated based on term length"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Term Length</label>
                      <input
                        type="number"
                        value={editedDeal.borrowTermMonths || editedDeal.termLength || ''}
                        onChange={(e) => {
                          const termValue = e.target.value === '' ? '' : parseFloat(e.target.value);
                          const updated = { ...editedDeal, borrowTermMonths: termValue, termLength: termValue };
                          
                          // Recalculate APR if we have a valid term length
                          if (termValue && termValue > 0) {
                            const loanAmount = editedDeal.loanAmountReceived;
                            const repaymentAmount = editedDeal.repaymentAmountDue;
                            const grossProfit = repaymentAmount - loanAmount;
                            // Convert to months for APR calculation
                            const termUnit = editedDeal.termUnit || 'months';
                            const termInMonths = termUnit === 'weeks' ? termValue / 4.33 : termValue;
                            const apr = loanAmount > 0 ? ((grossProfit / loanAmount) / (termInMonths / 12)) * 100 : 0;
                            updated.apr = parseFloat(apr.toFixed(2));
                          }
                          
                          setEditedDeal(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Unit</label>
                      <select
                        value={editedDeal.termUnit || 'months'}
                        onChange={(e) => {
                          const newUnit = e.target.value as 'months' | 'weeks';
                          const currentTermLength = editedDeal.borrowTermMonths || editedDeal.termLength || 0;
                          const currentUnit = editedDeal.termUnit || 'months';
                          let convertedTerm = currentTermLength;
                          
                          // Convert between units if needed
                          if (currentUnit === 'months' && newUnit === 'weeks') {
                            // Convert months to weeks (1 month ≈ 4.33 weeks)
                            convertedTerm = Math.round(currentTermLength * 4.33);
                          } else if (currentUnit === 'weeks' && newUnit === 'months') {
                            // Convert weeks to months
                            convertedTerm = parseFloat((currentTermLength / 4.33).toFixed(1));
                          }
                          
                          const updated = { 
                            ...editedDeal, 
                            termUnit: newUnit,
                            termLength: convertedTerm,
                            borrowTermMonths: convertedTerm
                          };
                          
                          // Recalculate APR using the term in months
                          const termInMonths = newUnit === 'weeks' ? convertedTerm / 4.33 : convertedTerm;
                          if (convertedTerm && convertedTerm > 0) {
                            const loanAmount = editedDeal.loanAmountReceived;
                            const repaymentAmount = editedDeal.repaymentAmountDue;
                            const grossProfit = repaymentAmount - loanAmount;
                            const apr = loanAmount > 0 ? ((grossProfit / loanAmount) / (termInMonths / 12)) * 100 : 0;
                            updated.apr = parseFloat(apr.toFixed(2));
                          }
                          
                          setEditedDeal(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      >
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Credit Score</label>
                    <input
                      type="number"
                      value={editedDeal.creditScore || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, creditScore: parseFloat(e.target.value) })}
                      placeholder="e.g., 720"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Years in Business</label>
                    <input
                      type="number"
                      value={editedDeal.yearsInBusiness || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, yearsInBusiness: parseFloat(e.target.value) })}
                      placeholder="e.g., 5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Industry</label>
                    <select
                      value={editedDeal.industry || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, industry: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Factor Rate</label>
                    <select
                      value={editedDeal.factorRate || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, factorRate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">Select Factor Rate</option>
                      {FACTOR_RATES.map(rate => (
                        <option key={rate} value={rate}>{rate}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Payment Schedule</label>
                    <select
                      value={editedDeal.paymentSchedule || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, paymentSchedule: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    >
                      <option value="">Select Schedule</option>
                      <option value="daily-ach">Daily (% of Sales)</option>
                      <option value="weekly">Weekly (% of Sales)</option>
                      <option value="monthly">Monthly (% of Sales)</option>
                      <option value="flat">Flat Payment Amount</option>
                      <option value="lump-sum">Lump Sum at End (Full Payment at Term End)</option>
                    </select>
                  </div>
                </div>
                
                {/* Conditional Flat Payment Fields */}
                {editedDeal.paymentSchedule === 'flat' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Flat Payment Amount ($)</label>
                      <input
                        type="number"
                        value={editedDeal.flatPaymentAmount || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, flatPaymentAmount: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 2500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Payment Frequency</label>
                      <select
                        value={editedDeal.paymentFrequency || 'weekly'}
                        onChange={(e) => setEditedDeal({ ...editedDeal, paymentFrequency: e.target.value as 'weekly' | 'bi-monthly' | 'monthly' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="bi-monthly">Bi-Monthly (Every 2 Weeks)</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Loan Date (Paperwork Signed)</label>
                    <input
                      type="date"
                      value={editedDeal.loanDate || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, loanDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={editedDeal.dueDate || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>
                
                {/* Deal Type Field */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm text-gray-600 mb-1">Deal Type</label>
                  <select
                    value={editedDeal.dealType || ''}
                    onChange={(e) => setEditedDeal({ ...editedDeal, dealType: e.target.value as 'MCA' | 'Lease Commissions' | 'Residual Income' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select Deal Type</option>
                    <option value="MCA">MCA</option>
                    <option value="Lease Commissions">Lease Commissions</option>
                    <option value="Residual Income">Residual Income</option>
                  </select>
                </div>
                
                {/* Residual Income Specific Fields */}
                {editedDeal.dealType === 'Residual Income' && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <h3 className="text-md font-semibold text-gray-900">Residual Income Details</h3>
                    
                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-900">
                          <strong>Required Documents:</strong> Upload Merchant Statements, Bank Statements, MPA (Merchant Processing Agreement), Quote, and Voided Check in the Documents & Files section below.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Average Monthly Volume</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editedDeal.averageMonthlyVolume || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, averageMonthlyVolume: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 50000"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Current Equipment Details</label>
                      <textarea
                        value={editedDeal.currentEquipmentDetails || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, currentEquipmentDetails: e.target.value })}
                        placeholder="Describe the current equipment being used by the merchant..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                )}
                
                {/* Lease Commission Specific Fields */}
                {editedDeal.dealType === 'Lease Commissions' && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    <h3 className="text-md font-semibold text-gray-900">Lease Commission Details</h3>
                    
                    {/* Info Banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-900">
                          <strong>Required Documents:</strong> Upload Equipment Quote, Contract, and any relevant documentation in the Documents & Files section below.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Equipment Name</label>
                        <input
                          type="text"
                          value={editedDeal.equipmentName || ''}
                          onChange={(e) => setEditedDeal({ ...editedDeal, equipmentName: e.target.value })}
                          placeholder="e.g., POS System, Coffee Machine"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Equipment Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editedDeal.equipmentPrice || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, equipmentPrice: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 15000"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Upfront Commission</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editedDeal.upfrontCommission || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, upfrontCommission: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 2000"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Monthly Commission</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={editedDeal.monthlyCommissionAmount || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, monthlyCommissionAmount: parseFloat(e.target.value) || 0 })}
                            placeholder="e.g., 100"
                            className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                    <p className="text-xl text-gray-900">${(editedDeal.loanAmountReceived || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Repayment Due</p>
                    <p className="text-xl text-gray-900">${(editedDeal.repaymentAmountDue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Gross Interest</p>
                    <p className="text-xl text-emerald-700">{editedDeal.grossInterest || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Gross Profit</p>
                    <p className="text-xl text-emerald-700">${(editedDeal.grossProfit || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">APR</p>
                    <p className="text-xl text-orange-700">
                      {(() => {
                        const termLength = editedDeal.borrowTermMonths || editedDeal.termLength || 9;
                        const termUnit = editedDeal.termUnit || 'months';
                        if (!editedDeal.loanAmountReceived || !editedDeal.repaymentAmountDue || !termLength) return '0.00%';
                        const grossProfit = editedDeal.repaymentAmountDue - editedDeal.loanAmountReceived;
                        // Convert to months for APR calculation
                        const termInMonths = termUnit === 'weeks' ? termLength / 4.33 : termLength;
                        const apr = ((grossProfit / editedDeal.loanAmountReceived) / (termInMonths / 12)) * 100;
                        return apr.toFixed(2) + '%';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Term Length</p>
                    <p className="text-xl text-gray-900">
                      {editedDeal.borrowTermMonths || editedDeal.termLength || 6} {editedDeal.termUnit || 'months'}
                    </p>
                  </div>
                  {editedDeal.creditScore && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Credit Score</p>
                      <p className="text-xl text-gray-900">{editedDeal.creditScore}</p>
                    </div>
                  )}
                  {editedDeal.yearsInBusiness && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Years in Business</p>
                      <p className="text-xl text-gray-900">{editedDeal.yearsInBusiness} years</p>
                    </div>
                  )}
                </div>
                {(editedDeal.industry || editedDeal.factorRate || editedDeal.paymentSchedule) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    {editedDeal.industry && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Industry</p>
                        <p className="text-base text-gray-900">{editedDeal.industry}</p>
                      </div>
                    )}
                    {editedDeal.factorRate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Factor Rate</p>
                        <p className="text-base text-gray-900">{editedDeal.factorRate}</p>
                      </div>
                    )}
                    {editedDeal.paymentSchedule && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment Schedule</p>
                        <p className="text-base text-gray-900">
                          {editedDeal.paymentSchedule === 'daily-ach' ? 'Daily (% of Sales)' :
                           editedDeal.paymentSchedule === 'weekly' ? 'Weekly (% of Sales)' :
                           editedDeal.paymentSchedule === 'monthly' ? 'Monthly (% of Sales)' :
                           editedDeal.paymentSchedule === 'flat' ? 'Flat Payment Amount' :
                           editedDeal.paymentSchedule === 'lump-sum' ? 'Lump Sum at End (Full Payment at Term End)' :
                           editedDeal.paymentSchedule}
                        </p>
                        {editedDeal.paymentSchedule === 'flat' && editedDeal.flatPaymentAmount && (
                          <p className="text-sm text-emerald-700 font-semibold mt-1">
                            ${editedDeal.flatPaymentAmount.toLocaleString()} {editedDeal.paymentFrequency === 'bi-monthly' ? 'every 2 weeks' : editedDeal.paymentFrequency || 'weekly'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Dates Display */}
                {(editedDeal.loanDate || editedDeal.dueDate) && (
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    {editedDeal.loanDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Loan Date (Paperwork Signed)</p>
                        <p className="text-base text-gray-900">{new Date(editedDeal.loanDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {editedDeal.dueDate && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Due Date</p>
                        <p className="text-base text-gray-900">{new Date(editedDeal.dueDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Residual Income Details Display */}
                {editedDeal.dealType === 'Residual Income' && (editedDeal.averageMonthlyVolume || editedDeal.currentEquipmentDetails) && (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h3 className="text-md font-semibold text-gray-900">Residual Income Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editedDeal.averageMonthlyVolume && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Average Monthly Volume</p>
                          <p className="text-lg text-gray-900">${editedDeal.averageMonthlyVolume.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    {editedDeal.currentEquipmentDetails && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Current Equipment Details</p>
                        <p className="text-base text-gray-900">{editedDeal.currentEquipmentDetails}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Lease Commission Details Display */}
                {editedDeal.dealType === 'Lease Commissions' && (editedDeal.equipmentName || editedDeal.equipmentPrice || editedDeal.upfrontCommission || editedDeal.monthlyCommissionAmount) && (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h3 className="text-md font-semibold text-gray-900">Lease Commission Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {editedDeal.equipmentName && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Equipment Name</p>
                          <p className="text-base text-gray-900">{editedDeal.equipmentName}</p>
                        </div>
                      )}
                      {editedDeal.equipmentPrice && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Equipment Price</p>
                          <p className="text-lg text-gray-900">${editedDeal.equipmentPrice.toLocaleString()}</p>
                        </div>
                      )}
                      {editedDeal.upfrontCommission && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Upfront Commission</p>
                          <p className="text-lg text-emerald-700">${editedDeal.upfrontCommission.toLocaleString()}</p>
                        </div>
                      )}
                      {editedDeal.monthlyCommissionAmount && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Monthly Commission</p>
                          <p className="text-lg text-emerald-700">${editedDeal.monthlyCommissionAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Additional Deal Terms - Using whitespace */}
                {(editedDeal.loanPercentage || editedDeal.loanToIncomeRatio || editedDeal.originationFee) && (
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    {/* Additional Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editedDeal.loanPercentage && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Loan %</p>
                          <p className="text-lg text-purple-700">{deal.loanPercentage}%</p>
                        </div>
                      )}
                      {deal.loanToIncomeRatio !== undefined && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Loan/Income</p>
                          <p className="text-lg text-indigo-700">{(deal.loanToIncomeRatio * 100).toFixed(1)}%</p>
                        </div>
                      )}
                      {deal.originationFee && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Origination Fee</p>
                          <p className="text-lg text-emerald-700">+${deal.originationFee.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detailed Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsDealInfoExpanded(!isDealInfoExpanded)}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                <h2 className="text-lg">Deal Information</h2>
                <ChevronDown className={`w-5 h-5 transition-transform ${isDealInfoExpanded ? 'rotate-180' : ''}`} />
              </button>
              {!isEditingInfo ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCostOfMoneyAnalysis(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    View Details
                  </button>
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSection('info', setIsEditingInfo)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedDeal(deal);
                      setIsEditingInfo(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {isDealInfoExpanded && (
              <>
                {isEditingInfo ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Borrower</label>
                      <input
                        type="text"
                        value={editedDeal.borrower}
                        onChange={(e) => setEditedDeal({ ...editedDeal, borrower: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Issuer</label>
                      <input
                        type="text"
                        value={editedDeal.issuer}
                        onChange={(e) => setEditedDeal({ ...editedDeal, issuer: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Daily Default Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedDeal.dailyDefaultRate || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setEditedDeal({ ...editedDeal, dailyDefaultRate: val });
                        }}
                        placeholder="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Loan Date (Paperwork Signed)</label>
                      <input
                        type="date"
                        value={editedDeal.loanDate || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, loanDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={editedDeal.dueDate || ''}
                        onChange={(e) => setEditedDeal({ ...editedDeal, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Origination Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editedDeal.originationFee || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setEditedDeal({ ...editedDeal, originationFee: val });
                          }}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Financial Metrics */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Borrowing Cost Per Month</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={editedDeal.borrowingCostPerMonth !== undefined ? editedDeal.borrowingCostPerMonth : 2}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 2 : parseFloat(e.target.value);
                            setEditedDeal({ ...editedDeal, borrowingCostPerMonth: val });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Loan to Income Ratio</label>
                      <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500">
                        {(() => {
                          const threeMonthAvg = ((editedDeal.residualMonth1 || 0) + (editedDeal.residualMonth2 || 0) + (editedDeal.residualMonth3 || 0)) / 3;
                          if (threeMonthAvg === 0) return 'N/A';
                          const loanToIncomeRatio = (editedDeal.loanAmountReceived || 0) / threeMonthAvg;
                          return `${loanToIncomeRatio.toFixed(2)}x`;
                        })()}
                        <span className="text-xs ml-2">(Auto-calculated)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3-Month Residual History */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">3-Month Residual History *</label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month 1</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editedDeal.residualMonth1 || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setEditedDeal({ ...editedDeal, residualMonth1: val });
                          }}
                          placeholder="45,000"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month 2</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editedDeal.residualMonth2 || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setEditedDeal({ ...editedDeal, residualMonth2: val });
                          }}
                          placeholder="50,000"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Month 3</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={editedDeal.residualMonth3 || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            setEditedDeal({ ...editedDeal, residualMonth3: val });
                          }}
                          placeholder="50,000"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                    <span className="text-sm text-emerald-800">
                      <strong>3-Month Average:</strong> ${(((editedDeal.residualMonth1 || 0) + (editedDeal.residualMonth2 || 0) + (editedDeal.residualMonth3 || 0)) / 3).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Borrower</p>
                        <p className="text-base">{editedDeal.borrower}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Issuer</p>
                        <p className="text-base">{editedDeal.issuer}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Daily Default Rate</p>
                        <p className="text-base">{editedDeal.dailyDefaultRate !== undefined ? editedDeal.dailyDefaultRate : 0.5}%</p>
                      </div>
                    </div>
                    {editedDeal.loanDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Loan Date (Paperwork Signed)</p>
                          <p className="text-base">{new Date(editedDeal.loanDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {editedDeal.dueDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Due Date</p>
                          <p className="text-base">{new Date(editedDeal.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {editedDeal.originationFee !== undefined && editedDeal.originationFee > 0 && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Origination Fee</p>
                          <p className="text-base">${(editedDeal.originationFee || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Financial Metrics */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Borrowing Cost Per Month</p>
                        <p className="text-base">{(() => {
                          const value = editedDeal.borrowingCostPerMonth !== undefined ? editedDeal.borrowingCostPerMonth : 2;
                          // Normalize the value: if it's less than 1, it's in decimal form (0.02), multiply by 100
                          // If it's between 1-100, it's already a percentage (2)
                          // If it's greater than 100, it's likely bad data, divide by 100
                          if (value < 1) {
                            return `${(value * 100).toFixed(0)}%`;
                          } else if (value > 100) {
                            return `${(value / 100).toFixed(0)}%`;
                          } else {
                            return `${value}%`;
                          }
                        })()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Loan to Income Ratio</p>
                        <p className="text-base">
                          {(() => {
                            const threeMonthAvg = ((editedDeal.residualMonth1 || 0) + (editedDeal.residualMonth2 || 0) + (editedDeal.residualMonth3 || 0)) / 3;
                            if (threeMonthAvg === 0) return 'N/A';
                            const loanToIncomeRatio = (editedDeal.loanAmountReceived || 0) / threeMonthAvg;
                            return `${loanToIncomeRatio.toFixed(2)}x`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Cost of Money</p>
                        <p className="text-base">
                          {(() => {
                            const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                            return `$${analysis.totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Percent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Effective Rate</p>
                        <p className="text-base">
                          {(() => {
                            const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                            return `${analysis.effectiveRate.toFixed(2)}%`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 3-Month Residual History - View Mode */}
                {(editedDeal.residualMonth1 || editedDeal.residualMonth2 || editedDeal.residualMonth3) && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">3-Month Residual History</p>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 mb-1">Month 1</p>
                        <p className="text-base">${(editedDeal.residualMonth1 || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 mb-1">Month 2</p>
                        <p className="text-base">${(editedDeal.residualMonth2 || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-500 mb-1">Month 3</p>
                        <p className="text-base">${(editedDeal.residualMonth3 || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-emerald-800">
                        <strong>3-Month Average:</strong> ${(((editedDeal.residualMonth1 || 0) + (editedDeal.residualMonth2 || 0) + (editedDeal.residualMonth3 || 0)) / 3).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setIsFinancialBreakdownExpanded(!isFinancialBreakdownExpanded)}
                className="flex items-center gap-2 hover:text-blue-600 transition-colors"
              >
                <h2 className="text-lg">Financial Breakdown</h2>
                <ChevronDown className={`w-5 h-5 transition-transform ${isFinancialBreakdownExpanded ? 'rotate-180' : ''}`} />
              </button>
              {!isEditingFinancial ? (
                <button
                  onClick={() => setIsEditingFinancial(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSection('financial', setIsEditingFinancial)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedDeal(deal);
                      setIsEditingFinancial(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {isFinancialBreakdownExpanded && (
              <>
                {isEditingFinancial ? (
                  <div className="space-y-4">
                {/* Rep Commission Fields */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="dealBroughtByRep"
                      checked={editedDeal.dealBroughtByRep || false}
                      onChange={(e) => {
                        const updated = { ...editedDeal, dealBroughtByRep: e.target.checked };
                        if (!e.target.checked) {
                          updated.repCommissionType = undefined;
                          updated.repCommissionPercentage = undefined;
                          updated.repCommissionAmount = undefined;
                        }
                        setEditedDeal(updated);
                      }}
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="dealBroughtByRep" className="text-sm font-semibold text-gray-700">
                      Deal Brought by Rep?
                    </label>
                  </div>
                  
                  {editedDeal.dealBroughtByRep && (
                    <>
                      {/* Sales Rep Name Fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Rep First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editedDeal.repFirstName || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, repFirstName: e.target.value })}
                            placeholder="First name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Rep Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editedDeal.repLastName || ''}
                            onChange={(e) => setEditedDeal({ ...editedDeal, repLastName: e.target.value })}
                            placeholder="Last name"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Commission Type <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editedDeal.repCommissionType || ''}
                            onChange={(e) => {
                              const updated = { ...editedDeal, repCommissionType: e.target.value as 'profit' | 'loan' };
                              // Recalculate commission amount
                              if (editedDeal.repCommissionPercentage) {
                                const base = e.target.value === 'profit' ? editedDeal.grossProfit : editedDeal.loanAmountReceived;
                                updated.repCommissionAmount = (base * editedDeal.repCommissionPercentage) / 100;
                              }
                              setEditedDeal(updated);
                            }}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                          >
                            <option value="">Select Type</option>
                            <option value="profit">% of Profit</option>
                            <option value="loan">% of Loan Amount</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Commission % <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editedDeal.repCommissionPercentage || ''}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value) || 0;
                              const base = editedDeal.repCommissionType === 'profit' 
                                ? editedDeal.grossProfit 
                                : editedDeal.loanAmountReceived;
                              const commissionAmount = (base * percentage) / 100;
                              console.log('💰 Rep Commission Calculation:');
                              console.log('  Type:', editedDeal.repCommissionType);
                              console.log('  Base:', base);
                              console.log('  Percentage:', percentage);
                              console.log('  Amount:', commissionAmount);
                              const updated = {
                                ...editedDeal,
                                repCommissionPercentage: percentage,
                                repCommissionAmount: commissionAmount
                              };
                              setEditedDeal(updated);
                            }}
                            placeholder="e.g., 10"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Commission Amount (Auto-calculated)</label>
                        <input
                          type="text"
                          value={`$${(editedDeal.repCommissionAmount || 0).toLocaleString()}`}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed outline-none text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Financial summary in edit mode */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Gross Revenue</span>
                    <span className="font-semibold">${(editedDeal.grossRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Cost to Issuer (Loan Amount)</span>
                    <span className="font-semibold text-red-600">-${(editedDeal.loanAmountReceived || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Gross Profit</span>
                    <span className="font-semibold text-emerald-600">${(editedDeal.grossProfit || 0).toLocaleString()}</span>
                  </div>
                  {editedDeal.dealBroughtByRep && (
                    <div className="flex justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          Rep Commission
                          {editedDeal.repFirstName && editedDeal.repLastName && (
                            <span className="text-sm font-medium text-gray-700"> ({editedDeal.repFirstName} {editedDeal.repLastName})</span>
                          )}
                        </span>
                        {editedDeal.repCommissionPercentage && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {editedDeal.repCommissionPercentage}% of {editedDeal.repCommissionType === 'profit' ? 'Profit' : 'Loan'}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-red-600">-${(editedDeal.repCommissionAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-gray-600">Cost of Money</span>
                    <span className="font-semibold text-red-600">
                      {(() => {
                        const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                        return `-$${analysis.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </span>
                  </div>
                  {editedDeal.originationFee && editedDeal.originationFee > 0 && (
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">Origination Fee</span>
                      <span className="font-semibold text-emerald-600">+${(editedDeal.originationFee || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 bg-emerald-50 -mx-4 px-4 mt-2 rounded">
                    <span className="font-semibold">Net Profit</span>
                    <span className="font-semibold text-emerald-700">
                      {(() => {
                        const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                        const netProfit = (editedDeal.grossProfit || 0) - analysis.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
                        return `$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      })()}
                    </span>
                  </div>
                  
                  {/* Profit Distribution Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold mb-3 text-gray-700">Profit Distribution</h4>
                    <div className="space-y-2">
                      {(() => {
                        const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                        const netProfit = (editedDeal.grossProfit || 0) - analysis.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
                        const deltPayRetainedPercent = editedDeal.deltPayRetainedPercentage || 25;
                        const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                        const anshuShare = netProfit * (shareholderPercent / 100);
                        const patrickShare = netProfit * (shareholderPercent / 100);
                        const deltPayShare = netProfit * (deltPayRetainedPercent / 100);
                        
                        return (
                          <>
                            <div className="flex justify-between py-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Anshu Arora</span>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{shareholderPercent}%</span>
                              </div>
                              <span className="font-semibold text-purple-600">${anshuShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Patrick Lowenthal</span>
                                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{shareholderPercent}%</span>
                              </div>
                              <span className="font-semibold text-purple-600">${patrickShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Delt Pay Retained</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={deltPayRetainedPercent}
                                  onChange={(e) => {
                                    const newPercent = parseFloat(e.target.value) || 25;
                                    setEditedDeal({ ...editedDeal, deltPayRetainedPercentage: newPercent });
                                  }}
                                  className="w-16 px-2 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                                <span className="text-xs text-gray-500">%</span>
                                <span className="font-semibold text-gray-600">${deltPayShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
                ) : (
                  <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Gross Revenue</span>
                  <span className="font-semibold">${(editedDeal.grossRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Cost to Issuer (Loan Amount)</span>
                  <span className="font-semibold text-red-600">-${(editedDeal.loanAmountReceived || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Gross Profit</span>
                  <span className="font-semibold text-emerald-600">${(editedDeal.grossProfit || 0).toLocaleString()}</span>
                </div>
                {editedDeal.dealBroughtByRep && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        Rep Commission
                        {editedDeal.repFirstName && editedDeal.repLastName && (
                          <span className="text-sm font-medium text-gray-700"> ({editedDeal.repFirstName} {editedDeal.repLastName})</span>
                        )}
                      </span>
                      {editedDeal.repCommissionPercentage && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {editedDeal.repCommissionPercentage}% of {editedDeal.repCommissionType === 'profit' ? 'Profit' : 'Loan'}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-red-600">-${(editedDeal.repCommissionAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Cost of Money</span>
                  <span className="font-semibold text-red-600">
                    {(() => {
                      const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                      return `-$${analysis.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </span>
                </div>
                {editedDeal.originationFee && editedDeal.originationFee > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Origination Fee</span>
                    <span className="font-semibold text-emerald-600">+${(editedDeal.originationFee || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-emerald-50 -mx-6 px-6 mt-2">
                  <span className="font-semibold">Net Profit</span>
                  <span className="font-semibold text-emerald-700 text-lg">
                    {(() => {
                      const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                      const netProfit = (editedDeal.grossProfit || 0) - analysis.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
                      return `$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    })()}
                  </span>
                </div>
                
                {/* Profit Distribution Section */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700">Profit Distribution</h4>
                  <div className="space-y-2">
                    {(() => {
                      const analysis = calculateCostOfMoneyAnalysis(editedDeal);
                      const netProfit = (editedDeal.grossProfit || 0) - analysis.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
                      const deltPayRetainedPercent = editedDeal.deltPayRetainedPercentage || 25;
                      const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                      const anshuShare = netProfit * (shareholderPercent / 100);
                      const patrickShare = netProfit * (shareholderPercent / 100);
                      const deltPayShare = netProfit * (deltPayRetainedPercent / 100);
                      
                      return (
                        <>
                          <div className="flex justify-between py-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Anshu Arora</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{shareholderPercent}%</span>
                            </div>
                            <span className="font-semibold text-purple-600">${anshuShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                          <div className="flex justify-between py-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Patrick Lowenthal</span>
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{shareholderPercent}%</span>
                            </div>
                            <span className="font-semibold text-purple-600">${patrickShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                          <div className="flex justify-between py-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Delt Pay Retained</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{deltPayRetainedPercent}%</span>
                            </div>
                            <span className="font-semibold text-gray-600">${deltPayShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
                )}
              </>
            )}
          </div>

          {/* Files Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-lg mb-3">Documents & Files</h2>
              
              {/* Upload Controls */}
              <div className="flex items-center gap-3">
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                >
                  <option value="Voided Check">Voided Check</option>
                  <option value="MPA">MPA (Merchant Processing Agreement)</option>
                  <option value="Quote">Quote</option>
                  <option value="Bank Statements">Bank Statements</option>
                  <option value="Merchant Statements">Merchant Statements</option>
                  <option value="Equipment Quote">Equipment Quote</option>
                  <option value="Contract">Contract</option>
                  <option value="Other">Other</option>
                </select>
                <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer text-sm whitespace-nowrap">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No files uploaded yet</p>
              ) : (
                files.map(file => {
                  // Determine badge color based on category
                  const getCategoryColor = (category: string) => {
                    switch (category) {
                      case 'Voided Check': return 'bg-purple-100 text-purple-700';
                      case 'MPA': return 'bg-blue-100 text-blue-700';
                      case 'Quote': return 'bg-emerald-100 text-emerald-700';
                      case 'Bank Statements': return 'bg-orange-100 text-orange-700';
                      case 'Merchant Statements': return 'bg-pink-100 text-pink-700';
                      case 'Equipment Quote': return 'bg-indigo-100 text-indigo-700';
                      case 'Contract': return 'bg-red-100 text-red-700';
                      default: return 'bg-gray-100 text-gray-700';
                    }
                  };
                  
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(file.category)}`}>
                              {file.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setFileToDelete(file.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sticky Repayment Progress & Payments */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-6">
          {/* Repayment & Commission Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setProgressTab('repayment')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  progressTab === 'repayment'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Repayment Progress
              </button>
              <button
                onClick={() => setProgressTab('commission')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  progressTab === 'commission'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Commission Tracking
              </button>
              <button
                onClick={() => setProgressTab('distribution')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  progressTab === 'distribution'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Profit Distribution
              </button>

            </div>

            {/* Repayment Tab Content */}
            {progressTab === 'repayment' && (
              <div>
                {/* Progress Circles */}
                <div className="flex justify-center gap-8 mb-6">
                  {(() => {
                    // Calculate repayment progress
                    const radius = 60;
                    const circumference = 2 * Math.PI * radius;
                    const repaymentStrokeDashoffset = circumference - (repaymentProgress / 100) * circumference;
                    
                    // Calculate commission progress
                    const totalCommissionPaid = commissionPayouts.reduce((sum, p) => sum + p.amount, 0);
                    
                    // Calculate total commission due (Sales Rep + Anshu + Patrick, excluding Delt Pay Retention)
                    const analysis = calculateCostOfMoneyAnalysis();
                    const netProfit = (deal.grossProfit || 0) - analysis.totalCost - (deal.repCommissionAmount || 0) + (deal.originationFee || 0);
                    const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                    const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                    const anshuShare = netProfit * (shareholderPercent / 100);
                    const patrickShare = netProfit * (shareholderPercent / 100);
                    
                    // Total commission = Sales Rep + Anshu + Patrick (NOT including Delt Pay Retention)
                    const totalCommissionDue = (deal.repCommissionAmount || 0) + anshuShare + patrickShare;
                    const commissionProgress = totalCommissionDue > 0 ? (totalCommissionPaid / totalCommissionDue) * 100 : 0;
                    const commissionStrokeDashoffset = circumference - (commissionProgress / 100) * circumference;
                    
                    return (
                      <>
                        {/* Repayment Circle */}
                        <div className="flex flex-col items-center">
                          <div className="relative" style={{ width: 150, height: 150 }}>
                            <svg className="transform -rotate-90" width="150" height="150">
                              {/* Background circle */}
                              <circle cx="75" cy="75" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
                              
                              {/* Progress circle */}
                              <circle
                                cx="75"
                                cy="75"
                                r={radius}
                                stroke="#10b981"
                                strokeWidth="10"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={repaymentStrokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <p className="text-2xl font-bold text-gray-900">{repaymentProgress.toFixed(1)}%</p>
                              <p className="text-xs text-gray-500">Repaid</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Commission Circle */}
                        {deal.dealBroughtByRep && deal.repCommissionAmount && (
                          <div className="flex flex-col items-center">
                            <div className="relative" style={{ width: 150, height: 150 }}>
                              <svg className="transform -rotate-90" width="150" height="150">
                                {/* Background circle */}
                                <circle cx="75" cy="75" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
                                
                                {/* Progress circle */}
                                <circle
                                  cx="75"
                                  cy="75"
                                  r={radius}
                                  stroke="#3b82f6"
                                  strokeWidth="10"
                                  fill="none"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={commissionStrokeDashoffset}
                                  strokeLinecap="round"
                                  className="transition-all duration-500"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold text-gray-900">{commissionProgress.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">Commission</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              
                {/* Repayment Details */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-semibold text-emerald-700">${totalPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold text-orange-700">${remainingBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Total Due</span>
                    <span className="font-semibold">${deal.repaymentAmountDue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Commission Tracking Tab Content */}
            {progressTab === 'commission' && (
              <div>
                {/* Expected Profit Distribution */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-3">Expected Profit Distribution</h3>
                  <div className="space-y-2 text-sm">
                    {deal.dealBroughtByRep && deal.repCommissionAmount ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Sales Rep Commission
                          {deal.repFirstName && deal.repLastName && (
                            <span className="text-sm font-medium text-gray-700"> ({deal.repFirstName} {deal.repLastName})</span>
                          )}
                        </span>
                        <span className="font-semibold text-emerald-600">${deal.repCommissionAmount.toLocaleString()}</span>
                      </div>
                    ) : null}
                    {(() => {
                      const analysis = calculateCostOfMoneyAnalysis();
                      const netProfit = (deal.grossProfit || 0) - analysis.totalCost - (deal.repCommissionAmount || 0) + (deal.originationFee || 0);
                      const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                      const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                      const anshuShare = netProfit * (shareholderPercent / 100);
                      const patrickShare = netProfit * (shareholderPercent / 100);
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Anshu Arora</span>
                            <span className="font-semibold text-emerald-600">${anshuShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Patrick Lowenthal</span>
                            <span className="font-semibold text-emerald-600">${patrickShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Total Gross Profit</span>
                      <span className="font-semibold">${(deal.grossProfit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Add Commission Payout Button */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold">Commission Payouts</h3>
                  <button
                    onClick={() => setShowAddCommissionPayout(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Payout
                  </button>
                </div>

                {/* Commission Summary */}
                {deal.dealBroughtByRep && deal.repCommissionAmount && (() => {
                  const totalCommissionPaid = commissionPayouts.reduce((sum, p) => sum + p.amount, 0);
                  
                  // Calculate total commission due (Sales Rep + Anshu + Patrick)
                  const analysis = calculateCostOfMoneyAnalysis();
                  const netProfit = (deal.grossProfit || 0) - analysis.totalCost - (deal.repCommissionAmount || 0) + (deal.originationFee || 0);
                  const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                  const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                  const anshuShare = netProfit * (shareholderPercent / 100);
                  const patrickShare = netProfit * (shareholderPercent / 100);
                  const totalCommissionDue = (deal.repCommissionAmount || 0) + anshuShare + patrickShare;
                  const remainingCommission = totalCommissionDue - totalCommissionPaid;
                  
                  return (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Paid</span>
                          <span className="font-semibold text-blue-700">${totalCommissionPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Remaining</span>
                          <span className="font-semibold text-orange-700">${remainingCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="text-gray-600">Total Commission Due</span>
                          <span className="font-semibold">${totalCommissionDue.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>
                        <p className="text-xs text-gray-500 pt-1 italic">
                          Includes: Sales Rep + Anshu Arora + Patrick Lowenthal
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Commission Payouts List */}
                <div className="space-y-2 mb-6">
                  {commissionPayouts.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No commission payouts recorded yet</p>
                  ) : (
                    commissionPayouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{payout.recipient}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              payout.type === 'sales_rep' ? 'bg-blue-100 text-blue-700' :
                              payout.type === 'profit_share' ? 'bg-purple-100 text-purple-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {payout.type === 'sales_rep' ? 'Sales Rep' : 
                               payout.type === 'profit_share' ? 'Profit Share' : 
                               'Issuer'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{new Date(payout.date).toLocaleDateString()}</p>
                          {payout.note && <p className="text-xs text-gray-500 mt-1">{payout.note}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-semibold text-emerald-600">${payout.amount.toLocaleString()}</p>
                          <button
                            onClick={() => {
                              setCommissionToDelete(payout.id);
                              setShowDeleteCommissionModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                            title="Delete payout"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Paid Out</span>
                    <span className="font-semibold text-emerald-700">
                      ${commissionPayouts.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining to Distribute</span>
                    <span className="font-semibold text-orange-700">
                      ${Math.max(0, (deal.grossProfit || 0) - commissionPayouts.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Add Commission Payout Form */}
                {showAddCommissionPayout && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Record Commission Payout</h3>
                        <button
                          onClick={() => {
                            setShowAddCommissionPayout(false);
                            setNewCommissionPayout({ date: '', recipient: '', amount: '', type: 'sales_rep', note: '' });
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={newCommissionPayout.date}
                            onChange={(e) => setNewCommissionPayout({ ...newCommissionPayout, date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payout Type</label>
                          <select
                            value={newCommissionPayout.type}
                            onChange={(e) => {
                              const type = e.target.value as 'sales_rep' | 'profit_share' | 'issuer';
                              let recipient = '';
                              let amount = '';
                              
                              // Auto-fill recipient and amount based on type
                              const firstPayment = payments.length > 0 ? payments[payments.length - 1] : null;
                              const paymentAmount = firstPayment ? firstPayment.amount : 0;
                              const totalDue = deal.repaymentAmountDue || 1;
                              const paymentPercentage = paymentAmount / totalDue;
                              
                              if (type === 'sales_rep') {
                                recipient = deal.repFirstName && deal.repLastName 
                                  ? `${deal.repFirstName} ${deal.repLastName}`
                                  : '';
                                const totalCommission = deal.repCommissionAmount || 0;
                                amount = (totalCommission * paymentPercentage).toFixed(2);
                              } else if (type === 'profit_share') {
                                recipient = 'Anshu Arora';
                                const analysis = calculateCostOfMoneyAnalysis();
                                const netProfit = (deal.grossProfit || 0) - analysis.totalCost - (deal.repCommissionAmount || 0) + (deal.originationFee || 0);
                                const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                                const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                                const totalShare = netProfit * (shareholderPercent / 100);
                                amount = (totalShare * paymentPercentage).toFixed(2);
                              } else if (type === 'issuer') {
                                recipient = deal.issuerEntity || 'Anshu Arora';
                                // Issuer distribution would be based on their share
                                amount = '0.00';
                              }
                              
                              setNewCommissionPayout({ ...newCommissionPayout, type, recipient, amount });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="sales_rep">Sales Rep Commission</option>
                            <option value="profit_share">Profit Share</option>
                            <option value="issuer">Issuer Distribution</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                          {newCommissionPayout.type === 'issuer' ? (
                            <select
                              value={newCommissionPayout.recipient}
                              onChange={(e) => setNewCommissionPayout({ ...newCommissionPayout, recipient: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="">Select Issuer</option>
                              <option value="Anshu Arora">Anshu Arora</option>
                              <option value="IPF Sourcing">IPF Sourcing</option>
                              <option value="Nexridge Holdings">Nexridge Holdings</option>
                            </select>
                          ) : newCommissionPayout.type === 'profit_share' ? (
                            <select
                              value={newCommissionPayout.recipient}
                              onChange={(e) => {
                                const recipient = e.target.value;
                                // Recalculate amount when recipient changes
                                const firstPayment = payments.length > 0 ? payments[payments.length - 1] : null;
                                const paymentAmount = firstPayment ? firstPayment.amount : 0;
                                const totalDue = deal.repaymentAmountDue || 1;
                                const paymentPercentage = paymentAmount / totalDue;
                                
                                const analysis = calculateCostOfMoneyAnalysis();
                                const netProfit = (deal.grossProfit || 0) - analysis.totalCost - (deal.repCommissionAmount || 0) + (deal.originationFee || 0);
                                const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                                const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                                const totalShare = netProfit * (shareholderPercent / 100);
                                const amount = (totalShare * paymentPercentage).toFixed(2);
                                
                                setNewCommissionPayout({ ...newCommissionPayout, recipient, amount });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                              <option value="">Select Shareholder</option>
                              <option value="Anshu Arora">Anshu Arora</option>
                              <option value="Patrick Lowenthal">Patrick Lowenthal</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={newCommissionPayout.recipient}
                              onChange={(e) => setNewCommissionPayout({ ...newCommissionPayout, recipient: e.target.value })}
                              placeholder="Enter recipient name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <input
                            type="number"
                            value={newCommissionPayout.amount}
                            onChange={(e) => setNewCommissionPayout({ ...newCommissionPayout, amount: e.target.value })}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                          <textarea
                            value={newCommissionPayout.note}
                            onChange={(e) => setNewCommissionPayout({ ...newCommissionPayout, note: e.target.value })}
                            placeholder="Add any notes..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={async () => {
                              if (newCommissionPayout.date && newCommissionPayout.recipient && newCommissionPayout.amount) {
                                const payout = {
                                  id: Date.now().toString(),
                                  date: newCommissionPayout.date,
                                  recipient: newCommissionPayout.recipient,
                                  amount: parseFloat(newCommissionPayout.amount),
                                  type: newCommissionPayout.type,
                                  note: newCommissionPayout.note
                                };
                                const updatedPayouts = [...commissionPayouts, payout];
                                setCommissionPayouts(updatedPayouts);
                                
                                // Update deal with new commission payouts
                                const updatedDeal = { ...deal, commissionPayouts: updatedPayouts };
                                try {
                                  await updateDeal(deal.id, updatedDeal);
                                  if (onUpdate) {
                                    onUpdate(updatedDeal);
                                  }
                                  setShowAddCommissionPayout(false);
                                  setNewCommissionPayout({ date: '', recipient: '', amount: '', type: 'sales_rep', note: '' });
                                } catch (error) {
                                  console.error('Error updating commission payout:', error);
                                  alert('Failed to save commission payout. Please try again.');
                                }
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                          >
                            Add Payout
                          </button>
                          <button
                            onClick={() => {
                              setShowAddCommissionPayout(false);
                              setNewCommissionPayout({ date: '', recipient: '', amount: '', type: 'sales_rep', note: '' });
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profit Distribution Tab Content */}
            {progressTab === 'distribution' && (
              <div>
                {(() => {
                  // Calculate profit distribution based on actual payments
                  const totalPaidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
                  const totalDue = deal.repaymentAmountDue || 1;
                  const paymentPercentage = totalPaidSoFar / totalDue;
                  
                  // Calculate expected distributions based on payment progress
                  const analysis = calculateCostOfMoneyAnalysis();
                  const totalGrossProfit = deal.grossProfit || 0;
                  const totalRepCommission = deal.repCommissionAmount || 0;
                  const totalOriginationFee = deal.originationFee || 0;
                  const totalNetProfit = totalGrossProfit - analysis.totalCost - totalRepCommission + totalOriginationFee;
                  
                  // Calculate actual collected so far (proportional to payment progress)
                  const grossProfitCollected = totalGrossProfit * paymentPercentage;
                  const repCommissionEarned = totalRepCommission * paymentPercentage;
                  const borrowingCostIncurred = analysis.totalCost * paymentPercentage;
                  const netProfitCollected = grossProfitCollected - borrowingCostIncurred - repCommissionEarned + (totalOriginationFee * paymentPercentage);
                  
                  // Calculate distribution using adjustable percentages
                  const deltPayRetainedPercent = deal.deltPayRetainedPercentage || 25;
                  const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                  const anshuShare = netProfitCollected * (shareholderPercent / 100);
                  const patrickShare = netProfitCollected * (shareholderPercent / 100);
                  const deltPayShare = netProfitCollected * (deltPayRetainedPercent / 100);

                  return (
                    <div className="space-y-6">
                      {/* Overview Card */}
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-900">Real-Time Profit Distribution</h3>
                          <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Gross Profit Collected</p>
                            <p className="text-2xl font-bold text-emerald-700">${Math.floor(grossProfitCollected).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Net Profit After Costs</p>
                            <p className="text-2xl font-bold text-emerald-600">${Math.floor(netProfitCollected).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sales Rep Commission */}
                      {deal.dealBroughtByRep && deal.repCommissionAmount && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-orange-600" />
                              <span className="font-semibold text-gray-900">
                                {deal.repFirstName && deal.repLastName 
                                  ? `${deal.repFirstName} ${deal.repLastName}` 
                                  : 'Sales Rep'}
                              </span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-orange-200 text-orange-800 rounded-full">
                              Sales Commission
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-600">Earned from payments collected</p>
                            <p className="text-xl font-bold text-orange-700">${Math.floor(repCommissionEarned).toLocaleString()}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-orange-200">
                            <p className="text-xs text-gray-600">
                              ${totalRepCommission.toLocaleString()} total × {(paymentPercentage * 100).toFixed(1)}% collected
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Anshu Arora */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">Anshu Arora</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-blue-200 text-blue-800 rounded-full">
                            {shareholderPercent}% of Net Profit
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600">Share of net profit collected</p>
                          <p className="text-xl font-bold text-blue-700">${Math.floor(anshuShare).toLocaleString()}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-gray-600">
                            ${Math.floor(netProfitCollected).toLocaleString()} × {shareholderPercent}%
                          </p>
                        </div>
                      </div>

                      {/* Patrick Lowenthal */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-gray-900">Patrick Lowenthal</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-purple-200 text-purple-800 rounded-full">
                            {shareholderPercent}% of Net Profit
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600">Share of net profit collected</p>
                          <p className="text-xl font-bold text-purple-700">${Math.floor(patrickShare).toLocaleString()}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-xs text-gray-600">
                            ${Math.floor(netProfitCollected).toLocaleString()} × {shareholderPercent}%
                          </p>
                        </div>
                      </div>

                      {/* Delt Pay Retained */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-gray-900">Delt Pay</span>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                            {deltPayRetainedPercent}% of Net Profit
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600">Company retained share</p>
                          <p className="text-xl font-bold text-emerald-700">${Math.floor(deltPayShare).toLocaleString()}</p>
                        </div>
                        <div className="mt-2 pt-2 border-t border-emerald-200">
                          <p className="text-xs text-gray-600">
                            ${Math.floor(netProfitCollected).toLocaleString()} × {deltPayRetainedPercent}%
                          </p>
                        </div>
                      </div>

                      {/* Summary Box */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-lg p-4 border-2 border-gray-300">
                        <h4 className="font-semibold text-gray-900 mb-3">Total Distribution Summary</h4>
                        <div className="space-y-2 text-sm">
                          {deal.dealBroughtByRep && deal.repCommissionAmount && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {deal.repFirstName && deal.repLastName 
                                  ? `${deal.repFirstName} ${deal.repLastName}` 
                                  : 'Sales Rep'} (Commission)
                              </span>
                              <span className="font-semibold text-orange-700">${Math.floor(repCommissionEarned).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-600">Anshu Arora ({shareholderPercent}% net)</span>
                            <span className="font-semibold text-blue-700">${Math.floor(anshuShare).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Patrick Lowenthal ({shareholderPercent}% net)</span>
                            <span className="font-semibold text-purple-700">${Math.floor(patrickShare).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delt Pay ({deltPayRetainedPercent}% net)</span>
                            <span className="font-semibold text-emerald-700">${Math.floor(deltPayShare).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between pt-2 mt-2 border-t-2 border-gray-300">
                            <span className="font-bold text-gray-900">Total Net Distributed</span>
                            <span className="font-bold text-gray-900">
                              ${Math.floor(anshuShare + patrickShare + deltPayShare + (deal.dealBroughtByRep ? repCommissionEarned : 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Payment Progress</span>
                            <span>{(paymentPercentage * 100).toFixed(1)}% collected</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-900">
                            <strong>How it works:</strong> After each borrower payment, the factor income (profit) is collected. John Sarkissian receives 25% of the gross profit before costs. The remaining amount, after deducting 2% monthly borrowing costs, becomes the net profit. This net profit is split: 37.5% to Lowenthal Capital, 37.5% to IPF Sourcing, and the balance to Delt Pay.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg">Payment History</h2>
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </button>
            </div>

            {showAddPayment && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount</label>
                  <input
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    placeholder="18000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  >
                    <option value="ACH">ACH</option>
                    <option value="Wire">Wire</option>
                    <option value="Check">Check</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={newPayment.note}
                    onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
                    placeholder="Add a note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleAddPayment}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Add Payment
                  </button>
                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No payments recorded yet</p>
              ) : (
                (() => {
                  // Group payments by month
                  const groupedByMonth = payments.reduce((acc, payment) => {
                    const [year, month, day] = payment.date.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                    
                    if (!acc[monthKey]) {
                      acc[monthKey] = { label: monthLabel, payments: [] };
                    }
                    acc[monthKey].payments.push(payment);
                    return acc;
                  }, {} as Record<string, { label: string; payments: Payment[] }>);

                  return Object.entries(groupedByMonth).map(([monthKey, { label, payments: monthPayments }]) => {
                    const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);
                    const isExpanded = expandedMonths.has(monthKey);
                    const hasMultiplePayments = monthPayments.length > 1;

                    if (!hasMultiplePayments) {
                      // Single payment - display normally
                      const payment = monthPayments[0];
                      const isEditing = editingPayment === payment.id;

                      if (isEditing) {
                        return (
                          <div key={payment.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Date</label>
                                <input
                                  type="date"
                                  value={editedPaymentData.date}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, date: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={editedPaymentData.amount}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, amount: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Method</label>
                                <select
                                  value={editedPaymentData.method}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, method: e.target.value })}
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                >
                                  <option value="ACH">ACH</option>
                                  <option value="Wire">Wire</option>
                                  <option value="Check">Check</option>
                                  <option value="Zelle">Zelle</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Note</label>
                                <input
                                  type="text"
                                  value={editedPaymentData.note}
                                  onChange={(e) => setEditedPaymentData({ ...editedPaymentData, note: e.target.value })}
                                  placeholder="Add a note..."
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveEditedPayment}
                                className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPayment(null)}
                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={payment.id} className="p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <p className="text-sm font-semibold">${payment.amount.toLocaleString()}</p>
                              <p className="text-xs text-gray-600">{payment.method}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              {payment.note && (
                                <p className="text-xs text-gray-500 italic truncate">{payment.note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="text-xs text-gray-500">
                                {formatDate(payment.date)}
                              </p>
                              <button
                                onClick={() => handleEditPayment(payment)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                                title="Edit payment"
                              >
                                <Edit2 className="w-3 h-3 text-blue-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setPaymentToDelete(payment.id);
                                  setShowDeletePaymentModal(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                title="Delete payment"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Multiple payments - accordion view
                    return (
                      <div key={monthKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Month Header */}
                        <div 
                          onClick={() => toggleMonthExpanded(monthKey)}
                          className="p-3 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            <div>
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs text-gray-600">{monthPayments.length} payment{monthPayments.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-emerald-600">${monthTotal.toLocaleString()}</p>
                        </div>

                        {/* Expanded Payments */}
                        {isExpanded && (
                          <div className="divide-y divide-gray-200">
                            {monthPayments.map(payment => {
                              const isEditing = editingPayment === payment.id;

                              if (isEditing) {
                                return (
                                  <div key={payment.id} className="p-3 bg-blue-50 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Date</label>
                                        <input
                                          type="date"
                                          value={editedPaymentData.date}
                                          onChange={(e) => setEditedPaymentData({ ...editedPaymentData, date: e.target.value })}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Amount</label>
                                        <input
                                          type="number"
                                          value={editedPaymentData.amount}
                                          onChange={(e) => setEditedPaymentData({ ...editedPaymentData, amount: e.target.value })}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Method</label>
                                        <select
                                          value={editedPaymentData.method}
                                          onChange={(e) => setEditedPaymentData({ ...editedPaymentData, method: e.target.value })}
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        >
                                          <option value="ACH">ACH</option>
                                          <option value="Wire">Wire</option>
                                          <option value="Check">Check</option>
                                          <option value="Zelle">Zelle</option>
                                          <option value="Other">Other</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600 mb-1">Note</label>
                                        <input
                                          type="text"
                                          value={editedPaymentData.note}
                                          onChange={(e) => setEditedPaymentData({ ...editedPaymentData, note: e.target.value })}
                                          placeholder="Add a note..."
                                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={handleSaveEditedPayment}
                                        className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
                                      >
                                        <Save className="w-3 h-3" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingPayment(null)}
                                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition-colors"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={payment.id} className="p-3 bg-white group hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                      <p className="text-sm font-semibold">${payment.amount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-600">{payment.method}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {payment.note && (
                                        <p className="text-xs text-gray-500 italic truncate">{payment.note}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <p className="text-xs text-gray-500">
                                        {formatDate(payment.date)}
                                      </p>
                                      <button
                                        onClick={() => handleEditPayment(payment)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                                        title="Edit payment"
                                      >
                                        <Edit2 className="w-3 h-3 text-blue-600" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setPaymentToDelete(payment.id);
                                          setShowDeletePaymentModal(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                                        title="Delete payment"
                                      >
                                        <Trash2 className="w-3 h-3 text-red-600" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Delete File Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl space-y-4">
            <h2 className="text-lg">Confirm Delete</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this file? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFileToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteFile(fileToDelete);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {showDeletePaymentModal && paymentToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl space-y-4">
            <h2 className="text-lg">Confirm Delete</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this payment? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeletePaymentModal(false);
                  setPaymentToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeletePayment(paymentToDelete);
                  setShowDeletePaymentModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Commission Payout Modal */}
      {showDeleteCommissionModal && commissionToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm bg-gray-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl space-y-4">
            <h2 className="text-lg">Confirm Delete</h2>
            <p className="text-sm text-gray-600">Are you sure you want to delete this commission payout? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteCommissionModal(false);
                  setCommissionToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteCommissionPayout(commissionToDelete);
                  setShowDeleteCommissionModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost of Money Analysis Modal */}
      {showCostOfMoneyAnalysis && costOfMoneyData && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" style={{ maxWidth: '1800px' }}>
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-xl">Monthly Cash Flow Analysis</h2>
                  <p className="text-sm text-gray-600">{deal.borrower} - Complete Payment & Cost Breakdown</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadCostOfMoneyExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel
                  </button>
                  <button
                    onClick={() => setShowCostOfMoneyAnalysis(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Calculate actual total cost based on monthly calculations with actuals/overrides */}
                {(() => {
                  const actualMonthlyPayments = calculateActualMonthlyPayments(
                    payments, 
                    editedDeal.loanDate, 
                    Math.ceil(costOfMoneyData.termLength)
                  );
                  
                  const extendedSchedule = [...costOfMoneyData.monthlySchedule];
                  if (additionalMonths > 0) {
                    const lastMonth = extendedSchedule[extendedSchedule.length - 1];
                    for (let i = 1; i <= additionalMonths; i++) {
                      const monthNumber = costOfMoneyData.monthlySchedule.length + i;
                      extendedSchedule.push({
                        month: monthNumber,
                        startingBalance: 0,
                        principalReduction: 0,
                        borrowingCost: 0,
                        endingBalance: 0,
                        cumulativeCost: lastMonth.cumulativeCost
                      });
                    }
                  }
                  
                  let cumulativePrincipalBalance = editedDeal.loanAmountReceived || 0;
                  let actualTotalCost = 0;
                  
                  extendedSchedule.forEach((row, index) => {
                    if (index > 0) {
                      cumulativePrincipalBalance = extendedSchedule[index - 1].calculatedPrincipalEnding || cumulativePrincipalBalance;
                    }
                    
                    const monthKey = `month-${row.month}`;
                    let monthlyPaymentReceived;
                    
                    if (monthlyPaymentOverrides[monthKey] !== undefined) {
                      monthlyPaymentReceived = monthlyPaymentOverrides[monthKey];
                    } else if (actualMonthlyPayments[row.month]) {
                      monthlyPaymentReceived = actualMonthlyPayments[row.month];
                    } else {
                      if (deal.paymentSchedule === 'flat' && deal.flatPaymentAmount) {
                        const paymentsPerMonth = deal.paymentFrequency === 'weekly' ? 4.33 : deal.paymentFrequency === 'bi-monthly' ? 2 : 1;
                        monthlyPaymentReceived = deal.flatPaymentAmount * paymentsPerMonth;
                      } else {
                        const paymentsPerMonth = deal.paymentSchedule === 'Daily' ? 22 : deal.paymentSchedule === 'Weekly' ? 4 : 1;
                        const totalPayments = costOfMoneyData.termLength * paymentsPerMonth;
                        const paymentAmount = (deal.repaymentAmountDue || 0) / totalPayments;
                        monthlyPaymentReceived = paymentAmount * paymentsPerMonth;
                      }
                    }
                    
                    let principalPaid = principalPaidOverrides[monthKey] ?? row.principalReduction;
                    const principalEndingBalance = cumulativePrincipalBalance - principalPaid;
                    const borrowingCost = principalEndingBalance <= 0 ? 0 : cumulativePrincipalBalance * 0.02;
                    
                    actualTotalCost += borrowingCost;
                    row.calculatedPrincipalEnding = principalEndingBalance;
                  });
                  
                  // Store the calculated total cost in a variable we can reference
                  window.__actualTotalCost = actualTotalCost;
                  return null;
                })()}
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs text-gray-600 mb-1">Loan Amount</p>
                    <p className="text-xl text-emerald-600">${costOfMoneyData.loanAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-gray-600 mb-1">Payback Amount</p>
                    <p className="text-xl text-blue-600">${(deal.repaymentAmountDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs text-gray-600 mb-1">Term Length</p>
                    <p className="text-xl text-purple-600">
                      {deal.termUnit === 'weeks' 
                        ? `${deal.borrowTermMonths || deal.termLength || 6} weeks`
                        : `${costOfMoneyData.termLength} months`
                      }
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs text-gray-600 mb-1">Total Cost of Money</p>
                    <p className="text-xl text-red-600">${(window.__actualTotalCost || costOfMoneyData.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <p className="text-xs text-gray-600 mb-1">Borrowing Rate</p>
                    <p className="text-xl text-orange-600">2%/mo</p>
                    <p className="text-xs text-gray-500">Amortizing</p>
                  </div>
                </div>

                {/* How This Works */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900">
                    <span className="text-blue-700">How This Works:</span> Merchant pays daily, but we pay back our lender <strong>monthly</strong> to reduce the outstanding principal and minimize our 2% monthly borrowing cost.
                  </p>
                </div>

                {/* Effective Cost Explanation */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900">
                        <strong>Effective Cost of Money:</strong> While our nominal rate is {costOfMoneyData.nominalRate}%/month ({(costOfMoneyData.nominalRate * costOfMoneyData.termLength).toFixed(0)}% over {costOfMoneyData.termLength} months), our <strong className="text-amber-700">actual cost is only {costOfMoneyData.effectiveRate.toFixed(2)}%</strong> because we pay down principal monthly, reducing the outstanding balance and interest charges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Monthly Schedule Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* View Mode Toggle */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">Payment Schedule Breakdown</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCashFlowViewMode('monthly')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          cashFlowViewMode === 'monthly'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Monthly View
                      </button>
                      <button
                        onClick={() => setCashFlowViewMode('weekly')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                          cashFlowViewMode === 'weekly'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Weekly View
                      </button>
                      {cashFlowViewMode === 'monthly' && (
                        <button
                          onClick={() => setIsEditingMonthlyPayments(!isEditingMonthlyPayments)}
                          className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                            isEditingMonthlyPayments
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                          {isEditingMonthlyPayments ? 'Done Editing' : 'Override Payments'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Info banner for monthly view */}
                  {cashFlowViewMode === 'monthly' && (() => {
                    const actualMonthlyPayments = calculateActualMonthlyPayments(
                      payments, 
                      editedDeal.loanDate, 
                      Math.ceil(costOfMoneyData.termLength)
                    );
                    const hasActualPayments = Object.keys(actualMonthlyPayments).length > 0;
                    const hasOverrides = Object.keys(monthlyPaymentOverrides).length > 0;
                    
                    if (hasActualPayments || hasOverrides || isEditingMonthlyPayments) {
                      return (
                        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-xs text-blue-700 flex-1">
                              {isEditingMonthlyPayments ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <strong>Override Mode:</strong> You can now manually edit payment amounts and principal paid per month. Changes will be saved. You can also add additional months.
                                </span>
                              ) : hasOverrides ? (
                                <span className="flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <strong>Manual Overrides Active:</strong> Some months have manually adjusted payment amounts (shown in purple with "Override" badge).
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <strong>Actual Payments:</strong> Payment amounts reflect real payments from Payment History, aggregated by month (shown in green with "Actual" badge).
                                </span>
                              )}
                            </p>
                            {hasActualPayments && !isEditingMonthlyPayments && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-emerald-500 rounded"></span>
                                  <span className="text-gray-600">Actual</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-purple-500 rounded"></span>
                                  <span className="text-gray-600">Override</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 bg-blue-500 rounded"></span>
                                  <span className="text-gray-600">Estimated</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs text-gray-600">{cashFlowViewMode === 'weekly' ? 'Week' : 'Month'}</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Payback Amount</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Principal Balance</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Factor Balance</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Payment Received</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Principal Paid</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Rep Commission</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Borrowing Cost</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Gross Profit</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-600">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cashFlowViewMode === 'monthly' ? (
                          // Monthly View
                          (() => {
                            // Calculate actual monthly payments from payment history
                            const actualMonthlyPayments = calculateActualMonthlyPayments(
                              payments, 
                              editedDeal.loanDate, 
                              Math.ceil(costOfMoneyData.termLength)
                            );
                            
                            // Create extended schedule including additional months
                            const extendedSchedule = [...costOfMoneyData.monthlySchedule];
                            
                            // Add additional months if any
                            if (additionalMonths > 0) {
                              const lastMonth = extendedSchedule[extendedSchedule.length - 1];
                              for (let i = 1; i <= additionalMonths; i++) {
                                const monthNumber = costOfMoneyData.monthlySchedule.length + i;
                                extendedSchedule.push({
                                  month: monthNumber,
                                  startingBalance: 0, // Will be calculated
                                  principalReduction: 0,
                                  borrowingCost: 0,
                                  endingBalance: 0,
                                  cumulativeCost: lastMonth.cumulativeCost
                                });
                              }
                            }
                            
                            // Track cumulative values across months
                            let cumulativePaybackReduction = 0;
                            let cumulativePrincipalBalance = editedDeal.loanAmountReceived || 0;
                            let cumulativeFactorBalance = (editedDeal.repaymentAmountDue || 0) - cumulativePrincipalBalance;
                            let cumulativeCost = 0;
                            
                            // Track totals for summary row
                            let totalPaymentReceived = 0;
                            let totalRepCommission = 0;
                            let totalBorrowingCost = 0;
                            let totalGrossProfit = 0;
                            
                            const rows = extendedSchedule.map((row, index) => {
                              // For months after the first, use the previous month's ending balances
                              if (index > 0) {
                                cumulativePrincipalBalance = extendedSchedule[index - 1].calculatedPrincipalEnding || cumulativePrincipalBalance;
                                cumulativeFactorBalance = extendedSchedule[index - 1].calculatedFactorEnding || cumulativeFactorBalance;
                              }
                              
                              // Check if there's a manual override for this month
                              const monthKey = `month-${row.month}`;
                              let monthlyPaymentReceived;
                              
                              if (monthlyPaymentOverrides[monthKey] !== undefined) {
                                // Use manual override
                                monthlyPaymentReceived = monthlyPaymentOverrides[monthKey];
                              } else if (actualMonthlyPayments[row.month]) {
                                // Use actual payment from payment history
                                monthlyPaymentReceived = actualMonthlyPayments[row.month];
                              } else {
                                // Fall back to estimated payment
                                if (deal.paymentSchedule === 'flat' && deal.flatPaymentAmount) {
                                  const paymentsPerMonth = deal.paymentFrequency === 'weekly' ? 4.33 : deal.paymentFrequency === 'bi-monthly' ? 2 : 1;
                                  monthlyPaymentReceived = deal.flatPaymentAmount * paymentsPerMonth;
                                } else {
                                  const paymentsPerMonth = deal.paymentSchedule === 'Daily' ? 22 : deal.paymentSchedule === 'Weekly' ? 4 : 1;
                                  const totalPayments = costOfMoneyData.termLength * paymentsPerMonth;
                                  const paymentAmount = (deal.repaymentAmountDue || 0) / totalPayments;
                                  monthlyPaymentReceived = paymentAmount * paymentsPerMonth;
                                }
                              }
                              
                              // Check if there's a principal override
                              let principalPaid = principalPaidOverrides[monthKey] ?? row.principalReduction;
                              
                              // Calculate rep commission: Payment Received - Principal Paid (with override support)
                              const autoRepCommission = monthlyPaymentReceived - principalPaid;
                              const repCommission = repCommissionOverrides[monthKey] ?? autoRepCommission;
                              
                              // Calculate Payback Amount (remaining) BEFORE adding current month's payment
                              const totalPaybackAmount = editedDeal.repaymentAmountDue || 0;
                              const paybackAmount = totalPaybackAmount - cumulativePaybackReduction;
                              const factorBalance = cumulativeFactorBalance;
                              
                              // Update cumulative payback reduction AFTER calculating payback amount
                              cumulativePaybackReduction += monthlyPaymentReceived;
                              
                              // Calculate Ending Balances first to check if loan is paid off
                              // Principal Ending Balance = Principal Starting Balance - Principal Paid
                              const principalEndingBalance = cumulativePrincipalBalance - principalPaid;
                              // Factor Ending Balance = Factor Starting Balance - Rep Commission
                              const factorEndingBalance = factorBalance - repCommission;
                              
                              // Calculate borrowing cost on the current principal balance
                              // BUT if the ending balance is 0 or negative (loan paid off), borrowing cost should be $0
                              const borrowingCost = principalEndingBalance <= 0 ? 0 : cumulativePrincipalBalance * 0.02;
                              
                              // Update cumulative cost
                              cumulativeCost += borrowingCost;
                              
                              // Calculate Gross Profit = Payment Received - Rep Commission - Borrowing Cost
                              const grossProfit = monthlyPaymentReceived - repCommission - borrowingCost;
                              
                              // Add to totals
                              totalPaymentReceived += monthlyPaymentReceived;
                              totalRepCommission += repCommission;
                              totalBorrowingCost += borrowingCost;
                              totalGrossProfit += grossProfit;
                              
                              // Store calculated ending balances for next iteration
                              row.calculatedPrincipalEnding = principalEndingBalance;
                              row.calculatedFactorEnding = factorEndingBalance;
                              
                              // Determine if this is an editable field
                              const isEditable = isEditingMonthlyPayments;
                              
                              return (
                                <tr key={row.month} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm">{getMonthName(editedDeal.loanDate, row.month)}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${paybackAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm">${cumulativePrincipalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">${factorBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex items-center justify-end gap-1">
                                      {isEditable ? (
                                        <input
                                          type="number"
                                          value={monthlyPaymentOverrides[monthKey] ?? (actualMonthlyPayments[row.month] || monthlyPaymentReceived)}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setMonthlyPaymentOverrides(prev => ({
                                              ...prev,
                                              [monthKey]: value
                                            }));
                                          }}
                                          className="w-full px-2 py-1 border border-blue-300 rounded text-right text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-blue-50"
                                          step="0.01"
                                        />
                                      ) : (
                                        <>
                                          <span className={`${monthlyPaymentOverrides[monthKey] !== undefined ? 'text-purple-600 font-semibold' : actualMonthlyPayments[row.month] ? 'text-emerald-600 font-semibold' : 'text-blue-600'}`}>
                                            ${monthlyPaymentReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          {monthlyPaymentOverrides[monthKey] !== undefined && (
                                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Override</span>
                                          )}
                                          {!monthlyPaymentOverrides[monthKey] && actualMonthlyPayments[row.month] && (
                                            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">Actual</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex items-center justify-end gap-1">
                                      {isEditable ? (
                                        <input
                                          type="number"
                                          value={principalPaidOverrides[monthKey] ?? row.principalReduction}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setPrincipalPaidOverrides(prev => ({
                                              ...prev,
                                              [monthKey]: value
                                            }));
                                          }}
                                          className="w-full px-2 py-1 border border-emerald-300 rounded text-right text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-emerald-50"
                                          step="0.01"
                                        />
                                      ) : (
                                        <>
                                          <span className={`${principalPaidOverrides[monthKey] !== undefined ? 'text-purple-600 font-semibold' : 'text-emerald-600'}`}>
                                            ${principalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          {principalPaidOverrides[monthKey] !== undefined && (
                                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Override</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex items-center justify-end gap-1">
                                      {isEditable ? (
                                        <input
                                          type="number"
                                          value={repCommissionOverrides[monthKey] ?? autoRepCommission}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            setRepCommissionOverrides(prev => ({
                                              ...prev,
                                              [monthKey]: value
                                            }));
                                          }}
                                          className="w-full px-2 py-1 border border-purple-300 rounded text-right text-purple-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-purple-50"
                                          step="0.01"
                                        />
                                      ) : (
                                        <>
                                          <span className={`${repCommissionOverrides[monthKey] !== undefined ? 'text-purple-600 font-semibold' : 'text-gray-700'}`}>
                                            ${repCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          {repCommissionOverrides[monthKey] !== undefined && (
                                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Override</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm text-red-600">${borrowingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className={`px-4 py-3 text-right text-sm font-medium ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs text-gray-500">P: ${principalEndingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      <span className="text-xs text-gray-500">F: ${factorEndingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                            
                            // Add totals row
                            return [
                              ...rows,
                              <tr key="totals" className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
                                <td className="px-4 py-3 text-sm" colSpan={4}>TOTALS</td>
                                <td className="px-4 py-3 text-right text-sm text-blue-700">${totalPaymentReceived.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right text-sm"></td>
                                <td className="px-4 py-3 text-right text-sm text-gray-700">${totalRepCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right text-sm text-red-700">${totalBorrowingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className={`px-4 py-3 text-right text-sm font-bold ${totalGrossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>${totalGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-right text-sm"></td>
                              </tr>
                            ];
                          })()
                        ) : (
                          // Weekly View
                          (() => {
                            const totalWeeks = deal.termUnit === 'weeks' ? (deal.borrowTermMonths || deal.termLength || 24) : Math.ceil(costOfMoneyData.termLength * 4.33);
                            const weeklyPayment = deal.flatPaymentAmount || ((deal.repaymentAmountDue || 0) / totalWeeks);
                            const weeklyPrincipal = (deal.loanAmountReceived || 0) / totalWeeks;
                            
                            let remainingBalance = deal.loanAmountReceived || 0;
                            const weeks = [];
                            
                            for (let week = 1; week <= totalWeeks; week++) {
                              const startBalance = remainingBalance;
                              const principal = Math.min(weeklyPrincipal, remainingBalance);
                              remainingBalance -= principal;
                              const weeklyCommission = weeklyPayment - principal;
                              const grossProfit = weeklyPayment - principal - weeklyCommission;
                              
                              weeks.push(
                                <tr key={week} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm">Week {week}</td>
                                  <td className="px-4 py-3 text-right text-sm">${startBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm text-blue-600">${weeklyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm text-emerald-600">${principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm text-gray-700">${weeklyCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm text-red-600">$0.00</td>
                                  <td className="px-4 py-3 text-right text-sm text-amber-600 font-medium">${grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  <td className="px-4 py-3 text-right text-sm">${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              );
                            }
                            
                            return weeks;
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add Month Button - Only shown in edit mode for monthly view */}
                  {cashFlowViewMode === 'monthly' && isEditingMonthlyPayments && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                      <button
                        onClick={() => setAdditionalMonths(prev => prev + 1)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Another Month
                      </button>
                      {additionalMonths > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-600">{additionalMonths} additional month(s) added</span>
                          <button
                            onClick={() => setAdditionalMonths(0)}
                            className="text-xs text-red-600 hover:text-red-700 underline"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Profit Distribution Section */}
                <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Net Profit Distribution</h3>
                  <div className="space-y-4">
                    {(() => {
                      const netProfit = (editedDeal.grossProfit || 0) - costOfMoneyData.totalCost - (editedDeal.repCommissionAmount || 0) + (editedDeal.originationFee || 0);
                      const deltPayRetainedPercent = editedDeal.deltPayRetainedPercentage || 25;
                      const shareholderPercent = (100 - deltPayRetainedPercent) / 2;
                      const anshuShare = netProfit * (shareholderPercent / 100);
                      const patrickShare = netProfit * (shareholderPercent / 100);
                      const deltPayShare = netProfit * (deltPayRetainedPercent / 100);
                      
                      return (
                        <>
                          {/* Total Net Profit */}
                          <div className="bg-white rounded-lg p-4 border-2 border-emerald-300">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">Total Net Profit</span>
                              <span className="text-2xl font-bold text-emerald-600">${netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">After Cost of Money & Sales Rep Commission</p>
                          </div>
                          
                          {/* Shareholders */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Anshu */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-800">Anshu Arora</span>
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{shareholderPercent}%</span>
                              </div>
                              <p className="text-2xl font-bold text-purple-600">${anshuShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                            </div>
                            
                            {/* Patrick */}
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-800">Patrick Lowenthal</span>
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{shareholderPercent}%</span>
                              </div>
                              <p className="text-2xl font-bold text-purple-600">${patrickShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                            </div>
                            
                            {/* Delt Pay */}
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-800">Delt Pay Retained</span>
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">{deltPayRetainedPercent}%</span>
                              </div>
                              <p className="text-2xl font-bold text-gray-600">${deltPayShare.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}