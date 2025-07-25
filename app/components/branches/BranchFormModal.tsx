'use client';

import React, { useState, useEffect } from 'react';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/services/branchService';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBranchRequest | UpdateBranchRequest) => Promise<void>;
  branch?: Branch | null;
  isLoading?: boolean;
}

const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  branch,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    emergency_amount: 1000,
    org_company: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or branch changes
  useEffect(() => {
    if (isOpen) {
      if (branch) {
        // Edit mode - populate with existing data
        setFormData({
          name: branch.name,
          emergency_amount: branch.emergency_amount,
          org_company: branch.org_company || ''
        });
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          emergency_amount: 1000,
          org_company: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, branch]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Branch name is required';
    }

    if (formData.emergency_amount < 0) {
      newErrors.emergency_amount = 'Emergency amount must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        emergency_amount: formData.emergency_amount,
        org_company: formData.org_company.trim() || undefined
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {branch ? 'Edit Branch' : 'Create New Branch'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Branch Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter branch name"
                disabled={isLoading}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Emergency Amount */}
            <div>
              <label htmlFor="emergency_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Emergency Amount
              </label>
              <input
                type="number"
                id="emergency_amount"
                name="emergency_amount"
                value={formData.emergency_amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.emergency_amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1000.00"
                disabled={isLoading}
              />
              {errors.emergency_amount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.emergency_amount}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Default emergency fund amount for this branch
              </p>
            </div>

            {/* Organization Company */}
            <div>
              <label htmlFor="org_company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="org_company"
                name="org_company"
                value={formData.org_company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                placeholder="Company name for invoices and reports"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional: Company name to display on invoices and reports
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {branch ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                branch ? 'Update Branch' : 'Create Branch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchFormModal; 