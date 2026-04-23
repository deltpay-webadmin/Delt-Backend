import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { getDeal, updateDeal } from '../utils/api';

interface BulkPaymentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentsProcessed?: (results: any[]) => void;
}

interface ParsedPayment {
  dealId: string;
  dealName: string;
  amount: number;
  date: string;
  method: string;
  principalAmount?: number;
  factorRateAmount?: number;
  note?: string;
  status?: 'success' | 'error';
  error?: string;
}

export function BulkPaymentUpload({ isOpen, onClose, onPaymentsProcessed }: BulkPaymentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedPayments, setParsedPayments] = useState<ParsedPayment[]>([]);
  const [processing, setProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const template = `Deal ID,Deal Name,Payment Amount,Payment Date,Payment Method,Principal Amount,Factor Rate Amount,Note
deal_123,John's Restaurant,5000,2025-01-05,ACH,4250,750,Monthly payment
deal_456,Jane's Retail,3500,2025-01-05,Wire,2975,525,Regular payment`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-payment-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const text = await file.text();
    const rows = text.split('\n').filter(row => row.trim());
    
    if (rows.length < 2) {
      alert('CSV file must contain header row and at least one payment row');
      return;
    }

    const headers = rows[0].split(',').map(h => h.trim());
    const payments: ParsedPayment[] = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim());
      
      try {
        const payment: ParsedPayment = {
          dealId: values[0] || '',
          dealName: values[1] || '',
          amount: parseFloat(values[2]) || 0,
          date: values[3] || new Date().toISOString().split('T')[0],
          method: values[4] || 'ACH',
          principalAmount: values[5] ? parseFloat(values[5]) : undefined,
          factorRateAmount: values[6] ? parseFloat(values[6]) : undefined,
          note: values[7] || '',
        };

        // Validate
        if (!payment.dealId) {
          payment.status = 'error';
          payment.error = 'Missing Deal ID';
        } else if (payment.amount <= 0) {
          payment.status = 'error';
          payment.error = 'Invalid payment amount';
        } else {
          payment.status = 'success';
        }

        payments.push(payment);
      } catch (error) {
        payments.push({
          dealId: values[0] || `Row ${i + 1}`,
          dealName: values[1] || 'Unknown',
          amount: 0,
          date: '',
          method: '',
          status: 'error',
          error: 'Failed to parse row'
        });
      }
    }

    setParsedPayments(payments);
  };

  const handleProcessPayments = async () => {
    setProcessing(true);
    const results: any[] = [];

    for (const payment of parsedPayments) {
      if (payment.status === 'error') {
        results.push({
          ...payment,
          processed: false,
          message: payment.error
        });
        continue;
      }

      try {
        // Get the deal
        const dealResult = await getDeal(payment.dealId);
        
        if (!dealResult.success || !dealResult.deal) {
          results.push({
            ...payment,
            processed: false,
            message: 'Deal not found'
          });
          continue;
        }

        const deal = dealResult.deal;
        
        // Add payment to history
        const newPayment = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: payment.date,
          amount: payment.amount,
          method: payment.method,
          principalAmount: payment.principalAmount,
          factorRateAmount: payment.factorRateAmount,
          note: payment.note
        };

        const updatedPaymentHistory = [...(deal.paymentHistory || []), newPayment];

        // Update the deal
        const updateResult = await updateDeal(payment.dealId, {
          paymentHistory: updatedPaymentHistory
        });

        if (updateResult.success) {
          results.push({
            ...payment,
            processed: true,
            message: 'Payment added successfully'
          });
        } else {
          results.push({
            ...payment,
            processed: false,
            message: 'Failed to update deal'
          });
        }
      } catch (error) {
        results.push({
          ...payment,
          processed: false,
          message: `Error: ${error}`
        });
      }
    }

    setUploadResults(results);
    setShowResults(true);
    setProcessing(false);
    onPaymentsProcessed && onPaymentsProcessed(results);
  };

  const handleClose = () => {
    setFile(null);
    setParsedPayments([]);
    setUploadResults([]);
    setShowResults(false);
    onClose();
  };

  const successCount = uploadResults.filter(r => r.processed).length;
  const errorCount = uploadResults.filter(r => !r.processed).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl">Bulk Payment Upload</h2>
              <p className="text-sm text-gray-600">Upload multiple payments at once via CSV</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showResults ? (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-900 mb-2">
                      First time uploading? Download our CSV template to get started.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-sm mb-2">Upload CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 mb-1">Click to upload CSV file</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </label>
                </div>
                {file && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-gray-400">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>

              {/* Preview Parsed Payments */}
              {parsedPayments.length > 0 && (
                <div>
                  <h3 className="mb-3">Preview ({parsedPayments.length} payments)</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Status</th>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Deal ID</th>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Deal Name</th>
                            <th className="text-right py-3 px-4 text-xs text-gray-600">Amount</th>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Date</th>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Method</th>
                            <th className="text-left py-3 px-4 text-xs text-gray-600">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {parsedPayments.map((payment, index) => (
                            <tr key={index} className={payment.status === 'error' ? 'bg-red-50' : ''}>
                              <td className="py-3 px-4">
                                {payment.status === 'success' ? (
                                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </td>
                              <td className="py-3 px-4">{payment.dealId}</td>
                              <td className="py-3 px-4">{payment.dealName}</td>
                              <td className="py-3 px-4 text-right">${payment.amount.toLocaleString()}</td>
                              <td className="py-3 px-4">{payment.date}</td>
                              <td className="py-3 px-4">{payment.method}</td>
                              <td className="py-3 px-4 text-xs text-gray-500">
                                {payment.status === 'error' ? (
                                  <span className="text-red-600">{payment.error}</span>
                                ) : (
                                  payment.note
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                    <div>
                      <p className="text-2xl text-emerald-900">{successCount}</p>
                      <p className="text-sm text-emerald-700">Successful</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-2xl text-red-900">{errorCount}</p>
                      <p className="text-sm text-red-700">Failed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div>
                <h3 className="mb-3">Detailed Results</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-600">Deal ID</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-600">Amount</th>
                          <th className="text-left py-3 px-4 text-xs text-gray-600">Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {uploadResults.map((result, index) => (
                          <tr key={index} className={result.processed ? 'bg-emerald-50' : 'bg-red-50'}>
                            <td className="py-3 px-4">
                              {result.processed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </td>
                            <td className="py-3 px-4">{result.dealId}</td>
                            <td className="py-3 px-4">${result.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-xs">
                              {result.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          {!showResults ? (
            <>
              <p className="text-sm text-gray-500">
                {parsedPayments.length > 0 && (
                  <>
                    Ready to upload {parsedPayments.filter(p => p.status === 'success').length} valid payments
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessPayments}
                  disabled={parsedPayments.length === 0 || processing || parsedPayments.filter(p => p.status === 'success').length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    'Process Payments'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                Upload complete. {successCount} payments added successfully.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}