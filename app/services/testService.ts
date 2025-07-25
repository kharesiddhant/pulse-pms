import { config } from '../config';
import { fetchWithAuth } from '../lib/api';

export interface Test {
  id: number;
  test_name: string;
  modality_id: number;
}

export interface Modality {
  id: number;
  name: string;
  tests: Test[];
}

export interface BranchTest {
  id: number;
  test_id: number;
  test_name: string;
  modality_name: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
  has_template: boolean;
  template: {
    file_name: string;
    file_type: string;
    file_size: number;
  } | null;
}

export interface AddTestToBranchRequest {
  test_id: number;
  price: number;
}

export interface UpdateBranchTestRequest {
  price: number;
}

export interface BranchTestResponse {
  message: string;
  branch_test: {
    id: number;
    branch_id: number;
    test_id: number;
    test_name: string;
    price: number;
    created_at: string | null;
    updated_at?: string | null;
  };
}

class TestService {
  private baseUrl = config.apiBaseUrl;

  async getGlobalTests(): Promise<Modality[]> {
    try {
      const response = await fetchWithAuth('/organization/tests/global', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch global tests: ${error.message}`);
      } else {
        throw new Error('Failed to fetch global tests: Unknown error');
      }
    }
  }

  async getBranchTests(branchId: number): Promise<BranchTest[]> {
    try {
      const response = await fetchWithAuth(`/organization/tests/branch/${branchId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch branch tests: ${error.message}`);
      } else {
        throw new Error('Failed to fetch branch tests: Unknown error');
      }
    }
  }

  async addTestToBranch(branchId: number, testData: AddTestToBranchRequest): Promise<BranchTestResponse> {
    try {
      const response = await fetchWithAuth(`/organization/tests/branch/${branchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add test to branch: ${error.message}`);
      } else {
        throw new Error('Failed to add test to branch: Unknown error');
      }
    }
  }

  async updateBranchTest(branchId: number, branchTestId: number, testData: UpdateBranchTestRequest): Promise<BranchTestResponse> {
    try {
      const response = await fetchWithAuth(`/organization/tests/branch/${branchId}/${branchTestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update branch test: ${error.message}`);
      } else {
        throw new Error('Failed to update branch test: Unknown error');
      }
    }
  }

  async removeTestFromBranch(branchId: number, branchTestId: number): Promise<{ message: string }> {
    try {
      const response = await fetchWithAuth(`/organization/tests/branch/${branchId}/${branchTestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to remove test from branch: ${error.message}`);
      } else {
        throw new Error('Failed to remove test from branch: Unknown error');
      }
    }
  }
}

export const testService = new TestService(); 