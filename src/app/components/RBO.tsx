import { useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle, XCircle, Calculator, PieChart, TrendingDown, Building2, Target } from 'lucide-react';
import { FileUploader } from './FileUploader';

type BuyoutType = 'stagnant' | 'exclusive';

interface AccountData {
  accountName: string;
  month1: number;
  month2: number;
  month3: number;
}

interface RBODeal {
  dealName: string;
  numAccounts: number;
  processingVolume: number;
  netIncome: number;
  currentSplit: string;
  buyMultiple: number;
  attritionRate: number;
  topAccountPercentage: number;
  buyoutType: BuyoutType;
  month1Residual: number;
  month2Residual: number;
  month3Residual: number;
  earnoutStructure: boolean;
  earnoutPercentage: number;
  uploadedAccounts: AccountData[];
}

export function RBO() {
  const [rboDeal, setRBODeal] = useState<RBODeal>({
    dealName: '',
    numAccounts: 0,
    processingVolume: 0,
    netIncome: 0,
    currentSplit: '70/30',
    buyMultiple: 0,
    attritionRate: 0,
    topAccountPercentage: 0,
    buyoutType: 'stagnant',
    month1Residual: 0,
    month2Residual: 0,
    month3Residual: 0,
    earnoutStructure: false,
    earnoutPercentage: 20,
    uploadedAccounts: [],
  });

  const analyzeRBO = () => {
    const avgMonthlyResidual = (rboDeal.month1Residual + rboDeal.month2Residual + rboDeal.month3Residual) / 3;
    const annualResidual = avgMonthlyResidual * 12;
    const purchasePrice = avgMonthlyResidual * rboDeal.buyMultiple;
    const upfrontPayment = rboDeal.earnoutStructure 
      ? purchasePrice * (1 - rboDeal.earnoutPercentage / 100)
      : purchasePrice;
    const earnoutAmount = rboDeal.earnoutStructure 
      ? purchasePrice * (rboDeal.earnoutPercentage / 100)
      : 0;

    // Calculate flip value (assuming 15-20% markup)
    const flipMultiple = rboDeal.buyMultiple * 1.175; // 17.5% markup
    const flipValue = avgMonthlyResidual * flipMultiple;
    const flipProfit = flipValue - purchasePrice;

    // Calculate keep strategy ROI
    const adjustedAttrition = rboDeal.attritionRate / 100;
    const year1Residual = annualResidual * (1 - adjustedAttrition);
    const year2Residual = year1Residual * (1 - adjustedAttrition);
    const year3Residual = year2Residual * (1 - adjustedAttrition);
    const threeYearResidual = year1Residual + year2Residual + year3Residual;
    const keepNetProfit = threeYearResidual - purchasePrice;
    const keepROI = (keepNetProfit / purchasePrice) * 100;

    // Calculate flip ROI
    const flipROI = (flipProfit / purchasePrice) * 100;

    // Risk Score (0-100, lower is better)
    let riskScore = 0;
    
    // Concentration risk (0-30 points)
    if (rboDeal.topAccountPercentage > 40) riskScore += 30;
    else if (rboDeal.topAccountPercentage > 30) riskScore += 20;
    else if (rboDeal.topAccountPercentage > 20) riskScore += 10;
    else riskScore += 5;

    // Attrition risk (0-30 points)
    if (rboDeal.attritionRate > 20) riskScore += 30;
    else if (rboDeal.attritionRate > 15) riskScore += 20;
    else if (rboDeal.attritionRate > 10) riskScore += 10;
    else riskScore += 5;

    // Multiple risk (0-20 points)
    if (rboDeal.buyMultiple > 30) riskScore += 20;
    else if (rboDeal.buyMultiple > 24) riskScore += 15;
    else if (rboDeal.buyMultiple > 18) riskScore += 5;

    // Account diversity (0-20 points)
    if (rboDeal.numAccounts < 10) riskScore += 20;
    else if (rboDeal.numAccounts < 20) riskScore += 10;
    else if (rboDeal.numAccounts < 30) riskScore += 5;

    // Determine recommendation
    let recommendation = '';
    let recommendationType: 'keep' | 'flip' | 'pass' = 'pass';

    if (riskScore > 60) {
      recommendation = 'PASS - Risk too high. High concentration, attrition, or overpriced multiple.';
      recommendationType = 'pass';
    } else if (flipROI > 15 && flipProfit > 10000) {
      recommendation = 'FLIP - Quick arbitrage opportunity with solid ROI. Execute flip strategy.';
      recommendationType = 'flip';
    } else if (keepROI > 100 && riskScore < 40) {
      recommendation = 'KEEP - Strong long-term residual income with manageable risk. Hold for cash flow.';
      recommendationType = 'keep';
    } else if (keepROI > 50) {
      recommendation = 'KEEP - Decent residual income stream. Consider holding if cash flow is needed.';
      recommendationType = 'keep';
    } else {
      recommendation = 'PASS - ROI too low for both flip and keep strategies. Negotiate better terms.';
      recommendationType = 'pass';
    }

    // Calculate break-even timeline
    const breakEvenMonths = Math.ceil(purchasePrice / avgMonthlyResidual);

    // Calculate required new accounts for exclusive deals
    const requiredNewAccountsPerMonth = rboDeal.buyoutType === 'exclusive' ? Math.ceil(rboDeal.numAccounts * 0.05) : 0;
    
    // Calculate required new accounts to offset attrition (monthly attrition rate based on annual)
    const monthlyAttritionRate = rboDeal.attritionRate / 12 / 100;
    const accountsLostPerMonth = rboDeal.numAccounts * monthlyAttritionRate;
    const requiredAccountsToOffsetAttrition = Math.ceil(accountsLostPerMonth);

    return {
      avgMonthlyResidual,
      annualResidual,
      purchasePrice,
      upfrontPayment,
      earnoutAmount,
      flipValue,
      flipProfit,
      flipROI,
      year1Residual,
      year2Residual,
      year3Residual,
      threeYearResidual,
      keepNetProfit,
      keepROI,
      riskScore,
      recommendation,
      recommendationType,
      breakEvenMonths,
      requiredNewAccountsPerMonth,
      requiredAccountsToOffsetAttrition,
    };
  };

  const handleRBOFileUpload = (accounts: AccountData[]) => {
    if (accounts.length === 0) return;
    
    // Calculate totals from uploaded accounts
    const month1Total = accounts.reduce((sum, acc) => sum + acc.month1, 0);
    const month2Total = accounts.reduce((sum, acc) => sum + acc.month2, 0);
    const month3Total = accounts.reduce((sum, acc) => sum + acc.month3, 0);
    
    // Find top account percentage
    const avgPerAccount = accounts.map(acc => (acc.month1 + acc.month2 + acc.month3) / 3);
    const topAccountAvg = Math.max(...avgPerAccount);
    const totalAvg = (month1Total + month2Total + month3Total) / 3;
    const topAccountPercentage = (topAccountAvg / totalAvg) * 100;
    
    // Update deal with calculated values
    setRBODeal({
      ...rboDeal,
      numAccounts: accounts.length,
      month1Residual: month1Total,
      month2Residual: month2Total,
      month3Residual: month3Total,
      topAccountPercentage: Math.round(topAccountPercentage),
      uploadedAccounts: accounts,
    });
  };

  const rboAnalysis = analyzeRBO();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 shadow-xl">
        <h1 className="text-3xl mb-2">RBO Purchase & Arbitrage Analysis</h1>
        <p className="text-purple-100">Evaluate residual buyout opportunities and determine optimal strategy: flip or keep</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="text-lg mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              Deal Parameters
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Deal Name</label>
                <input
                  type="text"
                  value={rboDeal.dealName}
                  onChange={(e) => setRBODeal({ ...rboDeal, dealName: e.target.value })}
                  placeholder="e.g., Smith Portfolio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Number of Accounts</label>
                <input
                  type="number"
                  value={rboDeal.numAccounts || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, numAccounts: Number(e.target.value) })}
                  placeholder="e.g., 25"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Total Processing Volume ($)</label>
                <input
                  type="number"
                  value={rboDeal.processingVolume || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, processingVolume: Number(e.target.value) })}
                  placeholder="e.g., 150000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Total monthly card volume</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Net Income ($)</label>
                <input
                  type="number"
                  value={rboDeal.netIncome || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, netIncome: Number(e.target.value) })}
                  placeholder="e.g., 3500"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">After processor & card brand fees</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Current Split</label>
                <select
                  value={rboDeal.currentSplit}
                  onChange={(e) => setRBODeal({ ...rboDeal, currentSplit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="70/30">70/30</option>
                  <option value="80/20">80/20</option>
                  <option value="75/25">75/25</option>
                  <option value="60/40">60/40</option>
                  <option value="90/10">90/10</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Buy Multiple</label>
                <input
                  type="number"
                  value={rboDeal.buyMultiple || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, buyMultiple: Number(e.target.value) })}
                  placeholder="e.g., 24"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Months of residual to pay</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Attrition Rate (%)</label>
                <input
                  type="number"
                  value={rboDeal.attritionRate || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, attritionRate: Number(e.target.value) })}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">Expected annual account loss</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Largest Account Concentration (%)</label>
                <input
                  type="number"
                  value={rboDeal.topAccountPercentage || ''}
                  onChange={(e) => setRBODeal({ ...rboDeal, topAccountPercentage: Number(e.target.value) })}
                  placeholder="e.g., 18"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">% of total income from single account</p>
              </div>

              <div>
                <label className="block text-sm mb-1">Buyout Type</label>
                <select
                  value={rboDeal.buyoutType}
                  onChange={(e) => setRBODeal({ ...rboDeal, buyoutType: e.target.value as BuyoutType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="stagnant">Stagnant (Non-Exclusive)</option>
                  <option value="exclusive">Exclusive (New Deals Required)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs mb-1">Month 1 Residual</label>
                  <input
                    type="number"
                    value={rboDeal.month1Residual}
                    onChange={(e) => setRBODeal({ ...rboDeal, month1Residual: Number(e.target.value) })}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Month 2 Residual</label>
                  <input
                    type="number"
                    value={rboDeal.month2Residual}
                    onChange={(e) => setRBODeal({ ...rboDeal, month2Residual: Number(e.target.value) })}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Month 3 Residual</label>
                  <input
                    type="number"
                    value={rboDeal.month3Residual}
                    onChange={(e) => setRBODeal({ ...rboDeal, month3Residual: Number(e.target.value) })}
                    className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rboDeal.earnoutStructure}
                  onChange={(e) => setRBODeal({ ...rboDeal, earnoutStructure: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Include Earnout Structure</label>
              </div>

              {rboDeal.earnoutStructure && (
                <div>
                  <label className="block text-sm mb-1">Earnout % of Purchase Price</label>
                  <input
                    type="number"
                    value={rboDeal.earnoutPercentage}
                    onChange={(e) => setRBODeal({ ...rboDeal, earnoutPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
          </div>

          {/* File Uploader */}
          <FileUploader onFilesUploaded={handleRBOFileUpload} />
        </div>

        {/* Right Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendation */}
          <div className={`rounded-xl p-6 shadow-xl border-2 ${
            rboAnalysis.recommendationType === 'keep' 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
              : rboAnalysis.recommendationType === 'flip'
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300'
              : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300'
          }`}>
            <div className="flex items-start gap-3">
              {rboAnalysis.recommendationType === 'pass' ? (
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-xl mb-2">AI Recommendation</h4>
                <p className="text-gray-700">{rboAnalysis.recommendation}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
              <div className="text-2xl">${rboAnalysis.purchasePrice.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{rboDeal.buyMultiple}x monthly residual</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Avg Monthly Residual</div>
              <div className="text-2xl">${rboAnalysis.avgMonthlyResidual.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">${rboAnalysis.annualResidual.toLocaleString()}/year</div>
            </div>
            <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
              rboAnalysis.riskScore < 30 ? 'border-green-500' :
              rboAnalysis.riskScore < 50 ? 'border-yellow-500' : 'border-red-500'
            }`}>
              <div className="text-sm text-gray-600 mb-1">Risk Score</div>
              <div className={`text-2xl ${
                rboAnalysis.riskScore < 30 ? 'text-green-600' :
                rboAnalysis.riskScore < 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>{rboAnalysis.riskScore}/100</div>
              <div className="text-xs text-gray-500 mt-1">
                {rboAnalysis.riskScore < 30 ? 'Low Risk' :
                 rboAnalysis.riskScore < 50 ? 'Moderate Risk' : 'High Risk'}
              </div>
            </div>
          </div>

          {/* Payment Structure */}
          {rboDeal.earnoutStructure && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h5 className="font-semibold mb-3">Payment Structure</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Upfront Payment</div>
                  <div className="text-xl text-blue-600">${rboAnalysis.upfrontPayment.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Earnout Payment</div>
                  <div className="text-xl text-purple-600">${rboAnalysis.earnoutAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flip Strategy */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h5 className="font-semibold">Flip Strategy</h5>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">Flip Value</div>
                  <div className="text-lg">${rboAnalysis.flipValue.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Profit</div>
                  <div className="text-lg text-green-600">${rboAnalysis.flipProfit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">ROI</div>
                  <div className={`text-2xl ${rboAnalysis.flipROI > 15 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {rboAnalysis.flipROI.toFixed(1)}%
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600">Timeline</div>
                  <div className="text-sm font-semibold">Immediate (1-3 months)</div>
                </div>
              </div>
            </div>

            {/* Keep Strategy */}
            <div className="bg-white rounded-lg shadow-md p-5">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-5 h-5 text-purple-600" />
                <h5 className="font-semibold">Keep Strategy</h5>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">3-Year Residual</div>
                  <div className="text-lg">${rboAnalysis.threeYearResidual.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Net Profit</div>
                  <div className="text-lg text-green-600">${rboAnalysis.keepNetProfit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">ROI</div>
                  <div className={`text-2xl ${rboAnalysis.keepROI > 100 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {rboAnalysis.keepROI.toFixed(1)}%
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-600">Break-Even</div>
                  <div className="text-sm font-semibold">{rboAnalysis.breakEvenMonths} months</div>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Projection */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h5 className="font-semibold mb-3">3-Year Residual Projection (Keep Strategy)</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Year 1</div>
                <div className="text-xl text-blue-600">${rboAnalysis.year1Residual.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Year 2</div>
                <div className="text-xl text-purple-600">${rboAnalysis.year2Residual.toLocaleString()}</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded">
                <div className="text-xs text-gray-600 mb-1">Year 3</div>
                <div className="text-xl text-indigo-600">${rboAnalysis.year3Residual.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              * Includes {rboDeal.attritionRate}% annual attrition rate
            </div>
          </div>

          {/* Attrition Offset Requirements */}
          {rboDeal.attritionRate > 0 && rboDeal.numAccounts > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <TrendingDown className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="font-semibold text-blue-900 mb-1">Attrition Impact & Requirements</h5>
                  <p className="text-sm text-blue-800 mb-2">
                    Based on {rboDeal.attritionRate}% annual attrition, expect to lose approximately <span className="font-bold">{rboAnalysis.requiredAccountsToOffsetAttrition} accounts per month</span>.
                  </p>
                  <p className="text-sm text-blue-800">
                    {rboDeal.buyoutType === 'exclusive' ? (
                      <>To maintain book size and exclusive status, add <span className="font-bold">{Math.max(rboAnalysis.requiredNewAccountsPerMonth, rboAnalysis.requiredAccountsToOffsetAttrition)} accounts per month</span>.</>
                    ) : (
                      <>To maintain book size, replace <span className="font-bold">{rboAnalysis.requiredAccountsToOffsetAttrition} accounts per month</span>.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Exclusive Requirements */}
          {rboDeal.buyoutType === 'exclusive' && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Target className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h5 className="font-semibold text-amber-900 mb-1">Exclusive Deal Requirements</h5>
                  <p className="text-sm text-amber-800">
                    Rep must submit <span className="font-bold">{rboAnalysis.requiredNewAccountsPerMonth} new accounts per month</span> to maintain exclusive status and earn higher multiple.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Breakdown */}
          <div className="bg-white rounded-lg shadow-md p-5">
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Risk Assessment Breakdown
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Concentration Risk</span>
                <span className={`text-sm font-semibold ${
                  rboDeal.topAccountPercentage > 30 ? 'text-red-600' : 
                  rboDeal.topAccountPercentage > 20 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {rboDeal.topAccountPercentage > 30 ? 'High' : 
                   rboDeal.topAccountPercentage > 20 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Attrition Risk</span>
                <span className={`text-sm font-semibold ${
                  rboDeal.attritionRate > 15 ? 'text-red-600' : 
                  rboDeal.attritionRate > 10 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {rboDeal.attritionRate > 15 ? 'High' : 
                   rboDeal.attritionRate > 10 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Portfolio Diversity</span>
                <span className={`text-sm font-semibold ${
                  rboDeal.numAccounts < 15 ? 'text-red-600' : 
                  rboDeal.numAccounts < 25 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {rboDeal.numAccounts < 15 ? 'Low' : 
                   rboDeal.numAccounts < 25 ? 'Medium' : 'High'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Valuation Multiple</span>
                <span className={`text-sm font-semibold ${
                  rboDeal.buyMultiple > 30 ? 'text-red-600' : 
                  rboDeal.buyMultiple > 24 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {rboDeal.buyMultiple > 30 ? 'Overvalued' : 
                   rboDeal.buyMultiple > 24 ? 'Fair' : 'Good Value'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
