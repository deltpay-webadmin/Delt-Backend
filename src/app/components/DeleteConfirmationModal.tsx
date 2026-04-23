import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  dealName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  dealName, 
  onConfirm, 
  onClose 
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Warning Icon */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Deal</h2>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6 ml-16">
            <p className="text-gray-900 mb-4">
              Are you sure you want to delete <span className="font-semibold">{dealName}</span>?
            </p>
            
            <div className="text-sm text-gray-600 mb-2">
              This action cannot be undone and will permanently remove:
            </div>
            
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>All deal information</li>
              <li>Payment schedules</li>
              <li>Profit calculations</li>
            </ul>
            
            <p className="text-sm text-gray-500 mt-4">
              Click OK to confirm deletion.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}