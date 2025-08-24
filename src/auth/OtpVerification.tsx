import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Keyboard,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { saveUserInfoToFirestore } from '../redux/action/userActions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import messaging from '@react-native-firebase/messaging';
import { createTheme,RH,RW,RFValue } from '../utils/theme';
import Button from '../components/Button';
import firestore from '@react-native-firebase/firestore';
import { UpdateisLoggedin } from '../redux/action/action';
import SmsRetriever from 'react-native-sms-retriever';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';  // ✅ Correct import


const OtpVerification = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);

  const { confirmation: initialConfirmation, phoneNumber, selectedCode }: any = route.params || {};
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(
    initialConfirmation || null
  );

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = Array.from({ length: 6 }, () => useRef<TextInput>(null));

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [inlineError, setInlineError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otp = otpDigits.join('');

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // ✅ OTP Listener (Android SMS Retriever)
  useEffect(() => {
    if (Platform.OS === 'android') {
      SmsRetriever.startSmsRetriever()
        .then(() => {
          console.log('SMS Retriever started');
          SmsRetriever.addSmsListener((event) => {
            console.log("event = >>",event)
            if (!event || !event.message) return;

            console.log('SMS Event:', event.message);
            const match = event.message.match(/^\d{6}/);
            if (match) {
              handleFullOtp(match[0]);
            }
            SmsRetriever.removeSmsListener();
          });
        })
        .catch((error) => console.log('SmsRetriever error:', error));

      return () => {
        SmsRetriever.removeSmsListener();
      };
    }
  }, []);

  const handleFullOtp = (code: string) => {
    const digits = code.split('');
    setOtpDigits(digits);

    setTimeout(() => {
      handleVerifyOtp(code);
    }, 300);
  };

  const handleVerifyOtp = async (manualOtp?: string) => {
    setInlineError('');
    const code = manualOtp || otpDigits.join('');

    if (code.length !== 6) {
      setInlineError('Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await confirmation?.confirm(code);
      const user = result?.user;

      // ✅ Get FCM token
      const fcmToken = await messaging().getToken();

      // ✅ Save or update Firestore user
      const userQuery = await firestore().collection('users').where('phone', '==', phoneNumber).get();

      let userData;
      if (!userQuery.empty) {
        const existingUser = userQuery.docs[0].data();
        userData = { ...existingUser, fcmToken: fcmToken || '' };
      } else {
        userData = {
          uid: user?.uid,
          phone: phoneNumber,
          phoneAuth: true,
          googleAuth: false,
          fcmToken: fcmToken || '',
          createdAt: firestore.FieldValue.serverTimestamp(),
        };
        await firestore().collection('users').doc(user?.uid).set(userData);
      }

      await dispatch(saveUserInfoToFirestore(userData) as any);
      dispatch(UpdateisLoggedin(true));
    } catch (error: any) {
      console.error('OTP verify error:', error);

      if (error.code === 'auth/invalid-verification-code') {
        setInlineError('Invalid OTP code.');
      } else if (error.code === 'auth/session-expired') {
        setInlineError('OTP expired. Please request a new one.');
      } else {
        setInlineError('Verification failed. Try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      setIsResending(true);
      setOtpDigits(['', '', '', '', '', '']);
      setInlineError('');

      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      const e164Phone = `${selectedCode}${cleanedPhone}`;
      const newConfirmation = await auth().signInWithPhoneNumber(e164Phone);

      setConfirmation(newConfirmation);
      dispatch({ type: 'SET_CONFIRMATION', payload: newConfirmation });

      setResendTimer(60);
      setCanResend(false);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      setErrorModalMessage(error?.message || 'Failed to resend OTP. Please try again.');
      setShowErrorModal(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/\D/g, '');
    const digit = cleanText.slice(0, 1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < otpInputs.length - 1) {
      otpInputs[index + 1].current?.focus();
    }

    if (inlineError) setInlineError('');

    if (newDigits.every((d) => d && d.trim().length > 0)) {
      Keyboard.dismiss();
      handleVerifyOtp(newDigits.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const newDigits = [...otpDigits];

      if (otpDigits[index]) {
        newDigits[index] = '';
        setOtpDigits(newDigits);
      } else if (index > 0) {
        otpInputs[index - 1].current?.focus();
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false} scrollEnabled={false}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: theme.card }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.text }]}>Enter Code</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We have sent you an SMS with the code{'\n'}
              to {phoneNumber}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otpDigits.map((digit, idx) => (
              <View key={idx} style={styles.otpInputWrapper}>
                <TextInput
                  ref={otpInputs[idx]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  style={[
                    styles.otpInput,
                    {
                      borderColor: digit ? theme.primary : theme.border,
                      backgroundColor: theme.card,
                      color: theme.text,
                    },
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectionColor={theme.primary}
                  textContentType="oneTimeCode"   // iOS autofill
                  autoComplete="sms-otp"          // iOS autofill bar
                />
              </View>
            ))}
          </View>

          {inlineError ? <Text style={[styles.errorText, { color: theme.error }]}>{inlineError}</Text> : null}

          <TouchableOpacity
            style={[styles.resendContainer, !canResend && styles.resendContainerDisabled]}
            onPress={handleResendOtp}
            disabled={isResending || !canResend}
          >
            <Text style={[styles.resendText, { color: canResend ? theme.primary : theme.textSecondary }]}>
              {canResend ? (isResending ? 'Resending...' : 'Resend Code') : `Resend in ${resendTimer}s`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.primary, opacity: isVerifying ? 0.7 : 1 }]}
            onPress={handleVerifyOtp}
            disabled={isVerifying}
          >
            <Text style={[styles.doneButtonText, { color: theme.card }]}>
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.alertModal, { backgroundColor: theme.card }]}>
            <Ionicons name="close-circle" size={32} color={theme.error} />
            <Text style={[styles.alertTitle, { color: theme.error }]}>Error</Text>
            <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{errorModalMessage}</Text>
            <Button title="OK" onPress={() => setShowErrorModal(false)} style={styles.alertButton} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingHorizontal: RW(20) },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: RH(25) },
  backButton: { width: RW(40), height: RW(40), borderRadius: RW(20), justifyContent: 'center', alignItems: 'center' },
  titleContainer: { alignItems: 'center', marginBottom: RH(40), marginTop: RH(120) },
  title: { fontSize: RFValue(24), fontWeight: '500', marginBottom: RH(8) ,fontFamily:"Lato-Bold"},
  subtitle: { fontSize: RFValue(16), textAlign: 'center', lineHeight: RFValue(22) ,fontFamily:"Lato-Regular"},
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: RH(30) },
  otpInputWrapper: { width: RW(50), height: RW(50), padding: 0 },
  otpInput: { width: '100%', height: '100%', borderWidth: 1, borderRadius: 8, textAlign: 'center', fontSize: RFValue(20), fontWeight: '600' },
  errorText: { fontSize: RFValue(14), textAlign: 'center', marginBottom: RH(20) },
  resendContainer: { alignItems: 'center', marginBottom: RH(10) },
  resendText: { fontSize: RFValue(16), fontWeight: '700',fontFamily:"Inter_28pt-Regular", },
  resendContainerDisabled: { opacity: 0.5 },
  doneButton: { padding: RW(16), borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  doneButtonText: { fontSize: RFValue(16), fontWeight: '500',fontFamily:"Lato-Regular"},
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: RW(20) },
  alertModal: { borderRadius: 16, padding: RW(24), width: '100%', maxWidth: RW(320), alignItems: 'center' },
  alertTitle: { fontSize: RFValue(20), fontWeight: '700', marginBottom: RH(8) },
  alertMessage: { fontSize: RFValue(16), textAlign: 'center', marginBottom: RH(24), lineHeight: RFValue(24) },
  alertButton: { minWidth: RW(120) },
});


export default OtpVerification;

