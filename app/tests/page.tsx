'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { testService, Modality, BranchTest, AddTestToBranchRequest, UpdateBranchTestRequest } from '@/services/testService';
import { branchService, Branch } from '@/services/branchService';
import { branchTemplateService } from '@/services/branchTemplateService';
import TestFormModal from '@/components/tests/TestFormModal';
import TemplateUploadModal from '@/components/tests/TemplateUploadModal';

const TestsPage = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [branchTests, setBranchTests] = useState<BranchTest[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [isLoadingModalities, setIsLoadingModalities] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<BranchTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BranchTest | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedBranchTest, setSelectedBranchTest] = useState<BranchTest | null>(null);
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('');
  const itemsPerPage = 10;

  // Get modality color
  const getModalityColor = (modalityName: string) => {
    switch (modalityName.toUpperCase()) {
      case 'MRI':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Get unique modalities from branch tests for filter dropdown
  const availableModalities = useMemo(() => {
    const modalities = [...new Set(branchTests.map(test => test.modality_name))];
    return modalities.sort();
  }, [branchTests]);

  // Filter and paginate tests
  const filteredAndPaginatedTests = useMemo(() => {
    // Filter tests based on search term and selected modality
    const filtered = branchTests.filter(test => {
      const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           test.modality_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModality = !selectedModality || test.modality_name === selectedModality;
      return matchesSearch && matchesModality;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTests = filtered.slice(startIndex, endIndex);

    return {
      tests: paginatedTests,
      totalTests: filtered.length,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [branchTests, searchTerm, selectedModality, currentPage, itemsPerPage]);

  // Reset pagination when search term or modality filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModality]);

  // Refresh user data when component mounts to get latest branches_under
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshUser();
    }
  }, [isAuthenticated]);

  // Check authorization
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && !['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Fetch branches based on user role
  useEffect(() => {
    if (user && ['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
      fetchBranches();
    }
  }, [user]);

  // Fetch modalities when component mounts
  useEffect(() => {
    if (user && ['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
      fetchModalities();
    }
  }, [user]);

  // Fetch branch tests when branch is selected
  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchTests(selectedBranchId);
    } else {
      setBranchTests([]);
    }
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setError(null);
      
      console.log('Fetching branches for user:', user);
      
      if (user?.type === 'Organization Head') {
        // Organization head can see all branches
        const branchesData = await branchService.getBranches();
        console.log('Organization Head - All branches:', branchesData);
        setBranches(branchesData);
      } else if (user?.type === 'Organization Partner' && user.branches_under) {
        // Organization partner can see assigned branches
        const allBranches = await branchService.getBranches();
        console.log('Organization Partner - All branches:', allBranches);
        console.log('User branches_under:', user.branches_under);
        const assignedBranches = allBranches.filter(branch => 
          user.branches_under?.includes(branch.id)
        );
        console.log('Filtered assigned branches:', assignedBranches);
        setBranches(assignedBranches);
      } else if (user?.type === 'Branch Admin' && user.branches_under && user.branches_under.length === 1) {
        // Branch admin can see only their single branch
        const allBranches = await branchService.getBranches();
        const userBranch = allBranches.filter(branch => 
          branch.id === user.branches_under?.[0]
        );
        setBranches(userBranch);
        // Auto-select the single branch for branch admin
        if (userBranch.length > 0) {
          setSelectedBranchId(userBranch[0].id);
        }
      } else {
        console.log('No matching user type or missing branches_under:', user);
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch branches');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const fetchModalities = async () => {
    try {
      setIsLoadingModalities(true);
      const modalitiesData = await testService.getGlobalTests();
      setModalities(modalitiesData);
    } catch (error) {
      console.error('Failed to fetch modalities:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch test modalities');
    } finally {
      setIsLoadingModalities(false);
    }
  };

  const fetchBranchTests = async (branchId: number) => {
    try {
      setIsLoadingTests(true);
      setError(null);
      const testsData = await testService.getBranchTests(branchId);
      setBranchTests(testsData);
      setCurrentPage(1); // Reset to first page when loading new branch tests
    } catch (error) {
      console.error('Failed to fetch branch tests:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch branch tests');
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleAddTest = async (data: AddTestToBranchRequest) => {
    if (!selectedBranchId) return;

    try {
      setIsSubmitting(true);
      await testService.addTestToBranch(selectedBranchId, data);
      await fetchBranchTests(selectedBranchId); // Refresh the list
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add test:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTest = async (data: UpdateBranchTestRequest) => {
    if (!editingTest || !selectedBranchId) return;

    try {
      setIsSubmitting(true);
      await testService.updateBranchTest(selectedBranchId, editingTest.id, data);
      await fetchBranchTests(selectedBranchId); // Refresh the list
      setIsModalOpen(false);
      setEditingTest(null);
    } catch (error) {
      console.error('Failed to update test:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (branchTest: BranchTest) => {
    if (!selectedBranchId) return;

    try {
      await testService.removeTestFromBranch(selectedBranchId, branchTest.id);
      await fetchBranchTests(selectedBranchId); // Refresh the list
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete test:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete test');
    }
  };

  const handleFormSubmit = async (data: AddTestToBranchRequest | UpdateBranchTestRequest) => {
    if (editingTest) {
      // Update mode
      await handleUpdateTest(data as UpdateBranchTestRequest);
    } else {
      // Add mode
      await handleAddTest(data as AddTestToBranchRequest);
    }
  };

  const openAddModal = () => {
    setEditingTest(null);
    setIsModalOpen(true);
  };

  const openEditModal = (branchTest: BranchTest) => {
    setEditingTest(branchTest);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTest(null);
  };

  const openTemplateModal = (branchTest: BranchTest) => {
    setSelectedBranchTest(branchTest);
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setTemplateModalOpen(false);
    setSelectedBranchTest(null);
  };

  const handleTemplateSuccess = () => {
    // Refresh the branch tests list to reflect any template changes
    if (selectedBranchId) {
      fetchBranchTests(selectedBranchId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
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

  if (!['Organization Head', 'Organization Partner', 'Branch Admin'].includes(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tests Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage tests and pricing for your branches</p>
      </div>

      {/* Branch Selection, Add Test button, and Search/Filter – combined card */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Top row: branch selector + Add Test */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Branch
            </label>
            {isLoadingBranches ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded-md"></div>
            ) : (
              <select
                id="branch-select"
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                disabled={user.type === 'Branch Admin'} // Branch admin has auto-selected branch
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {selectedBranchId && (
            <div className="flex-shrink-0">
              <button
                onClick={openAddModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors flex items-center"
                disabled={isLoadingModalities}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Test
              </button>
            </div>
          )}
      </div>

        {/* Search & Filter – show only when branch selected */}
      {selectedBranchId && (
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Tests
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by test name or modality..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="w-full lg:w-64">
              <label htmlFor="modality-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Modality
              </label>
              <select
                id="modality-filter"
                value={selectedModality}
                onChange={(e) => setSelectedModality(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">All Modalities</option>
                {availableModalities.map((modality) => (
                  <option key={modality} value={modality}>
                    {modality}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filteredAndPaginatedTests.totalTests} test{filteredAndPaginatedTests.totalTests !== 1 ? 's' : ''} found
                {(searchTerm || selectedModality) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedModality('');
                    }}
                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
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

      {/* Tests List */}
      {selectedBranchId ? (
        <>
          {isLoadingTests ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading tests...</span>
              </div>
            </div>
          ) : (
            <>
              {filteredAndPaginatedTests.totalTests === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {searchTerm ? 'No tests found' : 'No tests found'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm 
                      ? `No tests match your search "${searchTerm}". Try a different search term.`
                      : 'No tests have been added to this branch yet.'
                    }
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={openAddModal}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      disabled={isLoadingModalities}
                    >
                      Add First Test
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Test Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Modality
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Price
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Template
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Updated
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                          {filteredAndPaginatedTests.tests.map((branchTest) => (
                            <tr key={branchTest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {branchTest.test_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModalityColor(branchTest.modality_name)}`}>
                                  {branchTest.modality_name}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(branchTest.price)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                {branchTest.has_template ? (
                                  <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span className="sr-only">Template uploaded</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="sr-only">No template</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(branchTest.updated_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => openTemplateModal(branchTest)}
                                    className="p-2 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 transition-colors rounded"
                                    title="Manage reporting template"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openEditModal(branchTest)}
                                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded"
                                    title="Edit price"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(branchTest)}
                                    className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded"
                                    title="Remove test"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  {filteredAndPaginatedTests.totalPages > 1 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-600 sm:px-6 rounded-b-lg shadow-md">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!filteredAndPaginatedTests.hasPrevPage}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedTests.totalPages))}
                          disabled={!filteredAndPaginatedTests.hasNextPage}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing{' '}
                            <span className="font-medium">
                              {(currentPage - 1) * itemsPerPage + 1}
                            </span>{' '}
                            to{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, filteredAndPaginatedTests.totalTests)}
                            </span>{' '}
                            of{' '}
                            <span className="font-medium">{filteredAndPaginatedTests.totalTests}</span>{' '}
                            results
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={!filteredAndPaginatedTests.hasPrevPage}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              <span className="sr-only">Previous</span>
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: filteredAndPaginatedTests.totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-green-50 border-green-500 text-green-600 dark:bg-green-900 dark:border-green-400 dark:text-green-300'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, filteredAndPaginatedTests.totalPages))}
                              disabled={!filteredAndPaginatedTests.hasNextPage}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              <span className="sr-only">Next</span>
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a Branch</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a branch from the dropdown above to manage its tests and pricing.
          </p>
        </div>
      )}

      {/* Test Form Modal */}
      <TestFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        modalities={modalities}
        branchTest={editingTest}
        isLoading={isSubmitting}
        mode={editingTest ? 'edit' : 'add'}
        existingBranchTests={branchTests}
      />

      {/* Template Upload Modal */}
      {selectedBranchTest && (
        <TemplateUploadModal
          isOpen={templateModalOpen}
          onClose={closeTemplateModal}
          branchTest={selectedBranchTest}
          onSuccess={handleTemplateSuccess}
        />
      )}

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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Remove Test</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove <strong>{deleteConfirm.test_name}</strong> from this branch? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTest(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestsPage; 