import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { updateNetworkStatus } from '../redux/action/action';
import networkService, { NetworkState } from '../utils/networkService';

interface NetworkContextType {
  networkState: NetworkState;
  isOnline: boolean;
  checkConnection: () => Promise<NetworkState>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
  });

  const dispatch = useDispatch();

  useEffect(() => {
    // Initial connection check
    const initializeNetwork = async () => {
      const state = await networkService.checkConnection();
      setNetworkState(state);
      dispatch(updateNetworkStatus(state));
    };

    initializeNetwork();

    // Subscribe to network changes
    const unsubscribe = networkService.addListener((state) => {
      setNetworkState(state);
      dispatch(updateNetworkStatus(state));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  const checkConnection = async (): Promise<NetworkState> => {
    const state = await networkService.checkConnection();
    setNetworkState(state);
    dispatch(updateNetworkStatus(state));
    return state;
  };

  const waitForConnection = async (timeoutMs: number = 10000): Promise<boolean> => {
    return networkService.waitForConnection(timeoutMs);
  };

  const value: NetworkContextType = {
    networkState,
    isOnline: networkState.isConnected && networkState.isInternetReachable,
    checkConnection,
    waitForConnection,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
