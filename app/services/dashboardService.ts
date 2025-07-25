import { config } from '../config';
import { fetchWithAuth } from '../lib/api';

export interface Branch {
  id: number;
  name: string;
}

export interface Revenue {
  total: number;
  period: string;
}

// --- NEW INTERFACE for the walk-in pending amount ---
export interface WalkinPendingAmount {
  total: number;
  period: string;
}

export interface PatientEntries {
  total: number;
  period: string;
}

export interface AffiliatedHospitalAmount {
  total: number;
  period: string;
}

export interface ReportsPendingAssignment {
  total: number;
  period: string;
}

export interface DashboardData {
  branches: Branch[];
  user_type: string;
  organization_id: number;
  revenue: Revenue;
  // --- ADD the new property to the data structure ---
  walkin_pending_amount: WalkinPendingAmount;
  patient_entries: PatientEntries;
  affiliated_hospital_amount: AffiliatedHospitalAmount;
  reports_pending_assignment: ReportsPendingAssignment;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

export interface DashboardParams {
  branch_id?: number;
  period?: 'today' | 'week' | 'month' | 'year' | 'lifetime';
}

class DashboardService {
  async getDashboardData(params?: DashboardParams): Promise<DashboardResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.branch_id) {
      queryParams.append('branch_id', params.branch_id.toString());
    }
    if (params?.period) {
      queryParams.append('period', params.period);
    }

    const endpoint = `/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    try {
      return await fetchWithAuth(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Dashboard fetch failed: ${error.message}`);
      } else {
        throw new Error('Dashboard fetch failed: Unknown error');
      }
    }
  }
}

export const dashboardService = new DashboardService();