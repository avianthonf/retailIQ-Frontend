/**
 * Backend Connection Test
 */
import { apiClient } from '@/api/client';

export async function testBackendConnection() {
  try {
    console.log('Testing backend connection to:', import.meta.env.VITE_API_BASE_URL);
    
    // Test a simple GET request to check if backend is reachable
    const response = await apiClient.get('/api/v1/health');
    
    console.log('Backend connection successful:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Backend is reachable'
    };
  } catch (error: any) {
    console.error('Backend connection failed:', error);
    
    // Check if it's a network error
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return {
        success: false,
        error: 'Backend is not running or unreachable',
        details: error.message
      };
    }
    
    // Check if it's an auth error (backend is running but requires auth)
    if (error.response?.status === 401) {
      return {
        success: true,
        message: 'Backend is running but requires authentication',
        note: 'This is expected behavior'
      };
    }
    
    return {
      success: false,
      error: 'Unexpected error',
      details: error.message
    };
  }
}
