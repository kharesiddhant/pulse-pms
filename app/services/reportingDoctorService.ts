import { fetchWithAuth } from '@/lib/api';

export interface PatientEntryFilter {
  patient_name?: string;
  patient_uid?: string;
  phone_number?: string;
  date?: string;
  status?: string;
  serial_no?: string;
  test_type?: string;
  page?: number;
  per_page?: number;
  // Extended filter fields from desktop app (excluding payment_mode)
  date_filter_type?: string;
  date_start?: string;
  date_end?: string;
  month?: string;
  month_year?: string;
  year?: string;
  referred_by?: string;
  has_pending?: string;
  sort?: string;
}

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender: string;
  phone_number: string;
  date_of_birth?: string;
}

export interface TestDetail {
  id: number;
  name: string;
  modality?: string;
  has_template: boolean;
  template_file_path?: string;
  assigned_doctor?: {
    id: number;
    name: string;
    assigned_at: string;
  };
  is_assigned_to_current_user: boolean;
  report?: {
    id: number;
    file_name: string;
    file_size: number;
    uploaded_at: string;
    uploaded_by: string;
  };
}

export interface PatientDocument {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface PatientEntryListItem {
  id: number;
  serial_no: number;
  patient: Patient;
  tests: Array<{
    id: number;
    name: string;
    modality?: string;
  }>;
  test_type: string;
  status: string;
  entry_date: string;
  created_at: string;
  created_by_name: string;
  updated_by_name?: string;
  documents_count: number;
  referred_by?: string;
  secondary_referred_by?: string;
}

export interface PatientEntryDetails {
  id: number;
  serial_no: number;
  status: string;
  entry_date: string;
  patient: Patient;
  referring_doctors: {
    primary?: string;
    secondary?: string;
  };
  tests: TestDetail[];
  documents: PatientDocument[];
  comments?: string;
  total_amount: number;
}

export interface PatientEntriesResponse {
  patient_entries: PatientEntryListItem[];
  total: number;
  pages: number;
  current_page: number;
  per_page: number;
}

// Additional interfaces for search functionality
export interface SearchPatient {
  id: string;
  name: string;
  phone_number: string;
  uid?: string;
  age?: number;
  gender: string;
}

export interface ReferringDoctor {
  id: number;
  name: string;
  area?: string;
  phone_number?: string;
  speciality?: string;
  is_verified?: boolean;
}

// Get patient entries for reporting doctor with filters
export const getPatientEntries = async (filters: PatientEntryFilter = {}): Promise<PatientEntriesResponse> => {
  const queryParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const url = `/reporting-doctor/patient-entries${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log('API Request URL:', url); // Debug log
  console.log('Filters being sent:', filters); // Debug log
  
  return fetchWithAuth(url);
};

// Get detailed information about a specific patient entry
export const getPatientEntryDetails = async (entryId: number): Promise<PatientEntryDetails> => {
  return fetchWithAuth(`/reporting-doctor/patient-entries/${entryId}`);
};

// Assign reporting doctor to a specific test in patient entry
export const assignToTest = async (patientEntryId: number, branchTestId: number): Promise<any> => {
  return fetchWithAuth('/reporting-doctor/assign-test', {
    method: 'POST',
    body: JSON.stringify({
      patient_entry_id: patientEntryId,
      branch_test_id: branchTestId
    })
  });
};

// Unassign reporting doctor from a specific test in patient entry
export const unassignFromTest = async (patientEntryId: number, branchTestId: number): Promise<any> => {
  return fetchWithAuth('/reporting-doctor/unassign-test', {
    method: 'POST',
    body: JSON.stringify({
      patient_entry_id: patientEntryId,
      branch_test_id: branchTestId
    })
  });
};

// Download template for a specific test
export const downloadTemplate = async (patientEntryId: number, branchTestId: number, testName?: string): Promise<void> => {
  const blob = await fetchWithAuth(`/reporting-doctor/download-template/${patientEntryId}/${branchTestId}`, {}, 0, 'blob');
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Use testName if provided, fallback to previous naming
  const safeName = testName ? `${testName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.docx` : `template_${patientEntryId}_${branchTestId}.docx`;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Upload report for a specific test
export const uploadReport = async (
  patientEntryId: number, 
  branchTestId: number, 
  file: File
): Promise<any> => {
  // Only allow PDF files
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF files are allowed for upload.');
  }
  const formData = new FormData();
  formData.append('patient_entry_id', String(patientEntryId));
  formData.append('branch_test_id', String(branchTestId));
  formData.append('file', file);

  return fetchWithAuth('/reporting-doctor/upload-report', {
    method: 'POST',
    body: formData,
    headers: {} // Don't set Content-Type for FormData
  });
};

// Delete a test report
export const deleteReport = async (reportId: number): Promise<any> => {
  return fetchWithAuth(`/reporting-doctor/delete-report/${reportId}`, {
    method: 'DELETE'
  });
};

// Download a test report
export const downloadReport = async (reportId: number): Promise<void> => {
  const blob = await fetchWithAuth(`/reporting-doctor/download-report/${reportId}`, {}, 0, 'blob');
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report_${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Search functions for patient suggestions
export const searchPatientsByName = async (name: string): Promise<SearchPatient[]> => {
  return fetchWithAuth(`/receptionist/search-patients?name=${encodeURIComponent(name)}`);
};

export const searchPatientsByPhone = async (phone: string): Promise<SearchPatient[]> => {
  return fetchWithAuth(`/receptionist/search-patients?phone=${encodeURIComponent(phone)}`);
};

export const searchPatientsByUID = async (uid: string): Promise<SearchPatient[]> => {
  return fetchWithAuth(`/receptionist/search-patients?uid=${encodeURIComponent(uid)}`);
};

export const fetchReferringDoctors = async (): Promise<ReferringDoctor[]> => {
  return fetchWithAuth('/receptionist/referring-doctors');
};

// Update test entry status to report ready
export const updateTestEntryStatusToReportReady = async (entryId: number): Promise<void> => {
  await fetchWithAuth(`/reporting-doctor/update-status-to-report-ready/${entryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
};