'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { branchService, Branch, CreateBranchRequest, UpdateBranchRequest } from '@/services/branchService';
import BranchFormModal from '@/components/branches/BranchFormModal';

const BranchesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Branch | null>(null);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !['Organization Head', 'Organization Partner'].includes(user.type)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch branches
  useEffect(() => {
    if (user && ['Organization Head', 'Organization Partner'].includes(user.type)) {
      fetchBranches();
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const branchesData = await branchService.getBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch branches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBranch = async (data: CreateBranchRequest) => {
    try {
      setIsSubmitting(true);
      await branchService.createBranch(data);
      await fetchBranches(); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranch = async (data: UpdateBranchRequest) => {
    if (!editingBranch) return;

    try {
      setIsSubmitting(true);
      await branchService.updateBranch(editingBranch.id, data);
      await fetchBranches(); // Refresh the list
      setIsModalOpen(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Failed to update branch:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    try {
      await branchService.deleteBranch(branch.id);
      await fetchBranches(); // Refresh the list
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete branch:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete branch');
    }
  };

  const handleFormSubmit = async (data: CreateBranchRequest | UpdateBranchRequest) => {
    if (editingBranch) {
      // Update mode
      await handleUpdateBranch(data as UpdateBranchRequest);
    } else {
      // Create mode - ensure name is provided
      if (!data.name) {
        throw new Error('Branch name is required');
      }
      await handleCreateBranch(data as CreateBranchRequest);
    }
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!['Organization Head', 'Organization Partner'].includes(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8 flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your organization&apos;s branches</p>
        </div>
        {user.type === "Organization Head" && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Branch
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading branches...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Branches List */}
          {branches.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No branches found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {user.type === 'Organization Head' 
                  ? 'Get started by creating your first branch.' 
                  : 'No branches have been created yet.'}
              </p>
              {user.type === 'Organization Head' && (
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  Create First Branch
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:ml-0 ml-0">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow w-72 h-72 flex flex-col justify-center items-center">
                  <div className="flex justify-between items-start mb-4 w-full">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center">
                        {branch.name}
                      </h3>
                      {branch.org_company && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{branch.org_company}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(branch)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Edit branch"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {user.type === 'Organization Head' && (
                        <button
                          onClick={() => setDeleteConfirm(branch)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete branch"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Emergency Amount:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(branch.emergency_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(branch.created_at)}
                      </span>
                    </div>
                    {branch.updated_at && branch.updated_at !== branch.created_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Updated:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(branch.updated_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Branch Form Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        branch={editingBranch}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Branch</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteBranch(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BranchesPage;