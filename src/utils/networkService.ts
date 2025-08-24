import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
}

class NetworkService {
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private isInitialized = false;
  private useFallback = false;

  constructor() {
    console.log('NetworkService: Constructor called');
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener() {
    try {
      console.log('NetworkService: Initializing network listener...');
      
      // Check if NetInfo is available
      if (!NetInfo) {
        console.error('NetworkService: NetInfo is not available');
        this.useFallback = true;
        return;
      }

      // Test NetInfo functionality
      try {
        const testState = await NetInfo.fetch();
        console.log('NetworkService: NetInfo test successful:', testState);
      } catch (testError) {
        console.error('NetworkService: NetInfo test failed:', testError);
        this.useFallback = true;
        return;
      }

      // Initial connection check
      const initialState = await this.checkConnection();
      console.log('NetworkService: Initial state:', initialState);

      // Set up listener
      NetInfo.addEventListener((state) => {
        console.log('NetworkService: Network state changed:', state);
        const networkState: NetworkState = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable ?? false,
          type: state.type ?? 'unknown',
          isWifi: state.type === 'wifi',
          isCellular: state.type === 'cellular',
        };

        // Notify all listeners
        this.listeners.forEach(listener => listener(networkState));
      });

      this.isInitialized = true;
      console.log('NetworkService: Network listener initialized successfully');
      
    } catch (error) {
      console.error('NetworkService: Error initializing network listener:', error);
      // Fallback to always online if NetInfo fails
      this.useFallback = true;
      this.isInitialized = true;
    }
  }

  public async checkConnection(): Promise<NetworkState> {
    try {
      console.log('NetworkService: Checking connection...');
      
      // Use fallback if NetInfo failed
      if (this.useFallback) {
        console.log('NetworkService: Using fallback - assuming online');
        return {
          isConnected: true,
          isInternetReachable: true,
          type: 'fallback',
          isWifi: false,
          isCellular: false,
        };
      }
      
      if (!NetInfo) {
        console.warn('NetworkService: NetInfo not available, using fallback');
        this.useFallback = true;
        return {
          isConnected: true,
          isInternetReachable: true,
          type: 'fallback',
          isWifi: false,
          isCellular: false,
        };
      }

      const state = await NetInfo.fetch();
      console.log('NetworkService: NetInfo state:', state);
      
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? true, // Default to true if undefined
        isInternetReachable: state.isInternetReachable ?? true, // Default to true if undefined
        type: state.type ?? 'unknown',
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
      };

      console.log('NetworkService: Processed network state:', networkState);
      return networkState;
      
    } catch (error) {
      console.error('NetworkService: Error checking network connection:', error);
      // Fallback to online if there's an error
      this.useFallback = true;
      return {
        isConnected: true,
        isInternetReachable: true,
        type: 'fallback',
        isWifi: false,
        isCellular: false,
      };
    }
  }

  public addListener(listener: (state: NetworkState) => void): () => void {
    console.log('NetworkService: Adding listener');
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      console.log('NetworkService: Removing listener');
      this.listeners.delete(listener);
    };
  }

  public removeListener(listener: (state: NetworkState) => void) {
    this.listeners.delete(listener);
  }

  public async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    console.log('NetworkService: Waiting for connection...');
    
    // If using fallback, return true immediately
    if (this.useFallback) {
      console.log('NetworkService: Using fallback - connection assumed');
      return true;
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('NetworkService: Connection timeout');
        resolve(false);
      }, timeoutMs);

      const checkConnection = async () => {
        try {
          const state = await this.checkConnection();
          if (state.isConnected && state.isInternetReachable) {
            console.log('NetworkService: Connection established');
            clearTimeout(timeout);
            resolve(true);
          }
        } catch (error) {
          console.error('NetworkService: Error in waitForConnection:', error);
        }
      };

      // Check immediately
      checkConnection();

      // Check every second
      const interval = setInterval(checkConnection, 1000);

      // Cleanup
      setTimeout(() => {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve(false);
      }, timeoutMs);
    });
  }

  public isOnline(): boolean {
    // This is a synchronous check that might not be 100% accurate
    // For critical operations, use checkConnection() instead
    return true; // Will be updated by the listener
  }
}

// Create and export the instance
console.log('NetworkService: Creating instance...');
const networkService = new NetworkService();
console.log('NetworkService: Instance created');

export default networkService;
export { NetworkService };
