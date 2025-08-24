import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { THEME, RFValue, RW, RH } from '../utils/theme';
import Button from '../components/Button';

const Signup = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  // State management
  const [countryCodes, setCountryCodes] = useState<Array<{ name: string; dialCode: string; code: string }>>([]);
  const [selectedCode, setSelectedCode] = useState('+91');
  const [showModal, setShowModal] = useState(false);
  const [showAccountExistsModal, setShowAccountExistsModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [userinfo, setUserinfo] = useState({
    uid: '',
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({
    uid: '',
    email: '',
    name: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd");
        const data = await res.json();
        const countryList = data
          .filter((item: any) => item.idd?.root && item.idd?.suffixes?.length > 0)
          .map((item: any) => ({
            name: item.name.common,
            dialCode: `${item.idd.root}${item.idd.suffixes[0]}`,
            code: item.cca2,
          }))
          .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name));
        setCountryCodes(countryList);
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountryCodes();
  }, []);

  const handleSignUp = async () => {
    let newErrors = { uid: '', email: '', name: '', phone: '', password: '' };
    let hasError = false;

    if (!userinfo.email) {
      newErrors.email = 'Please fill in your email.';
      hasError = true;
    }
    if (!userinfo.name) {
      newErrors.name = 'Please fill in your name.';
      hasError = true;
    }
    if (!userinfo.phone) {
      newErrors.phone = 'Please fill in your phone number.';
      hasError = true;
    }
    if (!userinfo.password) {
      newErrors.password = 'Please fill in your password.';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    const fullPhone = selectedCode + userinfo.phone.replace(/[^0-9]/g, '');

    try {
      const firestore = require('@react-native-firebase/firestore').default;
    
      // Check phone number
      const phoneQuerySnapshot = await firestore()
        .collection('users')
        .where('phone', '==', userinfo.phone)
        .get();
    
      if (!phoneQuerySnapshot.empty) {
        setErrors(prev => ({ ...prev, phone: 'This phone number is already registered.' }));
        setShowAccountExistsModal(true);
        setLoading(false);
        return;
      }
    
      // Check email
      const emailQuerySnapshot = await firestore()
        .collection('users')
        .where('email', '==', userinfo.email)
        .get();
    
      if (!emailQuerySnapshot.empty) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
        setShowAccountExistsModal(true);
        setLoading(false);
        return;
      }
    
    } catch (error) {
      setErrorModalMessage('Error checking phone or email.');
      setShowErrorModal(true);
      setLoading(false);
      return;
    }
      
    try {
      const fcmToken = await messaging().getToken();
      const updatedUserInfo = {
        ...userinfo,
        uid: userinfo.uid,
        fullPhone,
        fcm_token: fcmToken,
      };

      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
      (navigation as any).navigate('OtpVerification', { confirmation, userinfo: updatedUserInfo });
    } catch (error: any) {
      let userMessage = 'Failed to send OTP. Please check your phone number.';
      if (error.code === 'auth/invalid-phone-number') {
        userMessage = 'The phone number format is incorrect. Please:\n\n• Check the country code (+91, +1, etc.)\n• Ensure the number is 10 digits\n• Remove any spaces or special characters\n\nExample: +91 9876543210';
      } else if (error.code === 'auth/too-many-requests') {
        userMessage = 'Too many attempts detected. For your security:\n\n• Please wait 15-30 minutes\n• Try again later\n• This helps prevent spam\n\nWe apologize for the inconvenience.';
      } else if (error.message) {
        userMessage = error.message;
      }
      setErrorModalMessage(userMessage);
      setShowErrorModal(true);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={THEME.gradient.primary}
            style={styles.gradientContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={THEME.card} />
              </TouchableOpacity>
            </View>

            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Ionicons name="person-add" size={RFValue(48)} color={THEME.card} />
              </View>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Coindesi to stay updated with crypto news</Text>
            </View>
          </LinearGradient>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={userinfo.email}
                  onChangeText={(value) => { 
                    setUserinfo({ ...userinfo, email: value }); 
                    setErrors(e => ({ ...e, email: '' })); 
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={THEME.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Name Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={userinfo.name}
                  onChangeText={(value) => { 
                    setUserinfo({ ...userinfo, name: value }); 
                    setErrors(e => ({ ...e, name: '' })); 
                  }}
                  placeholder="Enter your name"
                  placeholderTextColor={THEME.textSecondary}
                />
              </View>
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.phoneRow}>
                <TouchableOpacity 
                  onPress={() => setShowModal(true)} 
                  style={styles.countryCodeButton}
                >
                  <Text style={styles.countryCodeText}>{selectedCode}</Text>
                  <Ionicons name="chevron-down" size={16} color={THEME.textSecondary} />
                </TouchableOpacity>
                <View style={[styles.inputWrapper, styles.phoneInputWrapper]}>
                  <Ionicons name="call-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={userinfo.phone}
                    onChangeText={(value) => { 
                      setUserinfo({ ...userinfo, phone: value.replace(/[^0-9]/g, '') }); 
                      setErrors(e => ({ ...e, phone: '' })); 
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor={THEME.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={THEME.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={userinfo.password}
                  onChangeText={(value) => { 
                    setUserinfo({ ...userinfo, password: value }); 
                    setErrors(e => ({ ...e, password: '' })); 
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={THEME.textSecondary}
                  secureTextEntry
                />
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Sign Up Button */}
            <Button
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleSignUp}
              loading={loading}
              disabled={loading}
              style={styles.signupButton}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text 
                  style={styles.loginLink} 
                  onPress={() => navigation.navigate('Login' as never)}
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Code Modal */}
      <Modal visible={showModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={THEME.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={countryCodes}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryItem}
                onPress={() => {
                  setSelectedCode(item.dialCode);
                  setShowModal(false);
                }}
              >
                <Text style={styles.countryNameText}>{item.name}</Text>
                <Text style={styles.countryCodeText}>{item.dialCode}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Account Exists Modal */}
      <Modal visible={showAccountExistsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={32} color={THEME.warning} />
            </View>
            <Text style={styles.alertTitle}>Account Exists</Text>
            <Text style={styles.alertMessage}>
              You already have an account with this phone number or email.
            </Text>
            <View style={styles.alertButtonRow}>
              <Button
                title="Login"
                onPress={() => { 
                  setShowAccountExistsModal(false); 
                  navigation.navigate('Login' as never); 
                }}
                variant="outline"
                style={styles.alertButton}
              />
              <Button
                title="Cancel"
                onPress={() => setShowAccountExistsModal(false)}
                variant="ghost"
                style={styles.alertButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertModal}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="close-circle" size={32} color={THEME.error} />
            </View>
            <Text style={[styles.alertTitle, { color: THEME.error }]}>Error</Text>
            <Text style={styles.alertMessage}>{errorModalMessage}</Text>
            <Button
              title="OK"
              onPress={() => setShowErrorModal(false)}
              style={styles.alertButton}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  gradientContainer: {
    paddingTop: Platform.OS === 'ios' ? RH(20) : RH(40),
    paddingBottom: RH(40),
    paddingHorizontal: RW(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RH(20),
  },
  backButton: {
    width: RW(40),
    height: RW(40),
    borderRadius: RW(20),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: RH(20),
  },
  logoBackground: {
    width: RW(80),
    height: RW(80),
    borderRadius: RW(40),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(20),
    ...THEME.shadow.medium,
  },
  title: {
    fontSize: RFValue(28),
    fontWeight: '700',
    color: THEME.card,
    marginBottom: RH(8),
  },
  subtitle: {
    fontSize: RFValue(16),
    color: THEME.card,
    opacity: 0.8,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: THEME.card,
    borderTopLeftRadius: RW(24),
    borderTopRightRadius: RW(24),
    paddingHorizontal: RW(20),
    paddingTop: RH(32),
    paddingBottom: RH(20),
    ...THEME.shadow.medium,
  },
  inputContainer: {
    marginBottom: RH(20),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.background,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: RW(16),
    ...THEME.shadow.light,
  },
  inputIcon: {
    marginRight: RW(12),
  },
  input: {
    flex: 1,
    height: RH(56),
    fontSize: RFValue(16),
    color: THEME.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: RW(12),
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.background,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: RW(16),
    height: RH(56),
    minWidth: RW(80),
    ...THEME.shadow.light,
  },
  countryCodeText: {
    fontSize: RFValue(16),
    color: THEME.text,
    fontWeight: '600',
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInput: {
    flex: 1,
  },
  errorText: {
    color: THEME.error,
    fontSize: RFValue(12),
    marginTop: RH(4),
    marginLeft: RW(4),
  },
  signupButton: {
    marginTop: RH(8),
    marginBottom: RH(24),
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: RFValue(16),
    color: THEME.textSecondary,
  },
  loginLink: {
    color: THEME.primary,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RW(20),
    paddingVertical: RH(16),
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: '600',
    color: THEME.text,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: RW(20),
    paddingVertical: RH(16),
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  countryNameText: {
    fontSize: RFValue(16),
    color: THEME.text,
  },
  // Alert Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RW(20),
  },
  alertModal: {
    backgroundColor: THEME.card,
    borderRadius: THEME.borderRadius.xl,
    padding: RW(24),
    width: '100%',
    maxWidth: RW(320),
    alignItems: 'center',
    ...THEME.shadow.heavy,
  },
  alertIconContainer: {
    width: RW(60),
    height: RW(60),
    borderRadius: RW(30),
    backgroundColor: THEME.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(16),
  },
  alertTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: THEME.text,
    marginBottom: RH(8),
  },
  alertMessage: {
    fontSize: RFValue(16),
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: RH(24),
    lineHeight: RFValue(24),
  },
  alertButtonRow: {
    flexDirection: 'row',
    gap: RW(12),
    width: '100%',
  },
  alertButton: {
    flex: 1,
  },
});

export default Signup;