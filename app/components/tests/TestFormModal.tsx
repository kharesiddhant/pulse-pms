'use client';

import React, { useState, useEffect } from 'react';
import { Modality, Test, BranchTest, AddTestToBranchRequest, UpdateBranchTestRequest } from '@/services/testService';

interface TestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddTestToBranchRequest | UpdateBranchTestRequest) => Promise<void>;
  modalities: Modality[];
  branchTest?: BranchTest | null;
  existingBranchTests: BranchTest[];
  isLoading?: boolean;
  mode: 'add' | 'edit';
}

const TestFormModal: React.FC<TestFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  modalities,
  branchTest,
  existingBranchTests,
  isLoading = false,
  mode
}) => {
  const [formData, setFormData] = useState({
    test_id: 0,
    price: 0
  });
  const [selectedModality, setSelectedModality] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or branchTest changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && branchTest) {
        // Edit mode - populate with existing data
        setFormData({
          test_id: branchTest.test_id,
          price: branchTest.price
        });
        // Find the modality for this test
        const modality = modalities.find(m => 
          m.tests.some(t => t.id === branchTest.test_id)
        );
        setSelectedModality(modality?.name || '');
      } else {
        // Add mode - reset to defaults
        setFormData({
          test_id: 0,
          price: 0
        });
        setSelectedModality('');
      }
      setErrors({});
    }
  }, [isOpen, branchTest, mode, modalities]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'add' && formData.test_id === 0) {
      newErrors.test_id = 'Please select a test';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
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
      if (mode === 'add') {
        await onSubmit({
          test_id: formData.test_id,
          price: formData.price
        } as AddTestToBranchRequest);
      } else {
        await onSubmit({
          price: formData.price
        } as UpdateBranchTestRequest);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : parseInt(value) || 0
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleModalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modalityName = e.target.value;
    setSelectedModality(modalityName);
    // Reset test selection when modality changes
    setFormData(prev => ({
      ...prev,
      test_id: 0
    }));
  };

  const getSelectedModalityTests = (): Test[] => {
    if (!selectedModality) return [];
    const modality = modalities.find(m => m.name === selectedModality);
    if (!modality) return [];

    // Build a set of test IDs already present in the branch
    const existingIds = new Set<number>(existingBranchTests.map(bt => bt.test_id));

    // In edit mode, allow the test currently being edited to appear in list (though not used)
    if (mode === 'edit' && branchTest) {
      existingIds.delete(branchTest.test_id);
    }

    // Return only tests not already in branch (or the one being edited)
    return modality.tests.filter(t => !existingIds.has(t.id));
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
            {mode === 'add' ? 'Add Test to Branch' : 'Update Test Price'}
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
            {mode === 'add' && (
              <>
                {/* Modality Selection */}
                <div>
                  <label htmlFor="modality" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modality *
                  </label>
                  <select
                    id="modality"
                    value={selectedModality}
                    onChange={handleModalityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    disabled={isLoading}
                    required
                  >
                    <option value="">Select a modality</option>
                    {modalities.map((modality) => (
                      <option key={modality.id} value={modality.name}>
                        {modality.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Test Selection */}
                <div>
                  <label htmlFor="test_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Test *
                  </label>
                  <select
                    id="test_id"
                    name="test_id"
                    value={formData.test_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      errors.test_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading || !selectedModality}
                    required
                  >
                    <option value={0}>Select a test</option>
                    {getSelectedModalityTests().map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.test_name}
                      </option>
                    ))}
                  </select>
                  {errors.test_id && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.test_id}</p>
                  )}
                </div>
              </>
            )}

            {mode === 'edit' && branchTest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Test
                </label>
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{branchTest.test_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{branchTest.modality_name}</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={isLoading}
                required
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the price for this test at this branch
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
                  {mode === 'add' ? 'Adding...' : 'Updating...'}
                </div>
              ) : (
                mode === 'add' ? 'Add Test' : 'Update Price'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestFormModal; 