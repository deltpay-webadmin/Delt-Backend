import React from 'react';
import { X, CheckCircle } from 'lucide-react';

interface DealTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTypes: Array<'MCA' | 'Residual Income' | 'Lease Commissions'>;
  onToggleType: (type: 'MCA' | 'Residual Income' | 'Lease Commissions') => void;
  onConfirm: () => void;
}

export function DealTypeSelectionModal({ 
  isOpen, 
  onClose, 
  selectedTypes, 
  onToggleType, 
  onConfirm 
}: DealTypeSelectionModalProps) {
  if (!isOpen) return null;

  const dealTypes: Array<{ type: 'MCA' | 'Residual Income' | 'Lease Commissions'; label: string; description: string }> = [
    { 
      type: 'MCA', 
      label: 'MCA Loan', 
      description: 'Merchant Cash Advance with loan amount and payback terms' 
    },
    { 
      type: 'Residual Income', 
      label: 'Residual Income', 
      description: 'Recurring monthly income from card processing' 
    },
    { 
      type: 'Lease Commissions', 
      label: 'Lease Commissions', 
      description: 'Equipment lease with upfront and monthly commissions' 
    },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Backdrop with blur effect - keep navigation clear, blur content behind */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      
      {/* Modal content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Select Deal Types to Initiate</h3>
            <p className="text-sm text-gray-600 mt-1">Choose which deals to push to Pending</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          {dealTypes.map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedTypes.includes(type)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedTypes.includes(type)
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white'
                }`}>
                  {selectedTypes.includes(type) && (
                    <CheckCircle className="w-4 h-4 text-white fill-current" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                </div>
              </div>
            </button>
          ))}

          {selectedTypes.length === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              ⚠️ Please select at least one deal type to continue
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedTypes.length > 0 ? (
              <span className="font-medium text-green-600">{selectedTypes.length} deal{selectedTypes.length > 1 ? 's' : ''} selected</span>
            ) : (
              <span>No deals selected</span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={selectedTypes.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedTypes.length > 0
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Initiate {selectedTypes.length > 0 ? `${selectedTypes.length} Deal${selectedTypes.length > 1 ? 's' : ''}` : 'Deals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}