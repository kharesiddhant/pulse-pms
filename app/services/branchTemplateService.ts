import { config } from '../config';
import { fetchWithAuth } from '../lib/api';

export interface TemplateInfo {
  file_name: string;
  file_type: string;
  file_size: number;
}

export interface TemplateResponse {
  success: boolean;
  has_template: boolean;
  template?: TemplateInfo;
  message?: string;
}

class BranchTemplateService {
  private baseUrl = config.apiBaseUrl;

  async uploadTemplate(branchTestId: number, file: File): Promise<TemplateResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithAuth(`/branch-templates/upload/${branchTestId}`, {
        method: 'POST',
        body: formData,
        headers: {} // Use empty headers to let browser set the correct Content-Type with boundary
      });

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload template: ${error.message}`);
      } else {
        throw new Error('Failed to upload template: Unknown error');
      }
    }
  }

  async getTemplateInfo(branchTestId: number): Promise<TemplateResponse> {
    try {
      const response = await fetchWithAuth(`/branch-templates/info/${branchTestId}`, {
        method: 'GET',
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get template info: ${error.message}`);
      } else {
        throw new Error('Failed to get template info: Unknown error');
      }
    }
  }

  async deleteTemplate(branchTestId: number): Promise<TemplateResponse> {
    try {
      const response = await fetchWithAuth(`/branch-templates/${branchTestId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete template: ${error.message}`);
      } else {
        throw new Error('Failed to delete template: Unknown error');
      }
    }
  }

  async downloadTemplate(branchTestId: number): Promise<Blob> {
    try {
      const blob = await fetchWithAuth(`/branch-templates/${branchTestId}`, {
        method: 'GET',
      }, 0, 'blob');

      return blob;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to download template: ${error.message}`);
      } else {
        throw new Error('Failed to download template: Unknown error');
      }
    }
  }

  getTemplateDownloadUrl(branchTestId: number): string {
    return `${this.baseUrl}/branch-templates/${branchTestId}`;
  }
}

export const branchTemplateService = new BranchTemplateService(); 