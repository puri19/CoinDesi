import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createTheme, RFValue, RW, RH } from '../utils/theme';
import Button from './Button';


interface LoginPromptProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  isDarkMode?: boolean;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({
  visible,
  onClose,
  title = "You need to log in to continue",
  message = "Please sign in to access this feature",
  isDarkMode = false,
}) => {
  const navigation = useNavigation();
  const theme = createTheme(isDarkMode);

  const handleLogin = () => {
    onClose();
  
navigation.navigate("Login")
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.card }]}>
          <Ionicons 
            name="person-circle-outline" 
            size={48} 
            color={theme.primary} 
          />
          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
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
    maxWidth: RW(300),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: '700',
    marginTop: RH(12),
    marginBottom: RH(8),
    textAlign: 'center',
  },
  message: {
    fontSize: RFValue(16),
    textAlign: 'center',
    marginBottom: RH(24),
    lineHeight: RFValue(22),
            fontFamily:"Lato-Regular",
    fontWeight:"500"
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: RW(12),
  },
  loginButton: {
    minWidth: RW(120),
    backgroundColor: '#0068ff',
    paddingHorizontal: RW(20),
    paddingVertical: RH(15),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: RFValue(16),
        fontFamily:"Lato-Regular",
    fontWeight:"500"
  },
  cancelButton: {
    minWidth: RW(100),
  },
});

export default LoginPrompt;
