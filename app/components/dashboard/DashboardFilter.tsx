'use client';

import React, { useState, useEffect } from 'react';
import { dashboardService, Branch, DashboardParams } from '@/services/dashboardService';

interface DashboardFilterProps {
  onFilterChange?: (params: DashboardParams) => void;
}

const DashboardFilter = ({ onFilterChange }: DashboardFilterProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('lifetime');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching dashboard data...');
        
        const response = await dashboardService.getDashboardData();
        console.log('Dashboard data received:', response);
        
        if (response.success) {
          setBranches(response.data.branches);
          // Set the first branch as default if available
          if (response.data.branches.length > 0) {
            const firstBranchId = response.data.branches[0].id.toString();
            setSelectedBranch(firstBranchId);
            // Notify parent of initial selection
            onFilterChange?.({
              branch_id: response.data.branches[0].id,
              period: selectedPeriod as DashboardParams['period']
            });
          }
          console.log('Branches set successfully:', response.data.branches);
        } else {
          const errorMsg = response.message || 'Failed to fetch dashboard data';
          console.error('API returned error:', errorMsg);
          setError(errorMsg);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching dashboard data:', err);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [onFilterChange, selectedPeriod]);

  const handleBranchChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newBranchId = event.target.value;
    setSelectedBranch(newBranchId);
    
    // Notify parent of the change
    onFilterChange?.({
      branch_id: newBranchId ? parseInt(newBranchId) : undefined,
      period: selectedPeriod as DashboardParams['period']
    });
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = event.target.value;
    setSelectedPeriod(newPeriod);
    
    // Notify parent of the change
    onFilterChange?.({
      branch_id: selectedBranch ? parseInt(selectedBranch) : undefined,
      period: newPeriod as DashboardParams['period']
    });
  };

  if (error) {
    console.log('Rendering error state:', error);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex-grow md:flex-grow-0">
        <select 
          value={selectedBranch}
          onChange={handleBranchChange}
          disabled={isLoading}
          className="min-w-[200px] md:min-w-[240px] w-full md:w-auto py-3 px-4 text-base bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        >
          {isLoading ? (
            <option>Loading branches...</option>
          ) : error ? (
            <option>Error: {error}</option>
          ) : branches.length === 0 ? (
            <option>No branches available</option>
          ) : (
            branches.map((branch) => (
              <option key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="flex-grow md:flex-grow-0">
        <select 
          value={selectedPeriod}
          onChange={handlePeriodChange}
          className="min-w-[200px] md:min-w-[240px] w-full md:w-auto py-3 px-4 text-base bg-gray-50 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        >
          <option value="lifetime">Lifetime</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </div>
  );
};

export default DashboardFilter; 