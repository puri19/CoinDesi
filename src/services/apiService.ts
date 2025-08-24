import networkService, { NetworkState } from '../utils/networkService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  networkError?: boolean;
}

export interface ApiRequestOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  showNetworkAlert?: boolean;
}

class ApiService {
  private baseTimeout = 10000;
  private maxRetries = 3;
  private retryDelay = 1000;

  /**
   * Wraps any async operation with network checking
   */
  async withNetworkCheck<T>(
    operation: () => Promise<T>,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    console.log('ApiService: withNetworkCheck called');
    
    try {
      // Check network connectivity first
      console.log('ApiService: Checking network connection...');
      const networkState = await networkService.checkConnection();
      console.log('ApiService: Network state:', networkState);
      
      if (!networkState.isConnected || !networkState.isInternetReachable) {
        console.log('ApiService: Network check failed - offline');
        return {
          success: false,
          error: 'No internet connection available',
          networkError: true,
        };
      }

      console.log('ApiService: Network check passed - online, executing operation');
      
      // Execute the operation with timeout
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.baseTimeout)
        ),
      ]);

      console.log('ApiService: Operation completed successfully');
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      console.error('ApiService: Error in withNetworkCheck:', error);
      
      // Handle network-specific errors
      if (error.message === 'Network request failed' || 
          error.message === 'fetch failed' ||
          error.message === 'timeout') {
        return {
          success: false,
          error: 'Network request failed. Please check your connection.',
          networkError: true,
        };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        networkError: false,
      };
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    console.log('ApiService: withRetry called');
    
    const {
      retryCount = this.maxRetries,
      retryDelay = this.retryDelay,
    } = options;

    let lastError: any;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        console.log(`ApiService: Retry attempt ${attempt + 1}/${retryCount + 1}`);
        
        const result = await this.withNetworkCheck(operation, options);

        if (result.success) {
          console.log('ApiService: Operation succeeded on attempt', attempt + 1);
          return result;
        }

        // If it's a network error and we have retries left, wait and retry
        if (result.networkError && attempt < retryCount) {
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`ApiService: Network error, waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Check if network is back before retrying
          const networkState = await networkService.checkConnection();
          if (!networkState.isConnected || !networkState.isInternetReachable) {
            console.log('ApiService: Still offline, skipping this attempt');
            continue; // Skip this attempt if still offline
          }
        } else {
          console.log('ApiService: Not retryable or no retries left, returning error');
          return result; // Return error if not retryable or no retries left
        }
      } catch (error) {
        console.error(`ApiService: Error on attempt ${attempt + 1}:`, error);
        lastError = error;

        if (attempt < retryCount) {
          const delay = retryDelay * Math.pow(2, attempt);
          console.log(`ApiService: Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.log('ApiService: All retry attempts failed');
    return {
      success: false,
      error: lastError?.message || 'Operation failed after all retries',
      networkError: true,
    };
  }

  /**
   * Wait for network connection before executing operation
   */
  async waitForNetwork<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<ApiResponse<T>> {
    try {
      const connected = await networkService.waitForConnection(timeoutMs);

      if (!connected) {
        return {
          success: false,
          error: 'Network connection timeout',
          networkError: true,
        };
      }

      return await this.withNetworkCheck(operation);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to wait for network',
        networkError: true,
      };
    }
  }

  /**
   * Check if currently online
   */
  async isOnline(): Promise<boolean> {
    const networkState = await networkService.checkConnection();
    return networkState.isConnected && networkState.isInternetReachable;
  }

  /**
   * Get current network state
   */
  async getNetworkState(): Promise<NetworkState> {
    return await networkService.checkConnection();
  }
}

export const apiService = new ApiService();

// Convenience functions
export const withNetworkCheck = <T>(operation: () => Promise<T>) =>
  apiService.withNetworkCheck(operation);

export const withRetry = <T>(operation: () => Promise<T>, options?: ApiRequestOptions) =>
  apiService.withRetry(operation, options);

export const waitForNetwork = <T>(operation: () => Promise<T>, timeoutMs?: number) =>
  apiService.waitForNetwork(operation, timeoutMs);
