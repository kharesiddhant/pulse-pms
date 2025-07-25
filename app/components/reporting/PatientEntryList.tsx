'use client';

import { useState, useEffect } from 'react';
import { PatientEntryListItem, PatientEntryFilter, getPatientEntries } from '../../services/reportingDoctorService';

interface PatientEntryListProps {
  filters: PatientEntryFilter;
  onEntrySelect: (entry: PatientEntryListItem) => void;
  selectedEntryId?: number;
  refreshTrigger?: number;
}

const PatientEntryList: React.FC<PatientEntryListProps> = ({
  filters,
  onEntrySelect,
  selectedEntryId,
  refreshTrigger,
}) => {
  const [entries, setEntries] = useState<PatientEntryListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEntries = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPatientEntries({ ...filters, page, per_page: 20 });
      setEntries(response.patient_entries);
      setTotal(response.total);
      setCurrentPage(response.current_page);
      setTotalPages(response.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries(1);
    setCurrentPage(1);
  }, [filters, refreshTrigger]);

  const handlePageChange = (page: number) => {
    fetchEntries(page);
  };

  const handleViewDocuments = (entry: PatientEntryListItem) => {
    // TODO: Implement document viewing modal
    console.log('View documents for entry:', entry.id);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Waiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Scanning':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Scans done':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Under reporting':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'Report ready':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Report downloaded':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading patient entries...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p>Error: {error}</p>
          <button
            onClick={() => fetchEntries(currentPage)}
            className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Patient Test Entries
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total: {total} entries
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Patient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Sr. No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Test Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                View Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                C/U By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No patient entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                    selectedEntryId === entry.id
                      ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500'
                      : ''
                  }`}
                  onClick={() => onEntrySelect(entry)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.patient.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {entry.patient.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.serial_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {entry.test_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        entry.status
                      )}`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {entry.documents_count > 0 ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocuments(entry);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                      >
                        View ({entry.documents_count})
                      </button>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">No docs</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        {entry.created_by_name}
                      </div>
                      {entry.updated_by_name && (
                        <div className="text-gray-500 dark:text-gray-400">
                          Updated by: {entry.updated_by_name}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntrySelect(entry);
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientEntryList; 