import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { saveDeal } from '../utils/api';

interface NewDealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onDealCreated?: (dealId: string) => void;
}

export function NewDealDrawer({ isOpen, onClose, onDealCreated }: NewDealDrawerProps) {
  const [loanType, setLoanType] = useState<'personal' | 'business'>('business');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [factorRate, setFactorRate] = useState('');
  const [industry, setIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Expanded industry list
  const industries = [
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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const formatLoanAmount = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Convert to number and format with commas
    if (digits === '') return '';
    const number = parseInt(digits, 10);
    return number.toLocaleString('en-US');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLoanAmount(e.target.value);
    setLoanAmount(formatted);
  };

  const handleRepaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLoanAmount(e.target.value);
    setRepaymentAmount(formatted);
    
    // Auto-calculate gross interest based on loan amount and repayment amount
    if (loanAmount && formatted) {
      const loan = parseFloat(loanAmount.replace(/,/g, ''));
      const repayment = parseFloat(formatted.replace(/,/g, ''));
      if (loan > 0 && repayment > 0) {
        const grossInterestPercent = ((repayment - loan) / loan) * 100;
        setFactorRate(grossInterestPercent.toFixed(2));
      }
    }
  };

  const handleFactorRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, ''); // Only allow digits and decimal point
    setFactorRate(value);
    
    // Auto-calculate repayment amount based on loan amount and factor rate
    if (loanAmount && value) {
      const loan = parseFloat(loanAmount.replace(/,/g, ''));
      const rate = parseFloat(value);
      if (loan > 0 && rate > 0) {
        const repayment = loan * (1 + rate / 100);
        setRepaymentAmount(formatLoanAmount(Math.round(repayment).toString()));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formElements = form.elements as any;

    // Collect form data
    const data = {
      dealName: formElements.dealName.value,
      loanType,
      businessName: loanType === 'business' ? formElements.businessName?.value : undefined,
      industry: loanType === 'business' ? (industry === 'Other' ? customIndustry : industry) : undefined,
      loanPurpose: loanType === 'personal' ? formElements.loanPurpose?.value : undefined,
      firstName: formElements.firstName.value,
      lastName: formElements.lastName.value,
      email: formElements.email.value,
      phone: phoneNumber,
      loanDate: formElements.loanDate.value,
      fundedDate: formElements.fundedDate?.value || undefined,
      requestedAmount: loanAmount.replace(/,/g, ''),
      notes: formElements.notes.value
    };

    setFormData(data);
    setShowStatusModal(true);
  };

  const handleSaveWithStatus = async (status: 'Pending' | 'Funded' | 'Declined') => {
    setSaving(true);
    
    try {
      const loanAmountNum = parseFloat(formData.requestedAmount);
      const repaymentAmountNum = parseFloat(repaymentAmount.replace(/,/g, ''));
      const grossInterestPercent = parseFloat(factorRate);
      
      // Convert gross interest % to factor rate (e.g., 35% -> 1.35)
      const factorRateValue = (1 + (grossInterestPercent / 100)).toFixed(2);
      
      // Correct financial calculations
      const grossRevenue = repaymentAmountNum; // Gross Revenue = Repayment Due
      const grossProfit = repaymentAmountNum - loanAmountNum; // Gross Profit = Repayment - Loan
      const costToIssuer = loanAmountNum; // Cost to Issuer = Loan Amount
      const srCommission = grossProfit * 0.10; // 10% commission on gross profit (before cost of money)
      
      // Calculate cost of money (2% per month on outstanding balance - simplified average)
      const termLength = 9; // default 9 months
      const borrowingCostPerMonth = loanAmountNum * 0.02;
      const totalCostOfMoney = borrowingCostPerMonth * termLength;
      
      // Net Profit = Gross Profit - SR Commission - Cost of Money
      const netProfit = grossProfit - srCommission - totalCostOfMoney;
      
      // Default profit shareholders - Anshu and Patrick get 37.5% each of Net Profit
      const anshuShare = netProfit * 0.375;
      const patrickShare = netProfit * 0.375;
      const profitShares = [
        { name: 'Anshu Arora', amount: anshuShare, percentage: 37.5 },
        { name: 'Patrick Lowenthal', amount: patrickShare, percentage: 37.5 }
      ];

      const dealToSave = {
        dealName: formData.dealName,
        borrower: `${formData.firstName} ${formData.lastName}`,
        status,
        loanAmountReceived: loanAmountNum,
        repaymentAmountDue: repaymentAmountNum,
        grossInterest: grossInterestPercent,
        factorRate: factorRateValue,
        issuer: 'Delt Pay',
        amountIssued: loanAmountNum,
        dailyDefaultRate: 0.5,
        grossRevenue: grossRevenue,
        costToIssuer: costToIssuer,
        grossProfit: grossProfit,
        srCommission: srCommission,
        netProfit: netProfit,
        borrowingCostPerMonth: 2, // Store as percentage value, not dollar amount
        industry: formData.industry, // Add industry at top level
        termUnit: 'months', // Default to months
        profitShares: profitShares,
        borrowerInfo: {
          loanType: formData.loanType,
          businessName: formData.businessName,
          industry: formData.industry,
          loanPurpose: formData.loanPurpose,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          loanDate: formData.loanDate,
          fundedDate: formData.fundedDate,
          notes: formData.notes
        },
        metrics: {},
        recommendation: {}
      };

      const result = await saveDeal(dealToSave);
      
      if (result.success) {
        setShowStatusModal(false);
        onClose();
        // Reset form
        setLoanType('business');
        setPhoneNumber('');
        setLoanAmount('');
        setRepaymentAmount('');
        setFactorRate('');
        setIndustry('');
        setCustomIndustry('');
        setFormData(null);
        if (onDealCreated) {
          onDealCreated(result.dealId);
        }
      } else {
        alert('Error saving deal: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      alert('Error saving deal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl">Create New Deal</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm mb-1 sm:mb-2">Deal Name *</label>
              <input
                type="text"
                name="dealName"
                required
                placeholder="e.g., ABC Corp MCA"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Loan Type Selector */}
            <div>
              <label className="block text-sm mb-1 sm:mb-2">Loan Type *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setLoanType('business')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    loanType === 'business'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Business Loan
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType('personal')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    loanType === 'personal'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Personal Loan
                </button>
              </div>
            </div>

            {/* Conditional Fields Based on Loan Type */}
            {loanType === 'business' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm mb-1 sm:mb-2">Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    placeholder="Business name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 sm:mb-2">Industry *</label>
                  <select 
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="">Select industry...</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                {industry === 'Other' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm mb-1 sm:mb-2">Specify Industry *</label>
                    <input
                      type="text"
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      required
                      placeholder="Enter custom industry"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm mb-1 sm:mb-2">Purpose of Loan *</label>
                <select 
                  name="loanPurpose"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Select purpose...</option>
                  <option>Debt Consolidation</option>
                  <option>Home Improvement</option>
                  <option>Medical Expenses</option>
                  <option>Education</option>
                  <option>Major Purchase</option>
                  <option>Other</option>
                </select>
              </div>
            )}

            {/* Borrower Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm mb-1 sm:mb-2">
                  {loanType === 'business' ? 'Contact First Name *' : 'First Name *'}
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="First name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 sm:mb-2">
                  {loanType === 'business' ? 'Contact Last Name *' : 'Last Name *'}
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Last name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm mb-1 sm:mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 sm:mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  required
                  placeholder="(555) 123-4567"
                  maxLength={14}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Loan Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm mb-1 sm:mb-2">Loan Date (Paperwork Signed) *</label>
                <input
                  type="date"
                  name="loanDate"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 sm:mb-2">Funded Date</label>
                <input
                  type="date"
                  name="fundedDate"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 sm:mb-2">Requested Loan Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="text"
                  name="loanAmount"
                  value={loanAmount}
                  onChange={handleLoanAmountChange}
                  required
                  placeholder="50,000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 sm:mb-2">Repayment Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="text"
                  name="repaymentAmount"
                  value={repaymentAmount}
                  onChange={handleRepaymentAmountChange}
                  required
                  placeholder="65,000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 sm:mb-2">Factor Rate *</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">%</span>
                <input
                  type="text"
                  name="factorRate"
                  value={factorRate}
                  onChange={handleFactorRateChange}
                  required
                  placeholder="30"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1 sm:mb-2">Notes</label>
              <textarea
                name="notes"
                rows={4}
                placeholder="Additional notes about this deal..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Create Deal
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Status Selection Modal */}
      {showStatusModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowStatusModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl p-6 w-full max-w-md z-[70]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Select Deal Status</h3>
                <p className="text-sm text-gray-600">Choose the initial status for this deal</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleSaveWithStatus('Pending')}
                disabled={saving}
                className="w-full p-4 border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-orange-900">Pending</p>
                    <p className="text-sm text-orange-700">Deal is under review</p>
                  </div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
              </button>

              <button
                onClick={() => handleSaveWithStatus('Funded')}
                disabled={saving}
                className="w-full p-4 border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-900">Funded</p>
                    <p className="text-sm text-emerald-700">Deal is approved and funded</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                </div>
              </button>

              <button
                onClick={() => handleSaveWithStatus('Declined')}
                disabled={saving}
                className="w-full p-4 border-2 border-red-300 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-red-900">Declined</p>
                    <p className="text-sm text-red-700">Deal was not approved</p>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowStatusModal(false)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {saving && (
              <div className="mt-3 text-center text-sm text-gray-600">
                Saving deal...
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}