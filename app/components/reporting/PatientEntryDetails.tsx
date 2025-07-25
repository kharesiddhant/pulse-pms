'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PatientEntryDetails as PatientEntryDetailsType, 
  getPatientEntryDetails,
  assignToTest,
  unassignFromTest,
  downloadTemplate,
  uploadReport,
  deleteReport,
  downloadReport,
  updateTestEntryStatusToReportReady
} from '../../services/reportingDoctorService';

interface PatientEntryDetailsProps {
  entryId: number | null;
  onRefresh?: () => void;
  onCloseDetails?: () => void;
}

const PatientEntryDetails: React.FC<PatientEntryDetailsProps> = ({ entryId, onRefresh, onCloseDetails }) => {
  const [details, setDetails] = useState<PatientEntryDetailsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const [showReportModal, setShowReportModal] = useState(false);
  const [modalTestId, setModalTestId] = useState<number | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!entryId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getPatientEntryDetails(entryId);
      setDetails(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patient entry details');
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]); // Only depend on fetchDetails since entryId is already in its dependencies

  const updateActionLoading = (actionKey: string, loading: boolean) => {
    setActionLoading(prev => ({ ...prev, [actionKey]: loading }));
  };

  const handleAssignToTest = async (branchTestId: number) => {
    if (!details) return;
    
    const actionKey = `assign-${branchTestId}`;
    updateActionLoading(actionKey, true);
    try {
      await assignToTest(details.id, branchTestId);
      await fetchDetails(); // Refresh details
      onRefresh?.(); // Refresh the parent list
    } catch (err) {
      console.error('Failed to assign to test:', err);
      alert(err instanceof Error ? err.message : 'Failed to assign to test');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  const handleUnassignFromTest = async (branchTestId: number) => {
    if (!details) return;
    
    const actionKey = `unassign-${branchTestId}`;
    updateActionLoading(actionKey, true);
    try {
      await unassignFromTest(details.id, branchTestId);
      await fetchDetails(); // Refresh details
      onRefresh?.(); // Refresh the parent list
    } catch (err) {
      console.error('Failed to unassign from test:', err);
      alert(err instanceof Error ? err.message : 'Failed to unassign from test');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  const handleDownloadTemplate = async (branchTestId: number, testName?: string) => {
    if (!details) return;
    const actionKey = `download-template-${branchTestId}`;
    updateActionLoading(actionKey, true);
    try {
      await downloadTemplate(details.id, branchTestId, testName);
    } catch (err) {
      console.error('Failed to download template:', err);
      alert(err instanceof Error ? err.message : 'Failed to download template');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  const handleUploadReport = async (branchTestId: number, file: File) => {
    if (!details) return;
    const actionKey = `upload-report-${branchTestId}`;
    updateActionLoading(actionKey, true);
    try {
      await uploadReport(details.id, branchTestId, file);
      // After upload, fetch details to get updated test info
      const updatedDetails = await getPatientEntryDetails(details.id);
      setDetails(updatedDetails);
      onRefresh?.(); // Refresh the parent list
      // Check if all tests have reports uploaded
      const allReported = updatedDetails.tests.every(test => !!test.report);
      if (allReported && updatedDetails.status !== 'Report ready') {
        // Call backend to update status to 'Report ready' via reportingDoctorService
        await updateTestEntryStatusToReportReady(details.id);
        // Optionally, fetch details again to reflect status change
        setDetails(await getPatientEntryDetails(details.id));
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to upload report:', err);
      alert(err instanceof Error ? err.message : 'Failed to upload report');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!details || !confirm('Are you sure you want to delete this report?')) return;
    
    const actionKey = `delete-report-${reportId}`;
    updateActionLoading(actionKey, true);
    try {
      await deleteReport(reportId);
      await fetchDetails(); // Refresh details
      onRefresh?.(); // Refresh the parent list
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete report');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    const actionKey = `download-report-${reportId}`;
    updateActionLoading(actionKey, true);
    try {
      await downloadReport(reportId);
    } catch (err) {
      console.error('Failed to download report:', err);
      alert(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      updateActionLoading(actionKey, false);
    }
  };

  // const handleFileUpload = (branchTestId: number, event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     // Validate file type
  //     const allowedTypes = ['.pdf'];
  //     const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  //     if (!allowedTypes.includes(fileExtension)) {
  //       alert('Please select a .pdf file');
  //       return;
  //     }
  //     handleUploadReport(branchTestId, file);
  //   }
  //   // Clear the input value to allow uploading the same file again
  //   event.target.value = '';
  // };

  // const openReportModal = (testId: number, file: File) => {
  //   setModalTestId(testId);
  //   setModalFile(file);
  //   setShowReportModal(true);
  // };
  const closeReportModal = () => {
    setShowReportModal(false);
    setModalTestId(null);
    setModalFile(null);
  };
  const confirmReportUpload = async () => {
    if (modalTestId && modalFile) {
      await handleUploadReport(modalTestId, modalFile);
      closeReportModal();
    }
  };

  // Add close button handler
  const handleCloseDetails = () => {
    onCloseDetails?.(); // Deselect entry in parent
    setDetails(null);   // Clear details in this component
  };

  if (!entryId) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Select a patient entry to view details
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading patient details...</span>
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
            onClick={fetchDetails}
            className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!details) return null;

  // Improved close button styling
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-0 relative">
      {/* Improved X button to close details */}
      <button
        onClick={handleCloseDetails}
        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 shadow hover:bg-red-100 hover:text-red-600 transition-colors duration-200 z-10 border border-gray-300 dark:border-gray-600"
        title="Close details"
        aria-label="Close details"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Left Pane */}
        <div className="p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col gap-6 min-h-full">
          {/* Patient Details */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Patient Details</h3>
            <div className="flex flex-col gap-2">
              <div><span className="font-medium">Name:</span> {details.patient.name}</div>
              <div><span className="font-medium">Age:</span> {details.patient.age || 'N/A'}</div>
              <div><span className="font-medium">Gender:</span> {details.patient.gender}</div>
            </div>
          </div>
          {/* Patient Documents */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Patient Documents</h3>
            {details.documents && details.documents.length > 0 ? (
              <ul className="list-disc ml-4">
                {details.documents.map(doc => (
                  <li key={doc.id} className="flex justify-between items-center py-1">
                    <span>{doc.file_name}</span>
                    <a href={`/uploads/${doc.file_name}`} target="_blank" rel="noopener" className="text-blue-600 hover:underline text-xs">View</a>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-gray-500">No documents uploaded</span>
            )}
          </div>
        </div>
        {/* Right Pane */}
        <div className="p-6 flex flex-col gap-6 min-h-full">
          {/* Test Details */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Patient Test Details</h3>
            <div className="space-y-6">
              {details.tests.map(test => (
                <div key={test.id} className="border rounded-lg p-6 bg-white dark:bg-gray-800 shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-semibold text-lg">{test.name}</span>
                      {test.modality && <span className="ml-2 text-base text-gray-600">({test.modality})</span>}
                    </div>
                    {test.assigned_doctor && (
                      <span className="text-base px-3 py-1 rounded bg-gray-200 text-gray-700">Assigned: {test.assigned_doctor.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mb-2">
                    {test.is_assigned_to_current_user ? (
                      <>
                        {/* Download Template Button */}
                        {test.has_template ? (
                          <button
                            onClick={() => handleDownloadTemplate(test.id, test.name)}
                            disabled={actionLoading[`download-template-${test.id}`]}
                            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-base font-semibold disabled:opacity-50"
                          >
                            {actionLoading[`download-template-${test.id}`] ? 'Downloading...' : 'Download Template'}
                          </button>
                        ) : (
                          <span className="px-6 py-2 bg-gray-200 text-gray-600 rounded text-base font-semibold">No template available</span>
                        )}

                        {/* Upload Report Button */}
                        {!test.report && (
                          <>
                            <button
                              type="button"
                              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-base font-semibold cursor-pointer"
                              onClick={() => {
                                setModalTestId(test.id);
                                setShowReportModal(true);
                                setModalFile(null);
                              }}
                              disabled={actionLoading[`upload-report-${test.id}`]}
                            >
                              Upload Report
                            </button>
                            {/* Unassign Button: only visible until report is uploaded */}
                            <button
                              onClick={() => handleUnassignFromTest(test.id)}
                              disabled={actionLoading[`unassign-${test.id}`]}
                              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-base font-semibold disabled:opacity-50"
                            >
                              {actionLoading[`unassign-${test.id}`] ? 'Unassigning...' : 'Unassign Myself'}
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      // If not assigned to current user and not assigned to anyone, show Assign Yourself button
                      !test.assigned_doctor && (
                        <button
                          onClick={() => handleAssignToTest(test.id)}
                          disabled={actionLoading[`assign-${test.id}`]}
                          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-base font-semibold disabled:opacity-50"
                        >
                          {actionLoading[`assign-${test.id}`] ? 'Assigning...' : 'Assign Yourself'}
                        </button>
                      )
                    )}
                  </div>
                  {test.report && (
                    <div className="bg-green-50 p-3 rounded border flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-medium text-green-800">{test.report.file_name}</span>
                        <span className="text-base text-green-600">{Math.round(test.report.file_size / 1024)} KB</span>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleDownloadReport(test.report!.id)}
                          disabled={actionLoading[`download-report-${test.report!.id}`]}
                          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-base font-semibold disabled:opacity-50"
                        >
                          {actionLoading[`download-report-${test.report!.id}`] ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                          onClick={() => handleDeleteReport(test.report!.id)}
                          disabled={actionLoading[`delete-report-${test.report!.id}`]}
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-base font-semibold disabled:opacity-50"
                        >
                          {actionLoading[`delete-report-${test.report!.id}`] ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Patient Scan Details (future PACS integration) */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm mt-4">
            <h3 className="text-lg font-semibold mb-2">Patient Scan Details</h3>
            <span className="text-gray-400 text-base">(To be implemented after PACS integration)</span>
          </div>
        </div>
      </div>
      {/* Modal for report upload confirmation */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 className="text-lg font-semibold mb-4">Upload Report</h3>
            <p className="mb-2 text-gray-700 dark:text-gray-300">Drag and drop a .doc or .docx file here, or click to select a file.</p>
            <DragDropFilePicker
              onFileSelected={file => setModalFile(file)}
              disabled={actionLoading[`upload-report-${modalTestId}`]}
            />
            {modalFile && (
              <div className="mt-4 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span className="font-mono text-sm">{modalFile.name}</span>
                <button onClick={() => setModalFile(null)} className="ml-2 px-2 py-1 text-xs bg-red-200 text-red-700 rounded">Remove</button>
              </div>
            )}
            <div className="flex gap-4 justify-end mt-6">
              <button onClick={closeReportModal} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-base">Cancel</button>
              <button
                onClick={confirmReportUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-base"
                disabled={!modalFile || actionLoading[`upload-report-${modalTestId}`]}
              >
                {actionLoading[`upload-report-${modalTestId}`] ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DragDropFilePicker: React.FC<{ onFileSelected: (file: File) => void; disabled?: boolean }> = ({ onFileSelected, disabled }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) onFileSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) onFileSelected(file);
    }
    e.target.value = '';
  };

  const validateFile = (file: File) => {
    const allowedTypes = ['.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      alert('Please select a .pdf file');
      return false;
    }
    return true;
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 dark:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <span className="text-base text-gray-600 dark:text-gray-300">Drop file here or click to select</span>
    </div>
  );
};

export default PatientEntryDetails;