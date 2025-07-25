import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  isLoading?: boolean;
  formatAsCurrency?: boolean;
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue', 
  isLoading = false,
  formatAsCurrency = false 
}: StatCardProps) => {
  const formatValue = (val: string | number) => {
    if (formatAsCurrency && typeof val === 'number') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val;
  };

  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
  };
  
  // Defines a subtle gradient background on hover based on the card's color
  const gradientHoverClasses = {
    blue: 'hover:bg-gradient-to-r hover:from-blue-50',
    green: 'hover:bg-gradient-to-r hover:from-green-50',
    yellow: 'hover:bg-gradient-to-r hover:from-yellow-50',
    red: 'hover:bg-gradient-to-r hover:from-red-50',
    purple: 'hover:bg-gradient-to-r hover:from-purple-50',
    indigo: 'hover:bg-gradient-to-r hover:from-indigo-50',
  };

  return (
    // Added transition, transform, and hover classes for a smooth, interactive effect
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${gradientHoverClasses[color]} dark:hover:bg-gray-700/50`}>
      <div className="flex items-center">
        {icon && (
          <div className={`mr-4 ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          {isLoading ? (
            <div className="mt-2 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>
              {formatValue(value)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;