import { config } from '../config';
import { fetchWithAuth } from '../lib/api';

export interface Branch {
  id: number;
  name: string;
  organization_id: number;
  emergency_amount: number;
  org_company: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBranchRequest {
  name: string;
  emergency_amount?: number;
  org_company?: string;
}

export interface UpdateBranchRequest {
  name?: string;
  emergency_amount?: number;
  org_company?: string;
}

export interface BranchResponse {
  message: string;
  branch: Branch;
}

export interface BranchesResponse {
  success: boolean;
  data: Branch[];
  message?: string;
}

class BranchService {
  private baseUrl = config.apiBaseUrl;

  async getBranches(): Promise<Branch[]> {
    try {
      const response = await fetchWithAuth('/organization/branches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch branches: ${error.message}`);
      } else {
        throw new Error('Failed to fetch branches: Unknown error');
      }
    }
  }

  async createBranch(branchData: CreateBranchRequest): Promise<BranchResponse> {
    try {
      const response = await fetchWithAuth('/organization/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchData)
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create branch: ${error.message}`);
      } else {
        throw new Error('Failed to create branch: Unknown error');
      }
    }
  }

  async updateBranch(branchId: number, branchData: UpdateBranchRequest): Promise<BranchResponse> {
    try {
      const response = await fetchWithAuth(`/organization/branches/${branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchData)
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update branch: ${error.message}`);
      } else {
        throw new Error('Failed to update branch: Unknown error');
      }
    }
  }

  async deleteBranch(branchId: number): Promise<{ message: string }> {
    try {
      const response = await fetchWithAuth(`/organization/branches/${branchId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete branch: ${error.message}`);
      } else {
        throw new Error('Failed to delete branch: Unknown error');
      }
    }
  }
}

export const branchService = new BranchService(); 