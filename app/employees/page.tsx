'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Employee, employeeService } from '@/services/employeeService';
import { Branch, branchService } from '@/services/branchService';
import EmployeeSearchFilter, { EmployeeFilters } from '@/components/employees/EmployeeSearchFilter';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import EmployeeList from '@/components/employees/EmployeeList';

const EmployeesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filters, setFilters] = useState<EmployeeFilters>({
    searchTerm: '',
    selectedType: '',
    selectedBranch: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check if user has permission to access employees page
    if (user && !['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch employees and branches
  useEffect(() => {
    if (user && ['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
      fetchEmployees();
      fetchBranches();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const employeesData = await employeeService.getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const branchesData = await branchService.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      // Don't set error for branches as it's not critical
    }
  };

  const handleFilterChange = (newFilters: EmployeeFilters) => {
    setFilters(newFilters);
  };

  const handleCreateEmployee = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleModalSuccess = () => {
    fetchEmployees();
    handleModalClose();
  };

  const handleEmployeeDeleted = () => {
    fetchEmployees();
  };

  const canCreateEmployee = (): boolean => {
    if (!user) return false;
    return ['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type);
  };

  // Filter employees based on search and filter criteria
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = filters.searchTerm === '' || 
        employee.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
      const matchesType = filters.selectedType === '' || employee.type === filters.selectedType;
      
      const matchesBranch = filters.selectedBranch === '' || 
        employee.branches.some(branch => branch.id.toString() === filters.selectedBranch);
      
      return matchesSearch && matchesType && matchesBranch;
    });
  }, [employees, filters]);

  // --- MODIFIED SECTION: Calculate meaningful statistics ---
  const totalEmployees = employees.length;
  const totalBranches = branches.length;

  // Calculate users who have been active in the last 24 hours
  const activeToday = useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return employees.filter(emp => {
      if (!emp.last_login) return false;
      const lastLoginDate = new Date(emp.last_login);
      return lastLoginDate > oneDayAgo;
    }).length;
  }, [employees]);
  // --- END OF MODIFIED SECTION ---

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Employees</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization&apos;s employees and their access permissions.</p>
        </div>
        {canCreateEmployee() && (
          <button
            onClick={handleCreateEmployee}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Employee
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Employees Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:bg-gradient-to-r hover:from-blue-50 dark:hover:bg-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalEmployees}</p>
            </div>
          </div>
        </div>
        
        {/* Active Today Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:bg-gradient-to-r hover:from-green-50 dark:hover:bg-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Today</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeToday}</p>
            </div>
          </div>
        </div>

        {/* Branches Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:bg-gradient-to-r hover:from-purple-50 dark:hover:bg-gray-700/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Branches</h3>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalBranches}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card p-6 border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Employees</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={fetchEmployees}
                className="text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-6">
        <EmployeeSearchFilter
          onFilterChange={handleFilterChange}
          branches={branches}
        />
      </div>

      {/* Employees List */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Employees List
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing {filteredEmployees.length} of {totalEmployees} employees
          </p>
        </div>
        
        <EmployeeList
          employees={filteredEmployees}
          isLoading={isLoading}
          onEmployeeEdit={handleEditEmployee}
          onEmployeeDeleted={handleEmployeeDeleted}
        />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <EmployeeFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          employee={editingEmployee}
          isEdit={!!editingEmployee}
        />
      )}
    </div>
  );
};

export default EmployeesPage;