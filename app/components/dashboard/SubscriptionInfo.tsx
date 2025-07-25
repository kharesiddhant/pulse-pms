'use client';

import React from 'react';

// Define the props for the main component
interface SubscriptionInfoProps {
  planType: 'annual' | 'half-yearly' | 'monthly';
  planStartDate: string; // ISO date string (e.g., '2024-07-15')
  planEndDate: string; // ISO date string (e.g., '2026-07-04')
}

const SubscriptionInfo = ({ planType, planStartDate, planEndDate }: SubscriptionInfoProps) => {
  // --- Style definitions for different subscription plans ---
  const planStyles = {
    annual: {
      gradient: 'bg-gradient-to-tr from-blue-500 to-blue-700',
      title: 'Annual',
    },
    'half-yearly': {
      gradient: 'bg-gradient-to-tr from-purple-500 to-purple-700',
      title: 'Half-yearly',
    },
    monthly: {
      gradient: 'bg-gradient-to-tr from-green-500 to-green-600',
      title: 'Monthly',
    },
  };

  // --- Logic to calculate remaining time and set appropriate colors ---
  const getRemainingTimeStatus = () => {
    const today = new Date();
    const startDate = new Date(planStartDate);
    const endDate = new Date(planEndDate);

    if (endDate < today) {
      return { borderColor: 'border-gray-500', textColor: 'text-gray-500 dark:text-gray-400' }; // Expired
    }

    const totalDuration = endDate.getTime() - startDate.getTime();
    const remainingTime = endDate.getTime() - today.getTime();

    if (totalDuration <= 0) {
      return { borderColor: 'border-green-500', textColor: 'text-green-600 dark:text-green-400' };
    }
    
    const percentageRemaining = (remainingTime / totalDuration) * 100;

    if (percentageRemaining > 50) {
      return { borderColor: 'border-green-500', textColor: 'text-green-600 dark:text-green-400' }; // Healthy
    } else if (percentageRemaining >= 25) {
      return { borderColor: 'border-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' }; // Warning
    } else {
      return { borderColor: 'border-red-500', textColor: 'text-red-600 dark:text-red-400' }; // Critical
    }
  };
  
  const remainingTimeStatus = getRemainingTimeStatus();

  // --- Format the end date into a more readable format ---
  const formattedEndDate = new Date(planEndDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Subscription Type Card */}
      <div className={`flex flex-col justify-center rounded-lg shadow-md p-6 text-white ${planStyles[planType].gradient}`}>
        <span className="text-xs font-semibold uppercase text-white/80 mb-1">Your subscription type</span>
        <span className="text-2xl font-bold">{planStyles[planType].title}</span>
      </div>

      {/* Subscription Ends On Card */}
      <div className={`flex flex-col justify-center bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-8 ${remainingTimeStatus.borderColor} p-6`}>
        <span className={`text-xs font-semibold uppercase ${remainingTimeStatus.textColor} mb-1`}>Your plan ends on</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{formattedEndDate}</span>
      </div>
    </div>
  );
};

// --- Skeleton Component ---
// This is a placeholder component to show while data is loading.
SubscriptionInfo.Skeleton = function SubscriptionInfoSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
      {/* Skeleton for Plan Type Card */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-[96px]">
        <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-24"></div>
      </div>
      {/* Skeleton for Plan Ends On Card */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-[96px]">
        <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-28 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded-full w-36"></div>
      </div>
    </div>
  );
};


export default SubscriptionInfo;