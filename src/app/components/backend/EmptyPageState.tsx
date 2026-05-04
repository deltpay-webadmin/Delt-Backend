import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyPageStateProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyPageState({ title, description, icon: Icon = Inbox, actionButton, secondaryAction }: EmptyPageStateProps) {
  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Page Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-[6px] hover:bg-brand-hover transition-colors"
          >
            {actionButton.label}
          </button>
        )}
      </div>

      {/* Empty State Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 mx-auto bg-brand/[0.06] rounded-full flex items-center justify-center mb-5 ring-8 ring-brand/[0.03]">
            <Icon className="w-6 h-6 text-brand" strokeWidth={1.75} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1.5">No data yet</h3>
          {description && (
            <p className="text-sm text-gray-500 mx-auto leading-relaxed">{description}</p>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="mt-5 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/5 rounded-[6px] transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
