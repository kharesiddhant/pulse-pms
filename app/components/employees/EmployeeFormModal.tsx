'use client';

import React, { useState, useEffect } from 'react';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest, employeeService } from '@/services/employeeService';
import { branchService, Branch } from '@/services/branchService';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
  isEdit?: boolean;
}

interface EmployeeFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  type: string;
  branches_under: number[];
}

const EMPLOYEE_TYPES = [
  'Organization Partner',
  'Branch Admin', 
  'Receptionist',
  'Reporting Doctor',
  'Home testing person'
];

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
  isEdit = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    type: '',
    branches_under: []
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dropdown states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  // Reset form when modal opens/closes or employee changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && employee) {
        setFormData({
          name: employee.name,
          email: employee.email,
          password: '',
          confirmPassword: '',
          type: employee.type,
          branches_under: employee.branches.map(b => b.id)
        });
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          type: '',
          branches_under: []
        });
      }
      setError(null);
    }
  }, [isOpen, employee, isEdit]);

  // Fetch branches on component mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoading(true);
        const branchData = await branchService.getBranches();
        setBranches(branchData);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
        setError('Failed to load branches');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      // Reset branches if type doesn't require them
      branches_under: needsBranches(type) ? prev.branches_under : []
    }));
    setTypeDropdownOpen(false);
  };

  const handleBranchToggle = (branchId: number) => {
    const currentType = formData.type;
    
    setFormData(prev => {
      let newBranches: number[];
      
      if (currentType === 'Branch Admin' || currentType === 'Receptionist') {
        // Single branch only
        newBranches = prev.branches_under.includes(branchId) ? [] : [branchId];
      } else {
        // Multiple branches allowed
        newBranches = prev.branches_under.includes(branchId)
          ? prev.branches_under.filter(id => id !== branchId)
          : [...prev.branches_under, branchId];
      }
      
      return {
        ...prev,
        branches_under: newBranches
      };
    });
  };

  const needsBranches = (type: string): boolean => {
    return ['Organization Partner', 'Branch Admin', 'Receptionist'].includes(type);
  };

  const allowsMultipleBranches = (type: string): boolean => {
    return type === 'Organization Partner';
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Employee name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.email.includes('@')) return 'Please enter a valid email';
    
    if (!isEdit) {
      if (!formData.password) return 'Password is required';
      if (formData.password.length < 8) return 'Password must be at least 8 characters';
      
      // Check for uppercase letter (backend requirement)
      if (!/[A-Z]/.test(formData.password)) {
        return 'Password must contain at least one uppercase letter';
      }
      
      // Check for lowercase letter
      if (!/[a-z]/.test(formData.password)) {
        return 'Password must contain at least one lowercase letter';
      }
      
      // Check for number or special character
      if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        return 'Password must contain at least one number or special character';
      }
      
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    }
    
    if (!formData.type) return 'Employee type is required';
    
    if (needsBranches(formData.type) && formData.branches_under.length === 0) {
      return 'At least one branch must be selected for this employee type';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && employee) {
        const updateData: UpdateEmployeeRequest = {
          name: formData.name,
          email: formData.email,
          type: formData.type,
          branches_under: formData.branches_under
        };
        await employeeService.updateEmployee(employee.id, updateData);
      } else {
        const createData: CreateEmployeeRequest = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          type: formData.type,
          branches_under: formData.branches_under
        };
        await employeeService.createEmployee(createData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(isEdit ? 'Failed to update employee' : 'Failed to create employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableEmployeeTypes = (): string[] => {
    if (!user) return [];
    
    // Organization Head can create all employee types except Organization Head
    if (user.type === 'Organization Head') {
      return EMPLOYEE_TYPES;
    }
    
    // Organization Partner can create Branch Admin, Receptionist, Reporting Doctor, Home testing person
    if (user.type === 'Organization Partner') {
      return EMPLOYEE_TYPES.filter(type => type !== 'Organization Partner');
    }
    
    // Branch Admin can create Receptionist, Reporting Doctor, Home testing person
    if (user.type === 'Branch Admin') {
      return EMPLOYEE_TYPES.filter(type => 
        !['Organization Partner', 'Branch Admin'].includes(type)
      );
    }
    
    return [];
  };

  const availableTypes = getAvailableEmployeeTypes();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Employee' : 'Create New Employee'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Employee Name */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
              Employee Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 dark:focus:border-blue-400"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter employee name"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 dark:focus:border-blue-400"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter email address"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Password fields - only show when creating new employee */}
          {!isEdit && (
            <>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 pr-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 dark:focus:border-blue-400"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password (minimum 8 characters)"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={showPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} 
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 pr-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500 dark:focus:border-blue-400"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={showConfirmPassword ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Employee Type */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Employee Type *
            </label>
            <div className="relative dropdown-container">
              <div
                className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 bg-white cursor-pointer flex justify-between items-center"
                onClick={() => !isSubmitting && setTypeDropdownOpen(!typeDropdownOpen)}
              >
                <span>{formData.type || 'Select employee type'}</span>
                <svg className={`w-4 h-4 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {typeDropdownOpen && !isSubmitting && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {availableTypes.map(type => (
                    <div
                      key={type}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300"
                      onClick={() => handleTypeSelect(type)}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {formData.type && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {needsBranches(formData.type) 
                  ? allowsMultipleBranches(formData.type) 
                    ? 'This role can be assigned to multiple branches' 
                    : 'This role requires assignment to exactly one branch'
                  : 'This role does not require branch assignment'
                }
              </p>
            )}
          </div>

          {/* Branches */}
          {needsBranches(formData.type) && (
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                Branches *
              </label>
              {isLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading branches...</div>
              ) : (
                <div className="relative dropdown-container">
                  <div
                    className="shadow appearance-none border border-gray-300 dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-300 dark:bg-gray-700 bg-white cursor-pointer flex justify-between items-center min-h-[2.5rem]"
                    onClick={() => !isSubmitting && setBranchDropdownOpen(!branchDropdownOpen)}
                  >
                    <span className="flex-1">
                      {formData.branches_under.length === 0 
                        ? 'Select branches'
                        : formData.branches_under.length === 1
                          ? branches.find(b => b.id === formData.branches_under[0])?.name || 'Unknown branch'
                          : `${formData.branches_under.length} branches selected`
                      }
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${branchDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {branchDropdownOpen && !isSubmitting && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                      {branches.map(branch => (
                        <div
                          key={branch.id}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-700 dark:text-gray-300 flex items-center"
                          onClick={() => handleBranchToggle(branch.id)}
                        >
                          <input
                            type="checkbox"
                            checked={formData.branches_under.includes(branch.id)}
                            onChange={() => {}} // Handled by onClick
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          {branch.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 bg-gray-50 dark:bg-gray-700/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Employee' : 'Create Employee')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFormModal;

