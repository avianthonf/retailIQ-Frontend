/**
 * Backend Connection Test
 */
import { apiClient } from '@/api/client';

export async function testBackendConnection() {
  try {
    console.log('Testing backend connection to:', import.meta.env.VITE_API_BASE_URL);
    
    // Test a simple GET request to check if backend is reachable
    const response = await apiClient.get('/health');
    
    console.log('Backend connection successful:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Backend is reachable'
    };
  } catch (error: unknown) {
    console.error('Backend connection failed:', error);
    
    const err = error as { code?: string; message?: string; response?: { status?: number } };
    
    // Check if it's a network error
    if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
      return {
        success: false,
        error: 'Backend is not running or unreachable',
        details: err.message
      };
    }
    
    // Check if it's an auth error (backend is running but requires auth)
    if (err.response?.status === 401) {
      return {
        success: true,
        message: 'Backend is running but requires authentication',
        note: 'This is expected behavior'
      };
    }
    
    return {
      success: false,
      error: 'Unexpected error',
      details: err.message ?? String(error)
    };
  }
}
