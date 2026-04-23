import React, { useState, useEffect } from 'react';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { BulkPaymentUpload } from './BulkPaymentUpload';
import { Filter, Plus, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, Edit2, Trash2, Upload } from 'lucide-react';
import { getAllDeals, deleteDeal } from '../utils/api';
import { toast } from 'sonner';

export interface Deal {
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
  // New fields from Analyze Deal section
  residualMonth1?: number;
  residualMonth2?: number;
  residualMonth3?: number;
  borrowingCostPerMonth?: number;
  originationFee?: number;
  originationFeePercentage?: number;
  originationFeeReason?: string;
  loanToIncomeRatio?: number;
  loanPercentage?: number;
  creditScore?: number;
  industry?: string;
  yearsInBusiness?: number;
  factorRate?: string;
  termLength?: number;
  termUnit?: 'months' | 'weeks';
  paymentSchedule?: string;
  apr?: number;
  deltPayRetainedPercentage?: number;
  repCommissionAmount?: number;
  repCommissionPercentage?: number;
  repCommissionType?: 'profit' | 'loan';
  dealBroughtByRep?: boolean;
  repFirstName?: string;
  repLastName?: string;
  files?: Array<{ name: string; url: string; uploadedAt: string }>;
  paymentHistory?: Array<{ date: string; amount: number; principalAmount?: number; interestAmount?: number }>;
  monthlyPaymentOverrides?: Record<string, number>;
  principalPaidOverrides?: Record<string, number>;
  repCommissionOverrides?: Record<string, number>;
  additionalMonths?: number;
}

interface DealDashboardProps {
  onNewDeal?: () => void;
  onEditDeal?: (deal: Deal) => void;
}

