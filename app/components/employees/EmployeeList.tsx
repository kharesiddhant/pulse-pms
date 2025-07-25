'use client';

import React, { useState } from 'react';
import { Employee, employeeService } from '@/services/employeeService';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeListProps {
  employees: Employee[];
  onEmployeeEdit: (employee: Employee) => void;
  onEmployeeDeleted: () => void;
  isLoading: boolean;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  onEmployeeEdit,
  onEmployeeDeleted,
  isLoading
}) => {
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatBranches = (branches: { id: number; name: string }[]): string => {
    if (!branches || branches.length === 0) return 'None';
    return branches.map(branch => branch.name).join(', ');
  };

  const handleDeleteClick = (employee: Employee) => {
    setDeleteConfirm(employee);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    try {
      setIsDeleting(true);
      await employeeService.deleteEmployee(deleteConfirm.id);
      onEmployeeDeleted();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('Failed to delete employee. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const canEditEmployee = (employee: Employee): boolean => {
    if (!user) return false;
    
    // Organization Head cannot be edited
    if (employee.type === 'Organization Head') return false;
    
    // Users cannot edit themselves to prevent lockout
    if (employee.id === user.id) return false;
    
    if (user.type === 'Organization Head') return true;
    if (user.type === 'Organization Partner') {
      return ['Branch Admin', 'Receptionist', 'Reporting Doctor', 'Home testing person'].includes(employee.type);
    }
    if (user.type === 'Branch Admin') {
      return ['Receptionist', 'Reporting Doctor', 'Home testing person'].includes(employee.type);
    }
    
    return false;
  };

  const canDeleteEmployee = (employee: Employee): boolean => {
    return canEditEmployee(employee);
  };

  const getEmployeeTypeColor = (type: string): string => {
    switch (type) {
      case 'Organization Head':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Organization Partner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Branch Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Receptionist':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Reporting Doctor':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Home testing person':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getUserInitial = (name: string): string => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No employees found</h3>
        <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Branches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getUserInitial(employee.name)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {employee.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmployeeTypeColor(employee.type)}`}>
                      {employee.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {formatBranches(employee.branches)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {employee.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDate(employee.last_login)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {canEditEmployee(employee) && (
                      <button
                        onClick={() => onEmployeeEdit(employee)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteEmployee(employee) && (
                      <button
                        onClick={() => handleDeleteClick(employee)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {getUserInitial(employee.name)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {employee.id}</p>
                </div>
              </div>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEmployeeTypeColor(employee.type)}`}>
                {employee.type}
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Email:</span>
                <p className="text-sm text-gray-900 dark:text-white">{employee.email}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Branches:</span>
                <p className="text-sm text-gray-900 dark:text-white">{formatBranches(employee.branches)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Login:</span>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(employee.last_login)}</p>
              </div>
            </div>
            
            {(canEditEmployee(employee) || canDeleteEmployee(employee)) && (
              <div className="flex space-x-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                {canEditEmployee(employee) && (
                  <button
                    onClick={() => onEmployeeEdit(employee)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors duration-200"
                  >
                    Edit
                  </button>
                )}
                {canDeleteEmployee(employee) && (
                  <button
                    onClick={() => handleDeleteClick(employee)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors duration-200"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors duration-200 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList; 