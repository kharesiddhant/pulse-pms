'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PatientEntrySearchFilters from '../components/reporting/PatientEntrySearchFilters';
import PatientEntryList from '../components/reporting/PatientEntryList';
import PatientEntryDetails from '../components/reporting/PatientEntryDetails';
import { PatientEntryFilter, PatientEntryListItem } from '../services/reportingDoctorService';

const ReportingDoctorPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [filters, setFilters] = useState<PatientEntryFilter>({});
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect if not authenticated or not a reporting doctor
  useEffect(() => {
    if (!authLoading && (!user || user.type !== 'Reporting Doctor')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleFilterChange = (newFilters: PatientEntryFilter) => {
    setFilters(newFilters);
    setSelectedEntryId(null); // Clear selection when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setSelectedEntryId(null);
  };

  const handleEntrySelect = (entry: PatientEntryListItem) => {
    setSelectedEntryId(entry.id);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authorized (will redirect)
  if (!user || user.type !== 'Reporting Doctor') {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reporting Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage patient test entries and reports</p>
      </div>

      {/* Search Filters */}
      <div className="mb-6">
        <PatientEntrySearchFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Patient Entry List */}
      <div className="mb-8">
        <PatientEntryList
          filters={filters}
          onEntrySelect={handleEntrySelect}
          selectedEntryId={selectedEntryId ?? undefined}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Patient Entry Details */}
      {selectedEntryId !== null && (
        <div>
          <PatientEntryDetails
            entryId={selectedEntryId}
            onRefresh={handleRefresh}
            onCloseDetails={() => setSelectedEntryId(null)}
          />
        </div>
      )}
    </>
  );
};

export default ReportingDoctorPage;