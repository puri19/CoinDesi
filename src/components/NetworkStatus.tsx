import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNetwork } from '../contexts/NetworkContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createTheme, RFValue, RW, RH } from '../utils/theme';

interface NetworkStatusProps {
  showDetails?: boolean;
  onRetry?: () => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetails = false, 
  onRetry 
}) => {
  const { networkState, isOnline, checkConnection } = useNetwork();
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      await checkConnection();
    }
  };

  if (isOnline) {
    return null; // Don't show anything when online
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.error }]}>
      <View style={styles.content}>
        <Ionicons 
          name="cloud-offline-outline" 
          size={RFValue(20)} 
          color="white" 
        />
        <Text style={styles.message}>No Internet Connection</Text>
        {showDetails && (
          <Text style={styles.details}>
            {networkState.type === 'none' 
              ? 'Please check'
              : `Connected to`
            }
          </Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.retryButton} 
        onPress={handleRetry}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={RFValue(16)} color="white" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RW(16),
    paddingVertical: RH(12),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  message: {
    color: 'white',
    fontSize: RFValue(14),
    fontWeight: '600',
    marginLeft: RW(8),
  },
  details: {
    color: 'white',
    fontSize: RFValue(12),
    marginLeft: RW(8),
    opacity: 0.9,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: RW(12),
    paddingVertical: RH(6),
    borderRadius: RW(16),
  },
  retryText: {
    color: 'white',
    fontSize: RFValue(12),
    fontWeight: '500',
    marginLeft: RW(4),
  },
});

export default NetworkStatus;