export function DealDashboard({ onNewDeal, onEditDeal }: DealDashboardProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Funded' | 'Pending' | 'Declined'>('All');
  const [filterDealType, setFilterDealType] = useState<'All' | 'MCA' | 'Lease Commissions' | 'Residual Income'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Load deals from Supabase on mount
  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const result = await getAllDeals();
    if (result.success && result.deals) {
      setDeals(result.deals);
    } else {
      // If no deals in database, show empty state
      setDeals([]);
      // Show error if it's a database issue
      if (result.error && result.error.includes('kv_store_e3e3d1af')) {
        toast.error('Database table not found. Please create the kv_store_e3e3d1af table in Supabase.', {
          duration: 10000,
          description: 'Check browser console and server logs for SQL instructions.'
        });
        console.error('❌ DATABASE SETUP REQUIRED');
        console.error('The kv_store_e3e3d1af table needs to be created in Supabase.');
        console.error('');
        console.error('📋 SETUP INSTRUCTIONS:');
        console.error('1. Go to: https://supabase.com/dashboard/project/ijnyaweoexjqptzilwvy/editor');
        console.error('2. Click "SQL Editor" in the left sidebar');
        console.error('3. Copy and run this SQL:');
        console.error('');
        console.error('CREATE TABLE IF NOT EXISTS kv_store_e3e3d1af (');
        console.error('  key TEXT NOT NULL PRIMARY KEY,');
        console.error('  value JSONB NOT NULL');
        console.error(');');
        console.error('');
        console.error('4. Refresh this page after creating the table');
      }
    }
    setLoading(false);
  };

  // Apply both status and deal type filters
  let filteredDeals = deals;
  
  if (filterStatus !== 'All') {
    filteredDeals = filteredDeals.filter(deal => deal.status === filterStatus);
  }
  
  if (filterDealType !== 'All') {
    filteredDeals = filteredDeals.filter(deal => deal.dealType === filterDealType);
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

  const totalFunded = deals.filter(d => d.status === 'Funded').length;
  const totalLoanAmount = deals.reduce((sum, d) => sum + d.loanAmountReceived, 0);
  const totalProfit = deals.reduce((sum, d) => sum + d.grossProfit, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Funded': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Declined': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Funded': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Pending': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Declined': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      setDealToDelete({ id: dealId, name: deal.borrower });
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;

    const result = await deleteDeal(dealToDelete.id);
    if (result.success) {
      // Remove from local state
      setDeals(prev => prev.filter(d => d.id !== dealToDelete.id));
      setDeleteModalOpen(false);
      setDealToDelete(null);
    } else {
      alert('❌ Failed to delete deal: ' + result.error);
      setDeleteModalOpen(false);
      setDealToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDealToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl mb-2">All Deals</h1>
          <p className="text-sm sm:text-base text-gray-600">Track and manage all MCA loan deals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>
          <button
            onClick={onNewDeal}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-600 mb-1">Total Funded Deals</p>
          <p className="text-2xl sm:text-3xl text-emerald-600">{totalFunded}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-600 mb-1">Total Loan Amount</p>
          <p className="text-2xl sm:text-3xl text-blue-600">${totalLoanAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <p className="text-sm text-gray-600 mb-1">Total Gross Profit</p>
          <p className="text-2xl sm:text-3xl text-purple-600">${totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="space-y-3">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-700">Filter by Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Funded', 'Pending', 'Declined'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-emerald-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {status}
                  {status !== 'All' && (
                    <span className="ml-2 text-xs opacity-75">
                      ({deals.filter(d => d.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Deal Type Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
            <span className="font-semibold text-gray-700">Filter by Type:</span>
            <div className="flex flex-wrap gap-2">
              {(['All', 'MCA', 'Lease Commissions', 'Residual Income'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterDealType(type);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterDealType === type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                  {type !== 'All' && (
                    <span className="ml-2 text-xs opacity-75">
                      ({deals.filter(d => d.dealType === type).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Deal Type</th>
                <th className="text-left py-3 px-4">Borrower</th>
                <th className="text-right py-3 px-4">Loan Amount</th>
                <th className="text-right py-3 px-4">Repayment</th>
                <th className="text-right py-3 px-4">Interest</th>
                <th className="text-right py-3 px-4">Gross Profit</th>
                <th className="text-left py-3 px-4">Issuer</th>
                <th className="text-center py-3 px-4">Term</th>
                <th className="text-center py-3 px-4">Due Date</th>
                <th className="text-center py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedDeals.map(deal => (
                <tr 
                  key={deal.id} 
                  onClick={() => onEditDeal?.(deal)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${getStatusColor(deal.status)}`}>
                      {getStatusIcon(deal.status)}
                      <span>{deal.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {deal.dealType ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {deal.dealType}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{deal.borrower}</td>
                  <td className="py-3 px-4 text-right">${(deal.loanAmountReceived || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">${(deal.repaymentAmountDue || 0).toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">{deal.grossInterest || 0}%</td>
                  <td className="py-3 px-4 text-right text-emerald-700">${(deal.grossProfit || 0).toLocaleString()}</td>
                  <td className="py-3 px-4">{deal.issuer || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    {deal.borrowTermMonths 
                      ? `${deal.borrowTermMonths}${deal.termUnit === 'weeks' ? ' weeks' : 'mo'}` 
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {deal.dueDate ? new Date(deal.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditDeal?.(deal);
                        }}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit deal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDeal(deal.id);
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete deal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredDeals.length)} of {filteredDeals.length} deals
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600">Per page:</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {filteredDeals.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No deals found matching your filters</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        dealName={dealToDelete?.name || 'this deal'}
        onConfirm={confirmDelete}
        onClose={cancelDelete}
      />

      {/* Bulk Upload Modal */}
      <BulkPaymentUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onPaymentsProcessed={(results) => {
          const successCount = results.filter(r => r.processed).length;
          if (successCount > 0) {
            toast.success(`Successfully processed ${successCount} payment(s)!`);
            loadDeals(); // Refresh deals list
          }
        }}
      />
    </div>
  );
}
