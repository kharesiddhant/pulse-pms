import { config } from '../config';
import { fetchWithAuth } from '../lib/api';

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
}

export interface NavigationResponse {
  navigation: NavigationItem[];
  user_type: string;
}

// Backend response wrapper
interface BackendNavigationResponse {
  success: boolean;
  data: NavigationResponse;
}

class NavigationService {
  private baseUrl = config.apiBaseUrl;

  async getNavigation(): Promise<NavigationResponse> {
    try {
      const response: BackendNavigationResponse = await fetchWithAuth('/auth/navigation', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Extract the data from the backend response
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch navigation: ${error.message}`);
      } else {
        throw new Error('Failed to fetch navigation: Unknown error');
      }
    }
  }
}

export const navigationService = new NavigationService(); 