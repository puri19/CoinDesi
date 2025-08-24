// withNetworkCheck.tsx
import React, { ComponentType, useCallback, useState } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import NetworkPopup from '../components/NetworkPopup';

interface WithNetworkCheckOptions {
  showAlert?: boolean;
  retryOnReconnect?: boolean;
  isDarkMode?: boolean;
}

export function withNetworkCheck<T extends object>(
  WrappedComponent: ComponentType<T>,
  options: WithNetworkCheckOptions = {}
) {
  const {
    showAlert = true,
    retryOnReconnect = true,
    isDarkMode = false,
  } = options;

  return function WithNetworkCheckComponent(props: T) {
    const { isOnline, waitForConnection } = useNetwork();
    const [popupVisible, setPopupVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<any>) | null>(null);

    const checkNetworkBeforeAction = useCallback(
      async (action: () => Promise<any>, retryCount: number = 0): Promise<any> => {
        if (!isOnline) {
          if (showAlert) {
            setPendingAction(() => action);
            setPopupVisible(true);
          }
          throw new Error('No internet connection');
        }

        try {
          return await action();
        } catch (error) {
          if (retryOnReconnect && retryCount < 3) {
            await new Promise(res => setTimeout(res, 1000 * (retryCount + 1)));
            return checkNetworkBeforeAction(action, retryCount + 1);
          }
          throw error;
        }
      },
      [isOnline, showAlert, retryOnReconnect]
    );

    const handleRetry = async () => {
      setPopupVisible(false);
      if (pendingAction) {
        const connected = await waitForConnection(5000);
        if (connected) {
          await pendingAction();
        } else {
          setPopupVisible(true);
        }
      }
    };

    return (
      <>
        <WrappedComponent {...props} checkNetworkBeforeAction={checkNetworkBeforeAction} />
        <NetworkPopup
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
          onRetry={handleRetry}
          isDarkMode={isDarkMode}
        />
      </>
    );
  };
}

// Hook version
export function useNetworkCheck(isDarkMode: boolean = false) {
  const { isOnline, waitForConnection } = useNetwork();
  const [popupVisible, setPopupVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<any>) | null>(null);

  const checkNetworkBeforeAction = useCallback(
    async (action: () => Promise<any>, retryCount: number = 0): Promise<any> => {
      if (!isOnline) {
        setPendingAction(() => action);
        setPopupVisible(true);
        throw new Error('No internet connection');
      }

      try {
        return await action();
      } catch (error) {
        if (retryCount < 3) {
          await new Promise(res => setTimeout(res, 1000 * (retryCount + 1)));
          return checkNetworkBeforeAction(action, retryCount + 1);
        }
        throw error;
      }
    },
    [isOnline]
  );

  const handleRetry = async () => {
    setPopupVisible(false);
    if (pendingAction) {
      const connected = await waitForConnection(5000);
      if (connected) {
        await pendingAction();
      } else {
        setPopupVisible(true);
      }
    }
  };

  return {
    checkNetworkBeforeAction,
    isOnline,
    NetworkPopupUI: (
      <NetworkPopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onRetry={handleRetry}
        isDarkMode={isDarkMode}
      />
    ),
  };
}
