import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import messaging from '@react-native-firebase/messaging';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { createTheme, RFValue, RW, RH } from '../utils/theme';
import Button from '../components/Button';
import ShimmerEffect from '../components/ShimmerEffect';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { UpdateisLoggedin, UpdateSkip, uploadUserinfo } from '../redux/action/action';
import OtpVerification from './OtpVerification';
import { Keyboard } from "react-native";

const Login = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const handleSkipValue = useSelector((state: any) => state.user.skip)
  console.log("skip", handleSkipValue)

  // Get current theme based on dark mode state
  const theme = createTheme(isDarkMode);

  const [phoneNo, setPhoneNo] = useState('');

  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [countryCodes, setCountryCodes] = useState<Array<{ name: string; dialCode: string; code: string }>>([]);
  const [selectedCode, setSelectedCode] = useState('+91');
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [loginisTrue, setLoginisTrue] = useState(false);



  // Animation values
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1027380469055-9oh24gpfgudqb1eh7ticqebs2enjhm2i.apps.googleusercontent.com',
      offlineAccess: true,
    });

    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    logoScale.value = withSpring(1, { damping: 8, stiffness: 100 });

    fetchCountryCodes();
  }, []);

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
      console.error('Error fetching country codes:', error);
    }
  };

  const showError = (msg: string) => {
    setErrorModalMessage(msg);
    setShowErrorModal(true);
  };

  const showSuccess = (msg: string) => {
    setSuccessModalMessage(msg);
    setShowSuccessModal(true);
  };
  useEffect(() => {
    if (__DEV__) {
      // false = real OTP verification even in dev; true = auto verify OTP
      auth().settings.appVerificationDisabledForTesting = false;
    }
  }, []);

  const handleSendOtp = async () => {
    try {
      if (otpLoading) return; // prevent multiple taps

      const formattedPhone = selectedCode + phoneNo;

      // Basic phone number validation (10-15 digits to cover international numbers)
      if (!/^\d{10,15}$/.test(phoneNo)) {
        showError("Please enter a valid phone number.");
        return;
      }

      setOtpLoading(true);

      // Send OTP using Firebase internal verification (invisible)
      const confirmation = await auth().signInWithPhoneNumber(formattedPhone);

      setOtpSuccess(true);
      setTimeout(() => setOtpSuccess(false), 2000);

      // Navigate to OTP verification screen
      (navigation as any).navigate('OtpVerification', {
        confirmation,
        phoneNumber: phoneNo,
        userinfo: null,
        selectedCode: selectedCode,
      });
    } catch (error: any) {
      console.error("OTP send error:", error);
      showError(
        error?.message ||
        "Failed to send OTP. Make sure your device has Play Services and a valid SHA key."
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      setGoogleLoading(true); await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      userInfo.idToken = tokens.idToken; if (!userInfo.idToken) throw new Error('No ID token found');
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;
      const fcmToken = await messaging().getToken();
      const emailQuery = await firestore().collection('users').where('email', '==', user.email).get();
      if (!emailQuery.empty) {
        const existingUser = emailQuery.docs[0].data();
        dispatch(uploadUserinfo({ uid: existingUser.uid, name: existingUser.name || '', email: existingUser.email || '', phone: existingUser.phone || '', fcmToken: fcmToken || '', googleAuth: existingUser.googleAuth || '', profileImageUrl: existingUser.profileImageUrl || existingUser.photoURL || '', }));
      }
      else { await firestore().collection('users').doc(user.uid).set({ uid: user.uid, name: user.displayName || '', email: user.email || '', phone: user.phoneNumber || '', fcmToken: fcmToken || '', profileImageUrl: user.photoURL || '', googleAuth: true, createdAt: firestore.FieldValue.serverTimestamp(), }); dispatch(uploadUserinfo({ uid: user.uid, name: user.displayName || '', email: user.email || '', phone: user.phoneNumber || '', fcmToken: fcmToken || '', profileImageUrl: user.photoURL || '', googleAuth: true, isLoggedIn: true, })); }
       dispatch(UpdateisLoggedin(true))
    } catch (error) { console.log('Google login error:', error); showError('Google Sign-in failed. Please try again.'); } finally { setGoogleLoading(false); }
  };

  const handleSkip = () => {
    dispatch(UpdateSkip(false))
    navigation.navigate('Home' as never);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      <View style={[styles.gradientBackground, { backgroundColor: theme.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.logoBackground, { backgroundColor: theme.card }]}>
              <Image
                source={require('../assets/loginlogo-removebg-preview.png')}
                style={styles.logo}
                resizeMode="contain"

              />
            </View>
            {/* Skip Button */}
            {
              handleSkipValue && <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
              </TouchableOpacity>
            }


            {/* Login Form */}
            <Animated.View style={[styles.formContainer, animatedStyle, { marginTop: handleSkipValue ? 130 : 160, }]}>
              <View style={styles.formCard}>
                <Text style={[styles.formTitle, { color: theme.text }]}>Log in</Text>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.phoneInputRow}>
                    <TouchableOpacity
                      style={[styles.countryCodeButton, {
                        borderColor: theme.border,
                        backgroundColor: theme.card
                      }]}
                      onPress={() => setShowModal(true)}
                    >
                      <Text style={[styles.countryCodeText, { color: theme.text }]}>{selectedCode}</Text>
                      <Ionicons name="chevron-down" size={16} color={theme.text} />
                    </TouchableOpacity>

                    <TextInput
                      value={phoneNo}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');
                        setPhoneNo(cleaned);

                        if (cleaned.length === 10) {
                          Keyboard.dismiss();   // ✅ close keyboard when 10 digits entered
                        }
                      }}
                      style={[
                        styles.phoneInput,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.card,
                          color: theme.text,
                        },
                      ]}
                      placeholder="Enter phone number"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {otpSuccess && (
                    <View >
                      <Text style={[styles.otpSuccessText]}>OTP sent successfully,please check your phone</Text>
                    </View>
                  )}
                </View>


                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={handleSendOtp}>
                    <Text style={[styles.primaryButtonText, { color: "white" }]}>
                      {otpLoading ? 'Sending OTP...' : 'Send OTP'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.orContainer}>
                    <View style={[styles.orLine, { backgroundColor: theme.border }]}></View>
                    <Text style={[styles.orText, { color: theme.textSecondary }]}>or</Text>
                    <View style={[styles.orLine, { backgroundColor: theme.border }]}></View>
                  </View>

                  <Button
                    title="Continue with Google"
                    onPress={onGoogleButtonPress}
                    variant="ghost"
                    loading={googleLoading}
                    icon={<Image source={require('../assets/google.jpg')} style={{ height: 26, width: 28, borderRadius: 40 }} />}
                    style={[styles.googleButton, {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      color: "black"
                    }]}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Country Code Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countryCodes}
              keyExtractor={(item, index) => item.code + index}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setSelectedCode(item.dialCode);
                    setShowModal(false);
                  }}
                >
                  <Text style={[styles.countryName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.countryCode, { color: theme.textSecondary }]}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: theme.card }]}>
            <Ionicons name="alert-circle" size={48} color={theme.error} />
            <Text style={[styles.alertTitle, { color: theme.text }]}>Error</Text>
            <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{errorModalMessage}</Text>
            <Button
              title="OK"
              onPress={() => setShowErrorModal(false)}
              style={styles.alertButton}
            />
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: theme.card }]}>
            <Ionicons name="checkmark-circle" size={48} color={theme.success} />
            <Text style={[styles.alertTitle, { color: theme.text }]}>Success</Text>
            <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>{successModalMessage}</Text>
            <Button
              title="OK"
              onPress={() => setShowSuccessModal(false)}
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
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: RW(20),
    paddingTop: Platform.OS === 'ios' ? RH(20) : RH(40),
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: RW(12),
  },
  skipText: {
    fontSize: RFValue(16),
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: RH(40),
  },
  logoBackground: {
    position: "absolute",
    width: RW(80),
    height: RW(80),
    borderRadius: RW(40),
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(16),
    top: RH(150),
    right: RH(-60)
  },
  logo: {
    opacity: 0.2,
    height: RH(250)

  },
  logoText: {
    fontSize: RFValue(40),
  },
  appTitle: {
    fontSize: RFValue(28),
    fontWeight: '700',
    marginBottom: RH(8),
  },
  appSubtitle: {
    fontSize: RFValue(16),
    opacity: 0.8,
  },
  formContainer: {

  },
  formCard: {

  },
  formTitle: {
    fontSize: RFValue(28),
    fontWeight: "900",
    marginBottom: RH(24),
    textAlign: "left",
    fontFamily: "Lato-Bold"
  },
  inputContainer: {
    marginTop: 20,
    marginBottom: RH(20),
  },
  inputLabel: {
    fontSize: RFValue(14),
    fontWeight: '600',
    marginBottom: RH(8),
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: RW(12),
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RW(12),
    paddingVertical: RH(18),
    borderWidth: 1,
    borderRadius: 8,
    minWidth: RW(80),
  },
  countryCodeText: {
    fontSize: RFValue(16),
    fontWeight: '400',
    fontFamily: "Inter_28pt-Regular"
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: RW(12),
    paddingVertical: RH(12),
    borderWidth: 1,
    borderRadius: 8,
    fontSize: RFValue(16),
    fontFamily: "Inter_28pt-Regular"
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: RW(8),
  },
  otpInput: {
    flex: 1,
    height: RH(48),
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: RFValue(18),
    fontWeight: '600',
  },
  buttonContainer: {
    gap: RH(12),
    marginBottom: RH(20),
  },
  primaryButton: {
    width: '100%',
    padding: RW(16),
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    fontFamily: "Lato-Regular"
  },
  googleButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 30,
    padding: RW(12),
    gap: 8,
    fontWeight: 600,
    fontFamily: "Inter_28pt-SemiBold"
  },
  signupContainer: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: RFValue(14),
  },
  signupLink: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RW(20),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: RFValue(18),
    fontWeight: '600',

  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RW(16),
    borderBottomWidth: 1,
  },
  countryName: {
    fontSize: RFValue(16),
  },
  countryCode: {
    fontSize: RFValue(14),
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    borderRadius: 16,
    padding: RW(24),
    alignItems: 'center',
    marginHorizontal: RW(20),
    maxWidth: RW(300),
  },
  alertTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    marginTop: RH(12),
    marginBottom: RH(8),
  },
  alertMessage: {
    fontSize: RFValue(16),
    textAlign: 'center',
    marginBottom: RH(20),
    lineHeight: RFValue(22),
  },
  alertButton: {
    minWidth: RW(100),
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: RW(12),
    marginVertical: 10
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: RFValue(16),
  },
  otpSuccessText: {
    fontSize: RFValue(14),
    color: 'green',
    fontFamily: "lato.medium",
    fontWeight: "400"
  },
});

export default Login;