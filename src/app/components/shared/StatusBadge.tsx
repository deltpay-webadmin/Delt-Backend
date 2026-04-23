import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type Status = 'Funded' | 'Pending' | 'Declined' | 'Active' | 'Inactive';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  Funded: {
    icon: CheckCircle,
    className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    label: 'Funded',
  },
  Pending: {
    icon: Clock,
    className: 'text-orange-700 bg-orange-50 border-orange-200',
    label: 'Pending',
  },
  Declined: {
    icon: XCircle,
    className: 'text-red-700 bg-red-50 border-red-200',
    label: 'Declined',
  },
  Active: {
    icon: CheckCircle,
    className: 'text-blue-700 bg-blue-50 border-blue-200',
    label: 'Active',
  },
  Inactive: {
    icon: AlertCircle,
    className: 'text-gray-700 bg-gray-50 border-gray-200',
    label: 'Inactive',
  },
};

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm min-h-[32px]',
  lg: 'px-4 py-2 text-base min-h-[44px]',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StatusBadge({ 
  status, 
  showIcon = true, 
  size = 'md',
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span 
      className={`inline-flex items-center gap-1.5 sm:gap-2 border rounded-lg ${config.className} ${sizeStyles[size]} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
}
