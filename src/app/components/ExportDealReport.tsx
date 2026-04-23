import React from 'react';
import { Download, FileText } from 'lucide-react';

interface ExportDealReportProps {
  deal: any;
}

export function ExportDealReport({ deal }: ExportDealReportProps) {
  const exportToPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Deal Report - ${deal.dealName || deal.borrower}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1f2937;
          }
          .header {
            border-bottom: 3px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 5px;
          }
          h1 {
            font-size: 28px;
            margin: 10px 0;
            color: #111827;
          }
          h2 {
            font-size: 20px;
            margin: 25px 0 15px 0;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          .info-item {
            padding: 15px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            font-size: 13px;
          }
          td {
            font-size: 14px;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
          }
          .status-funded {
            background: #d1fae5;
            color: #065f46;
          }
          .status-pending {
            background: #fed7aa;
            color: #92400e;
          }
          .status-declined {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .highlight {
            background: #dbeafe;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }
          .text-right {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Delt Pay</div>
          <h1>Deal Report</h1>
          <p style="color: #6b7280; margin: 5px 0;">Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>

        <h2>Deal Overview</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Deal Name</div>
            <div class="info-value">${deal.dealName || deal.borrower}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status status-${deal.status.toLowerCase()}">${deal.status}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Merchant</div>
            <div class="info-value">${deal.borrower}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Industry</div>
            <div class="info-value">${deal.industry || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Loan Amount Received</div>
            <div class="info-value">$${(deal.loanAmountReceived || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Repayment Amount Due</div>
            <div class="info-value">$${(deal.repaymentAmountDue || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Factor Rate</div>
            <div class="info-value">${deal.factorRate || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Term Length</div>
            <div class="info-value">${deal.termLength || 'N/A'} months</div>
          </div>
        </div>

        <h2>Financial Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Gross Revenue</div>
            <div class="info-value">$${(deal.grossRevenue || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Cost to Issuer</div>
            <div class="info-value">$${(deal.costToIssuer || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Gross Profit</div>
            <div class="info-value">$${(deal.grossProfit || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Sales Rep Commission</div>
            <div class="info-value">$${(deal.srCommission || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Net Profit</div>
            <div class="info-value">$${(deal.netProfit || 0).toLocaleString()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">APR</div>
            <div class="info-value">${(deal.apr || 0).toFixed(2)}%</div>
          </div>
        </div>

        ${deal.paymentHistory && deal.paymentHistory.length > 0 ? `
        <h2>Payment History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Method</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Principal</th>
              <th class="text-right">Factor Rate</th>
            </tr>
          </thead>
          <tbody>
            ${deal.paymentHistory.map((payment: any) => `
              <tr>
                <td>${new Date(payment.date).toLocaleDateString()}</td>
                <td>${payment.method}</td>
                <td class="text-right">$${payment.amount.toLocaleString()}</td>
                <td class="text-right">$${(payment.principalAmount || 0).toLocaleString()}</td>
                <td class="text-right">$${(payment.factorRateAmount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
            <tr style="font-weight: 600; background: #f9fafb;">
              <td colspan="2">Total</td>
              <td class="text-right">$${deal.paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}</td>
              <td class="text-right">$${deal.paymentHistory.reduce((sum: number, p: any) => sum + (p.principalAmount || 0), 0).toLocaleString()}</td>
              <td class="text-right">$${deal.paymentHistory.reduce((sum: number, p: any) => sum + (p.factorRateAmount || 0), 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        ` : ''}

        ${deal.profitShares && deal.profitShares.length > 0 ? `
        <h2>Profit Distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Recipient</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${deal.profitShares.map((share: any) => `
              <tr>
                <td>${share.name}</td>
                <td class="text-right">$${share.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${deal.monthlyDeployment && deal.monthlyDeployment.length > 0 ? `
        <h2>Monthly Deployment Schedule</h2>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Merchant Payment</th>
              <th class="text-right">Principal Reduction</th>
              <th class="text-right">Factor Income</th>
              <th class="text-right">Net Profit</th>
              <th class="text-right">Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${deal.monthlyDeployment.map((month: any) => `
              <tr>
                <td>Month ${month.month}</td>
                <td class="text-right">$${month.merchantPayment.toLocaleString()}</td>
                <td class="text-right">$${month.principalReduction.toLocaleString()}</td>
                <td class="text-right">$${month.factorIncome.toLocaleString()}</td>
                <td class="text-right">$${month.monthlyNetProfit.toLocaleString()}</td>
                <td class="text-right">$${month.remainingBalance.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          <p>This report was generated by Delt Pay MCA Tracking Platform</p>
          <p>For internal use only - Confidential</p>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-report-${deal.dealName || deal.borrower}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    let csv = 'Deal Report\n\n';
    
    // Overview
    csv += 'DEAL OVERVIEW\n';
    csv += `Deal Name,${deal.dealName || deal.borrower}\n`;
    csv += `Status,${deal.status}\n`;
    csv += `Merchant,${deal.borrower}\n`;
    csv += `Industry,${deal.industry || 'N/A'}\n`;
    csv += `Loan Amount Received,$${(deal.loanAmountReceived || 0).toLocaleString()}\n`;
    csv += `Repayment Amount Due,$${(deal.repaymentAmountDue || 0).toLocaleString()}\n`;
    csv += `Factor Rate,${deal.factorRate || 'N/A'}\n`;
    csv += `Term Length,${deal.termLength || 'N/A'} months\n\n`;

    // Financial Details
    csv += 'FINANCIAL DETAILS\n';
    csv += `Gross Revenue,$${(deal.grossRevenue || 0).toLocaleString()}\n`;
    csv += `Cost to Issuer,$${(deal.costToIssuer || 0).toLocaleString()}\n`;
    csv += `Gross Profit,$${(deal.grossProfit || 0).toLocaleString()}\n`;
    csv += `Sales Rep Commission,$${(deal.srCommission || 0).toLocaleString()}\n`;
    csv += `Net Profit,$${(deal.netProfit || 0).toLocaleString()}\n`;
    csv += `APR,${(deal.apr || 0).toFixed(2)}%\n\n`;

    // Payment History
    if (deal.paymentHistory && deal.paymentHistory.length > 0) {
      csv += 'PAYMENT HISTORY\n';
      csv += 'Date,Method,Amount,Principal,Factor Rate\n';
      deal.paymentHistory.forEach((payment: any) => {
        csv += `${new Date(payment.date).toLocaleDateString()},${payment.method},$${payment.amount.toLocaleString()},$${(payment.principalAmount || 0).toLocaleString()},$${(payment.factorRateAmount || 0).toLocaleString()}\n`;
      });
      csv += '\n';
    }

    // Monthly Deployment
    if (deal.monthlyDeployment && deal.monthlyDeployment.length > 0) {
      csv += 'MONTHLY DEPLOYMENT SCHEDULE\n';
      csv += 'Month,Merchant Payment,Principal Reduction,Factor Income,Net Profit,Remaining Balance\n';
      deal.monthlyDeployment.forEach((month: any) => {
        csv += `Month ${month.month},$${month.merchantPayment.toLocaleString()},$${month.principalReduction.toLocaleString()},$${month.factorIncome.toLocaleString()},$${month.monthlyNetProfit.toLocaleString()},$${month.remainingBalance.toLocaleString()}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-report-${deal.dealName || deal.borrower}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        title="Export as PDF (HTML)"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
        title="Export as CSV"
      >
        <FileText className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );
}
