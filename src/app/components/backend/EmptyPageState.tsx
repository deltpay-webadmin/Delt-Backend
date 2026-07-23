import React from 'react';

interface EmptyPageStateProps {
  title: string;
  description?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyPageState({ title, description, actionButton }: EmptyPageStateProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[8px] hover:bg-brand-hover transition-colors"
          >
            {actionButton.label}
          </button>
        )}
      </div>

      {/* Empty State Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data yet</h3>
          {description && (
            <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
