'use client';

import React, { useState, useEffect } from 'react';
import { Branch } from '@/services/branchService';

interface EmployeeSearchFilterProps {
  onFilterChange: (filters: EmployeeFilters) => void;
  branches: Branch[];
}

export interface EmployeeFilters {
  searchTerm: string;
  selectedType: string;
  selectedBranch: string;
}

const EMPLOYEE_TYPES = [
  'Organization Partner',
  'Branch Admin', 
  'Receptionist',
  'Reporting Doctor',
  'Home testing person'
];

const EmployeeSearchFilter: React.FC<EmployeeSearchFilterProps> = ({
  onFilterChange,
  branches
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>({
    searchTerm: '',
    selectedType: '',
    selectedBranch: ''
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, searchTerm: e.target.value };
    setFilters(newFilters);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = { ...filters, selectedType: e.target.value };
    setFilters(newFilters);
  };

  const handleBranchSelect = (branchId: string) => {
    const selectedBranch = branchId === filters.selectedBranch ? '' : branchId;
    const newFilters = { ...filters, selectedBranch };
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { searchTerm: '', selectedType: '', selectedBranch: '' };
    setFilters(newFilters);
  };

  const hasActiveFilters = filters.searchTerm || filters.selectedType || filters.selectedBranch;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.selectedType) count++;
    if (filters.selectedBranch) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
          className="input-field pl-10 pr-4 py-3 text-sm placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Employee Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter by Type
          </label>
          <select
            value={filters.selectedType}
            onChange={handleTypeChange}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors duration-200"
          >
            <option value="">All Types</option>
            {EMPLOYEE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Filter by Branch
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {branches.length > 0 ? (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch.id.toString())}
                  className={`w-full text-left px-4 py-2 text-sm rounded-lg border transition-colors duration-200 ${
                    filters.selectedBranch === branch.id.toString()
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {branch.name}
                </button>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">No branches available</div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Filters ({getActiveFiltersCount()}):
          </span>
          
          {filters.searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Search: &quot;{filters.searchTerm}&quot;
              <button
                onClick={() => handleSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.selectedType && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Type: {filters.selectedType}
              <button
                onClick={() => setFilters({ ...filters, selectedType: '' })}
                className="ml-2 text-green-600 hover:text-green-800 dark:text-green-300 dark:hover:text-green-100"
              >
                ×
              </button>
            </span>
          )}
          
          {filters.selectedBranch && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Branch: {branches.find(b => b.id.toString() === filters.selectedBranch)?.name || 'Unknown'}
              <button
                onClick={() => handleBranchSelect(filters.selectedBranch)}
                className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-100"
              >
                ×
              </button>
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeSearchFilter; 