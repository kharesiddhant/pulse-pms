import { fetchWithAuth } from '../lib/api';

export const getDoctors = async (params?: { branch_id?: number | string; name?: string; verified?: boolean }) => {
  const query = new URLSearchParams();
  if (params) {
    if (params.branch_id !== undefined) query.append('branch_id', String(params.branch_id));
    if (params.name) query.append('name', params.name);
    if (params.verified !== undefined) query.append('verified', String(params.verified));
  }
  return fetchWithAuth(`/organization/doctors${query.toString() ? `?${query.toString()}` : ''}`);
};

export const getDoctorDetail = async (doctorName: string, branchId?: number | string) => {
  const query = branchId !== undefined ? `?branch_id=${branchId}` : '';
  return fetchWithAuth(`/organization/doctors/${encodeURIComponent(doctorName)}${query}`);
};

export const updateDoctorInfo = async (
  doctorName: string,
  data: { address?: string; is_verified?: boolean; phone_number?: string; speciality?: string }
) => {
  return fetchWithAuth(`/organization/doctors/${encodeURIComponent(doctorName)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const updateDoctorCommissions = async (
  doctorName: string,
  commissions: Array<{ branch_id: number; test_id: number; amount: number; is_verified?: boolean }>
) => {
  return fetchWithAuth(`/organization/doctors/${encodeURIComponent(doctorName)}/commissions`, {
    method: 'PUT',
    body: JSON.stringify({ commissions }),
  });
};

// Get recent patient entries where this doctor is primary referring doctor
export const getDoctorEntries = async (
  doctorName: string,
  params: Record<string, string | number | undefined> = {},
  limit: number = 50,
) => {
  const query = new URLSearchParams();
  query.append('limit', String(limit));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  return fetchWithAuth(`/organization/doctors/${encodeURIComponent(doctorName)}/entries?${query.toString()}`);
};

export const downloadDoctorEntriesPDF = async (
  doctorName: string,
  params: Record<string, string | number | undefined> = {},
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.append(k, String(v));
  });
  return fetchWithAuth(
    `/organization/doctors/${encodeURIComponent(doctorName)}/entries/pdf?${query.toString()}`,
    { headers: { Accept: 'application/pdf' } },
    0,
    'blob'
  );
};
