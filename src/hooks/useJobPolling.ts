/**
 * src/hooks/useJobPolling.ts
 * Oracle Document sections consumed: 3.2, 5.12
 * Last item from Section 11 risks addressed here: Job status polling consistency
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

// Job polling configuration options
export interface JobPollingOptions<TData> {
  // Polling interval in milliseconds for active jobs
  interval?: number;
  // Maximum time to wait before timing out
  timeout?: number;
  // Callback when timeout occurs
  onTimeout?: () => void;
  // Custom function to extract status from job data
  getStatus?: (data: TData) => string | undefined;
  // Custom function to determine if job is terminal
  isTerminal?: (status: string) => boolean;
  // Additional query options
  queryOptions?: Omit<UseQueryOptions<TData>, 'refetchInterval' | 'enabled'>;
}

// Default terminal states
const DEFAULT_TERMINAL_STATES = ['FAILED', 'COMPLETED', 'CANCELLED', 'EXPIRED'];

// Default status extractor - looks for status property
const defaultGetStatus = <TData>(data: TData): string | undefined => {
  if (data && typeof data === 'object' && 'status' in data) {
    return String((data as { status: unknown }).status);
  }
  return undefined;
};

// Default terminal state checker
const defaultIsTerminal = (status: string): boolean => 
  DEFAULT_TERMINAL_STATES.includes(status.toUpperCase());

/**
 * Reusable hook for polling job status
 * Automatically stops polling when job reaches terminal state or times out
 */
export function useJobPolling<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  enabled: boolean,
  options: JobPollingOptions<TData> = {}
) {
  const {
    interval = 3000,
    timeout,
    onTimeout,
    getStatus = defaultGetStatus,
    isTerminal = defaultIsTerminal,
    queryOptions = {}
  } = options;

  // Track start time for timeout
  const startTime = Date.now();

  return useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: (query) => {
      // Check if we've timed out
      if (timeout && Date.now() - startTime > timeout) {
        onTimeout?.();
        return false;
      }

      // Get current status
      const data = query.state.data;
      if (!data) {
        // If no data, keep polling
        return interval;
      }
      
      const status = getStatus(data);
      if (!status) {
        // If no status, keep polling
        return interval;
      }

      // Stop polling if terminal state
      return isTerminal(status) ? false : interval;
    },
    staleTime: 0, // Always fetch fresh data
    ...queryOptions,
  });
}
