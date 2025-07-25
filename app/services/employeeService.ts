import { fetchWithAuth } from '../lib/api';

// Mapping from frontend display names to backend enum keys
const EMPLOYEE_TYPE_MAPPING: { [key: string]: string } = {
  'Organization Partner': 'ORGANIZATION_PARTNER',
  'Branch Admin': 'BRANCH_ADMIN',
  'Receptionist': 'RECEPTIONIST',
  'Reporting Doctor': 'REPORTING_DOCTOR', // Fixed: Use actual enum value from UserType enum
  'Home testing person': 'HOME_TESTING_PERSON'
};

// Reverse mapping for displaying data from backend
const BACKEND_TYPE_MAPPING: { [key: string]: string } = {
  'ORGANIZATION_PARTNER': 'Organization Partner',
  'BRANCH_ADMIN': 'Branch Admin', 
  'RECEPTIONIST': 'Receptionist',
  'DOCTOR': 'Reporting Doctor', // Fixed: Map 'DOCTOR' back to 'Reporting Doctor'
  'REPORTING_DOCTOR': 'Reporting Doctor', // Keep this for backward compatibility
  'HOME_TESTING_PERSON': 'Home testing person'
};

export interface Employee {
  id: number;
  name: string;
  email: string;
  type: string;
  branches: { id: number; name: string }[];
  last_login: string | null;
  created_by: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  password: string;
  type: string;
  branches_under: number[];
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  type?: string;
  branches_under?: number[];
}

export interface EmployeeResponse {
  success: boolean;
  data?: Employee[];
  message?: string;
  error?: boolean;
  code?: string;
}

export interface CreateEmployeeResponse {
  success: boolean;
  data?: {
    employee: {
      id: number;
      email: string;
      type: string;
    };
  };
  message?: string;
  error?: boolean;
  code?: string;
}

class EmployeeService {
  async getEmployees(): Promise<Employee[]> {
    try {
      const response: EmployeeResponse = await fetchWithAuth(`/organization/employees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.success && response.data) {
        // Convert backend enum keys to frontend display names
        const employeesWithDisplayTypes = response.data.map(employee => ({
          ...employee,
          type: BACKEND_TYPE_MAPPING[employee.type] || employee.type
        }));
        return employeesWithDisplayTypes;
      } else {
        throw new Error(response.message || 'Failed to fetch employees');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch employees: ${error.message}`);
      } else {
        throw new Error('Failed to fetch employees: Unknown error');
      }
    }
  }

  async createEmployee(employeeData: CreateEmployeeRequest): Promise<CreateEmployeeResponse> {
    try {
      // Convert frontend type to backend enum key
      const backendEmployeeData = {
        ...employeeData,
        type: EMPLOYEE_TYPE_MAPPING[employeeData.type] || employeeData.type
      };

      const response: CreateEmployeeResponse = await fetchWithAuth(`/organization/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendEmployeeData)
      });
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to create employee');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create employee: ${error.message}`);
      } else {
        throw new Error('Failed to create employee: Unknown error');
      }
    }
  }

  async updateEmployee(employeeId: number, employeeData: UpdateEmployeeRequest): Promise<void> {
    try {
      // Convert frontend type to backend enum key if type is being updated
      const backendEmployeeData = {
        ...employeeData,
        ...(employeeData.type && { type: EMPLOYEE_TYPE_MAPPING[employeeData.type] || employeeData.type })
      };

      const response = await fetchWithAuth(`/organization/employees/${employeeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(backendEmployeeData)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update employee');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update employee: ${error.message}`);
      } else {
        throw new Error('Failed to update employee: Unknown error');
      }
    }
  }

  async deleteEmployee(employeeId: number): Promise<void> {
    try {
      const response = await fetchWithAuth(`/organization/employees/${employeeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete employee');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete employee: ${error.message}`);
      } else {
        throw new Error('Failed to delete employee: Unknown error');
      }
    }
  }
}

export const employeeService = new EmployeeService(); 