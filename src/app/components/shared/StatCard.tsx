import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'blue' | 'purple' | 'red' | 'orange' | 'gray';
  className?: string;
}

const variantStyles = {
  emerald: 'bg-emerald-50 border-emerald-100',
  blue: 'bg-blue-50 border-blue-100',
  purple: 'bg-purple-50 border-purple-100',
  red: 'bg-red-50 border-red-100',
  orange: 'bg-orange-50 border-orange-100',
  gray: 'bg-gray-50 border-gray-100',
};

const textVariantStyles = {
  emerald: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
  gray: 'text-gray-600',
};

export function StatCard({ 
  label, 
  value, 
  icon, 
  trend, 
  variant = 'gray',
  className = ''
}: StatCardProps) {
  return (
    <div className={`${variantStyles[variant]} border rounded-xl p-4 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm sm:text-base text-gray-600">{label}</p>
        {icon && (
          <div className={`${textVariantStyles[variant]}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`text-2xl sm:text-3xl lg:text-4xl ${textVariantStyles[variant]} font-bold`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend && (
        <p className={`text-sm mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend.value}
        </p>
      )}
    </div>
  );
}
