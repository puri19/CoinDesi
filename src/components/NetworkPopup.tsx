import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createTheme, RFValue, RW, RH } from '../utils/theme';
import Button from './Button';


interface NetworkPopupProps {
  visible: boolean;
  onClose: () => void;
  onRetry: () => void;
  isDarkMode?: boolean;
}

const NetworkPopup: React.FC<NetworkPopupProps> = ({
  visible,
  onClose,
  onRetry,
  isDarkMode = false,
}) => {
  const theme = createTheme(isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
            <Ionicons
              name="wifi-outline"
              size={48}
              color={theme.error}
            />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            No Internet Connection
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            Please check your internet connection and try again. You need an active connection to load articles and content.
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Retry"
              onPress={onClose}
              style={styles.retryButton}
              textStyle={{
                fontFamily: 'lato.medium',   // custom font family
                fontWeight: '400',    // bold
                fontSize: 14          // optional font size
              }}
            />
            <Button
              title="Close"
              onPress={onClose}
              variant="outline"
              size="small"
              style={styles.closeButton}
              textStyle={{
                fontFamily: 'lato.medium',   // custom font family
                fontWeight: '400',    // bold
                fontSize: 14          // optional font size
              }}
            />

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: RW(24),
    alignItems: 'center',
    marginHorizontal: RW(20),
    maxWidth: RW(320),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: RW(80),
    height: RW(80),
    borderRadius: RW(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(16),
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: '400',
    marginBottom: RH(8),
    textAlign: 'center',
    fontFamily: "lato.semibold"
  },
  message: {
    fontSize: RFValue(16),
    textAlign: 'center',
    marginBottom: RH(24),
    lineHeight: RFValue(22),
    fontFamily: "lato.medium",
    fontWeight: "400"
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: RW(12),
  },
  retryButton: {
    minWidth: RW(100),

  },
  closeButton: {
    minWidth: RW(100),
  },
});

export default NetworkPopup;

