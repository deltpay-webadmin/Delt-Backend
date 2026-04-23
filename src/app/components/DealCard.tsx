import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User, DollarSign, Calendar, Percent, Building2, TrendingUp, GripVertical, Trash2, Edit } from 'lucide-react';
import type { Deal } from './DealDashboard';

interface DealCardProps {
  deal: Deal;
  onDragStart?: (e: React.DragEvent, dealId: string) => void;
  onDelete?: (dealId: string) => void;
  onEdit?: (dealId: string) => void;
}

export function DealCard({ deal, onDragStart, onDelete, onEdit }: DealCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, deal.id)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-move"
    >
      {/* Status Badge with Drag Handle */}
      <div
        className={`px-4 py-2 text-sm flex items-center justify-between ${
          deal.status === 'Funded'
            ? 'bg-green-100 text-green-700'
            : deal.status === 'Pending'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{deal.status}</span>
          {deal.dealType && (
            <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs font-medium">
              {deal.dealType}
            </span>
          )}
        </div>
        {onDragStart && <GripVertical className="w-4 h-4 opacity-50" />}
      </div>

      <div className="p-6">
        {/* Loan Summary - Always Visible */}
        <div className={!expanded ? 'mb-0' : 'mb-4 pb-4 border-b border-gray-100'}>
          <h3 className="text-sm text-gray-600 mb-3">Loan Summary</h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Borrower</span>
              <span className="ml-auto font-medium">{deal.borrower}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Loan Amount</span>
              <span className="font-mono font-semibold">${deal.loanAmountReceived.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Repayment Due</span>
              <span className="font-mono font-semibold">${deal.repaymentAmountDue.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Gross Interest</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                {deal.grossInterest}%
              </span>
            </div>

            {deal.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Due Date</span>
                <span className="ml-auto font-medium">{deal.dueDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Schedule - Expanded Only */}
        {expanded && (deal.payments || deal.monthlyPayments) && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-sm text-gray-600 mb-3">Payment Schedule</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {deal.payments?.map((payment, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment {payment.date}</span>
                  <span className="font-mono">${payment.amount.toLocaleString()}</span>
                </div>
              ))}
              {deal.monthlyPayments?.map((payment, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">Month {payment.month}</span>
                  <span className="font-mono">${payment.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost of Money - Expanded Only */}
        {expanded && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <h3 className="text-sm text-gray-600 mb-3">Cost of Money</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Issuer</span>
                <span className="ml-auto">{deal.issuer}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount Issued</span>
                <span className="font-mono">${deal.amountIssued.toLocaleString()}</span>
              </div>

              {deal.borrowTermMonths && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Borrow Term (Months)</span>
                  <span>{deal.borrowTermMonths}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daily Default Rate</span>
                <span>{deal.dailyDefaultRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Profit Distribution - Expanded Only */}
        {expanded && (
          <div className="mb-4">
            <h3 className="text-sm text-gray-600 mb-3">Profit Distribution</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Gross Revenue (Delt Pay)</span>
                <span className="font-mono">${(deal.grossRevenue || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cost (To {deal.issuer})</span>
                <span className="font-mono">${(deal.costToIssuer || 0).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gross Profit</span>
                <span className="font-mono text-green-600">${(deal.grossProfit || 0).toLocaleString()}</span>
              </div>

              {(deal.srCommission || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">SR Commission</span>
                  <span className="font-mono">${(deal.srCommission || 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm font-semibold">Net Profit (Delt Pay)</span>
                <span className="font-mono text-emerald-600 font-semibold">${(deal.netProfit || 0).toLocaleString()}</span>
              </div>

              {(deal.profitShares || []).map((share, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-sm text-gray-600">{share.name}</span>
                  <span className="font-mono">${share.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 py-2 transition-colors border-t border-gray-100 mt-4"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show More Details
            </>
          )}
        </button>

        {/* Delete and Edit Buttons */}
        <div className="flex justify-between mt-4">
          {onDelete && (
            <button
              onClick={() => onDelete(deal.id)}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(deal.id)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}