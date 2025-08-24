import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  SafeAreaView,
  AppState,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { updateProfileImage, uploadUserinfo, clearUser, UpdateisLoggedin } from '../redux/action/action';
import { toggleTheme } from '../redux/action/themeActions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { createTheme, RFValue } from '../utils/theme';
import Button from '../components/Button';
import LoginPrompt from '../components/LoginPrompt';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LogoutModal from '../components/LogoutModal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Linking } from 'react-native';
import { checkNotifications } from 'react-native-permissions';

import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
const RW = val => wp((val / 375) * 100);
const RH = val => hp((val / 812) * 100);

// Custom hook for AppState management
const useAppState = (onForeground) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        onForeground?.();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove?.();
    };
  }, [onForeground]);
};

const Profilepage = () => {
  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editphone, setEditPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [title, setTitle] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState('info');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const userInfo = useSelector((state) => state.user.userinfo);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const navigation = useNavigation();

  const theme = createTheme(isDarkMode);

  // Animation values
  const profileScale = useSharedValue(1);
  const profileOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(RH(50));
  const cardOpacity = useSharedValue(0);
  const successAlertOpacity = useSharedValue(0);
  const successAlertScale = useSharedValue(0.8);

  // Enhanced notification permission check
  const checkNotificationPermission = async () => {
    try {
      const { status } = await checkNotifications();
      const isGranted = status === 'granted';
      
      // Only update state if it actually changed to prevent unnecessary re-renders
      if (pushNotifications !== isGranted) {
        setPushNotifications(isGranted);
        
        // Optional: Show a brief message when permission changes
        if (isGranted) {
          console.log('✅ Notifications enabled');
        } else {
          console.log('❌ Notifications disabled');
        }
      }
      
      return isGranted;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  };

  // Restore app state from AsyncStorage
  const restoreAppState = async () => {
    try {
      // Restore user preferences, settings, etc.
      const savedNotificationPref = await AsyncStorage.getItem('notificationPref');
      if (savedNotificationPref !== null) {
        setPushNotifications(JSON.parse(savedNotificationPref));
      }
      
      // Restore other app state as needed
      const savedUserData = await AsyncStorage.getItem('userinfo');
      if (savedUserData && !userInfo) {
        const userData = JSON.parse(savedUserData);
        dispatch(uploadUserinfo(userData));
      }
    } catch (error) {
      console.error('Error restoring app state:', error);
    }
  };

  // Save app state to AsyncStorage
  const saveAppState = async () => {
    try {
      await AsyncStorage.setItem('notificationPref', JSON.stringify(pushNotifications));
      // Save other important state
    } catch (error) {
      console.error('Error saving app state:', error);
    }
  };

  // Handle app foreground events
  const handleAppForeground = async () => {
    console.log('📱 App returned to foreground');
    
    // Check and refresh notification permissions
    await checkNotificationPermission();
    
    // Restore any lost state
    await restoreAppState();
    
    // Refresh user data if needed
    if (userInfo?.uid) {
      try {
        const userDoc = await firestore().collection('users').doc(userInfo.uid).get();
        if (userDoc.exists) {
          const freshUserData = userDoc.data();
          dispatch(uploadUserinfo({ uid: userInfo.uid, ...freshUserData }));
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  // Use the custom AppState hook
  useAppState(handleAppForeground);

  useEffect(() => {
    profileOpacity.value = withTiming(1, { duration: 800 });
    profileScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    const timer = setTimeout(() => {
      cardOpacity.value = withTiming(1, { duration: 600 });
      cardTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userInfo && !userInfo.profileImageUrl) {
      setImageLoading(false);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userInfo) {
      setEditName(userInfo.name || '');
      setEditEmail(userInfo.email || '');
      setEditPhone(userInfo.phone || '');
    }
  }, [userInfo]);

  // Enhanced initialization
  useEffect(() => {
    const initializeApp = async () => {
      // Configure Google Sign In
      GoogleSignin.configure({
        webClientId: '1027380469055-9oh24gpfgudqb1eh7ticqebs2enjhm2i.apps.googleusercontent.com',
        offlineAccess: true,
      });

      // Initial permission check and state restore
      await checkNotificationPermission();
      await restoreAppState();
    };

    initializeApp();
  }, []);

  // Save state when important values change
  useEffect(() => {
    saveAppState();
  }, [pushNotifications]);

  const showSuccessMessage = (title, message) => {
    setTitle(title);
    setSuccessMessage(message);
    setShowSuccessAlert(true);

    successAlertOpacity.value = withTiming(1, { duration: 300 });
    successAlertScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    setTimeout(() => {
      hideSuccessMessage();
    }, 3000);
  };

  const hideSuccessMessage = () => {
    successAlertOpacity.value = withTiming(0, { duration: 300 });
    successAlertScale.value = withSpring(0.8, { damping: 12, stiffness: 100 });

    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 300);
  };

  const onGoogleButtonPress = async (userInfo) => {
    try {
      const googleUser = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        showSuccessMessage("error", "Google login failed: No ID token found.");
        return;
      }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const currentUser = auth().currentUser;

      try {
        await currentUser.linkWithCredential(googleCredential);
        showSuccessMessage(
          "success",
          "🎉 Your Google account has been successfully linked!"
        );
      } catch (error) {
        switch (error.code) {
          case "auth/credential-already-in-use":
            await auth().signInWithCredential(googleCredential);
            showSuccessMessage(
              "info",
              "This Google account was already linked. You are now signed in."
            );
            break;

          case "auth/provider-already-linked":
            showSuccessMessage(
              "warning",
              "⚠️ Your account is already linked with Google."
            );
            break;

          case "auth/email-already-in-use":
            showSuccessMessage(
              "error",
              "This email is already used by another account."
            );
            return;

          default:
            console.error("Google link error:", error);
            showSuccessMessage(
              "error",
              error.message || "Something went wrong while linking Google."
            );
            return;
        }
      }

      const googleName = googleUser.user?.name || "User";
      const googlePhoto = googleUser.user?.photo || null;
      const googleEmail = googleUser.user?.email;
      const { uid } = auth().currentUser;

      const querySnapshot = await firestore()
        .collection("users")
        .where("email", "==", googleEmail)
        .get();

      if (!querySnapshot.empty && querySnapshot.docs[0].id !== uid) {
        showSuccessMessage(
          "error",
          "This email is already associated with another account."
        );
        return;
      }

      const updatedUser = {
        uid,
        phone: userInfo.phone,
        email: googleEmail,
        name: googleName,
        profileImageUrl:
          googlePhoto ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(googleName)}`,
        googleAuth: true,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection("users")
        .doc(uid)
        .set(updatedUser, { merge: true });

      await AsyncStorage.setItem("userinfo", JSON.stringify(updatedUser));
      dispatch(uploadUserinfo(updatedUser));

      showSuccessMessage(
        "success",
        "Profile updated with your Google account!"
      );
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      showSuccessMessage(
        "error",
        "Something went wrong during Google sign in. Please try again."
      );
    }
  };

  const handleProfileImageUpload = async () => {
    if (!userInfo?.uid) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (!result.assets?.length || !result.assets[0].uri) return;

      setUploading(true);

      const uri = result.assets[0].uri;
      const fileName = `profile_photos/${userInfo.uid}.jpg`;
      const reference = storage().ref(fileName);

      await reference.putFile(uri);
      const downloadURL = await reference.getDownloadURL();

      await firestore()
        .collection('users')
        .doc(userInfo.uid)
        .set({ profileImageUrl: downloadURL }, { merge: true });

      dispatch(updateProfileImage(downloadURL));
      setImageLoading(true);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', 'Failed to upload profile photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editEmail.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (!userInfo?.uid) {
      Alert.alert('Error', 'User information not found.');
      return;
    }

    setIsUpdating(true);
    try {
      await firestore().collection('users').doc(userInfo.uid).update({
        name: editName.trim(),
        email: editEmail.trim(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      const updatedUserInfo = {
        ...userInfo,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editphone.trim(),
      };
      dispatch(uploadUserinfo(updatedUserInfo));

      setShowEditModal(false);
      showSuccessMessage('Profile updated successfully!', "Success");
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(userInfo?.name || '');
    setEditEmail(userInfo?.email || '');
    setShowEditModal(false);
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();

      await AsyncStorage.multiRemove([
        'user_data',
        'user_preferences',
        'auth_tokens',
        'fcm_token',
        'userinfo',
        'skip',
        'isLoggedin',
        'notificationPref',
      ]);

      dispatch(clearUser());
      dispatch(UpdateisLoggedin(false));
    } catch (error) {
      console.error('Error during logout:', error);
      dispatch(clearUser());
      navigation.navigate('profile');
    }
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  // Enhanced notification settings handler
  const handlePushNotificationToggle = () => {
    Alert.alert(
      "Change Notification Settings",
      "To update notification permissions, you'll be redirected to your phone's settings. After making changes, return to the app and the settings will be automatically refreshed.",
      [
        { 
          text: "Go to Settings", 
          onPress: () => {
            openSettingsLink();
            // The permission will be auto-checked when user returns via AppState listener
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openSettingsLink = () => {
    if (Platform.OS === "android") {
      try {
        if (Platform.Version >= 26) {
          Linking.openSettings();
        } else {
          Linking.openURL("app-settings:");
        }
      } catch (e) {
        console.log("Failed to open notification settings:", e);
        Linking.openSettings();
      }
    } else {
      Linking.openSettings();
    }
  };

  // Animation styles
  const profileAnimatedStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [{ scale: profileScale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const successAlertAnimatedStyle = useAnimatedStyle(() => ({
    opacity: successAlertOpacity.value,
    transform: [{ scale: successAlertScale.value }],
  }));

  const handleTermandCondition = () => {
    let url = "https://coindesi.ai/terms-conditions/"
    navigation.navigate('Browser', { url: url });
  };

  const handlePrivacyandPolicy = () => {
    let url = "https://coindesi.ai/privacy-policy/"
    navigation.navigate('Browser', { url: url });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ['#1E293B', '#334155'] : ['#4A90E2', '#2E5BDA']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Home', { screen: 'Discover' })}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <View
          style={{
            height: userInfo?.uid ? RH(550) : RH(650),
            borderTopRightRadius: RW(10),
            borderTopLeftRadius: RW(10),


          }}

        >
          <View
            style={[
              styles.mainContainer,
              {
                backgroundColor: theme.card,
                height: userInfo?.uid ? RH(715) : RH(810),
                elevation: 10,
                shadowColor: theme.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 4.65,
              },
            ]}
          >
            {/* Profile Card */}
            <Animated.View
              style={[
                styles.profileCard,
                cardAnimatedStyle,
                {
                  backgroundColor: theme.card,
                  borderBottomColor: theme.border,
                  height: userInfo?.uid ? RH(135) : RH(300),
                },
              ]}
            >
              {userInfo && userInfo.uid ? (
                <View style={styles.profileCardContent}>
                  <View style={styles.profileImageContainer}>
                    {userInfo?.profileImageUrl ? (
                      <Image
                        style={styles.profileImage}
                        source={{ uri: userInfo.profileImageUrl }}
                        onLoadEnd={() => setImageLoading(false)}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" color="#666" size={RFValue(40)} />
                      </View>
                    )}
                    {imageLoading && userInfo?.profileImageUrl && (
                      <ActivityIndicator
                        style={StyleSheet.absoluteFill}
                        size="large"
                        color="#4A90E2"
                      />
                    )}
                    <TouchableOpacity
                      style={styles.cameraButton}
                      onPress={handleProfileImageUpload}
                      activeOpacity={0.8}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <MaterialCommunityIcons name="camera" color="white" size={RFValue(16)} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={[styles.userName, { color: theme.text }]}>
                      {userInfo?.name || 'Hi User'}
                    </Text>
                    {userInfo.email && (
                      <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                        {userInfo?.email}
                      </Text>
                    )}
                    {userInfo.phone && (
                      <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                        +91 {userInfo?.phone}
                      </Text>
                    )}
                  </View>




                  {userInfo.phoneAuth ? (
                    <TouchableOpacity
                      disabled={!!(userInfo.name && userInfo.phone && userInfo.email)} // disables if all are present
                      onPress={() =>
                        userInfo.phoneAuth ? onGoogleButtonPress(userInfo) : handleEditProfile()
                      }
                    >
                      <Image
                        source={require('../assets/google.jpg')}
                        style={{ height: 40, width: 48, borderRadius: 40, opacity: userInfo.name && userInfo.phone && userInfo.email ? 0.5 : 1 }}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: theme.primary, opacity: userInfo.name && userInfo.phone && userInfo.email ? 0.5 : 1 },
                      ]}
                      disabled={!!(userInfo.name && userInfo.phone && userInfo.email)} // disables if all are present
                      onPress={() =>
                        userInfo.phoneAuth ? onGoogleButtonPress(userInfo) : handleEditProfile()
                      }
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}


                </View>
              ) : (
                <View style={styles.loginCardContent}>
                  <Ionicons name="person-circle-outline" color={theme.primary} size={RFValue(64)} />
                  <Text style={[styles.loginTitle, { color: theme.text }]}>Welcome to Coindesi</Text>
                  <Text style={[styles.loginSubtitle, { color: theme.textSecondary }]}>
                    Sign in to access your profile
                  </Text>
                  <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: theme.primary }]}
                    onPress={() => (navigation as any).navigate('Login')}
                  >
                    <Text style={[styles.loginButtonText,{fontFamily:"lato.medium"}]}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Menu Options */}
            <Animated.View style={[styles.menuContainer, cardAnimatedStyle, { backgroundColor: theme.card }]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('Liked')}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="bookmark-outline" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Saved Stories</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => (navigation as any).navigate('Events')}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="calendar-outline" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Events</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </Animated.View>

            <View style={[styles.menuSeparator, { backgroundColor: theme.border }]} />

            {/* Settings with Toggles */}
            <View style={[styles.settingsContainer, { backgroundColor: theme.card }]}>
              <View style={styles.settingItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="notifications-outline" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Push notifications</Text>
                </View>
                <Switch
                  value={pushNotifications}
                  onValueChange={handlePushNotificationToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="white"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="moon-outline" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Dark mode</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleThemeToggle}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="white"
                />
              </View>
            </View>

            <View style={[styles.menuSeparator, { backgroundColor: theme.border }]} />

            {/* Additional Menu */}
            <Animated.View style={[styles.menuContainer, cardAnimatedStyle, { backgroundColor: theme.card }]}>
              <TouchableOpacity style={styles.menuItem} onPress={handleTermandCondition}>
                <View style={styles.menuItemLeft} >
                  <Ionicons name="document-text" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Terms and Conditions</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyandPolicy}>
                <View style={styles.menuItemLeft}>
                  <MaterialIcons name="privacy-tip" size={24} color={theme.text} />
                  <Text style={[styles.menuItemText, { color: theme.text }]}>Privacy & Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>


            </Animated.View>

            {userInfo && userInfo.uid ? (
              <>
                <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModalVisible(true)}>
                  <Ionicons name="exit-outline" size={24} color="#EF4444" />
                  <Text style={[styles.logoutText, { color: '#EF4444' }]}>Logout</Text>
                </TouchableOpacity>
                <LogoutModal
                  visible={logoutModalVisible}
                  onConfirm={() => {
                    setLogoutModalVisible(false);
                    handleLogout();
                  }}
                  onCancel={() => setLogoutModalVisible(false)}
                  theme={theme}
                />
              </>
            ) : null}

            {/* Footer Links */}
            <View style={styles.footerContainer}>
              <TouchableOpacity style={styles.footerLink}>
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>Version 1.0.0 </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={handleCancelEdit}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Name</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                {userInfo.googleAuth && (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Phone No.</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editphone}
                      onChangeText={setEditPhone}
                      placeholder="Enter your Phone no."
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      autoCapitalize="none"
                    />
                  </View>
                )}

                {userInfo.phoneAuth && (
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.background,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      value={editEmail}
                      onChangeText={setEditEmail}
                      placeholder="Enter your email"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalFooter}>
                <Button title="Cancel" onPress={handleCancelEdit} variant="outline"
                  size="small" style={styles.modalButton}
                  textStyle={{
                    fontFamily: 'lato.medium',   // custom font family
                    fontWeight: '400',    // bold
                    fontSize: 14          // optional font size
                  }} />
                <Button
                  title={isUpdating ? "Saving..." : "Save"}
                  onPress={handleSaveProfile}
                  loading={isUpdating}
                  disabled={isUpdating}
                  size="small"
                  style={styles.modalButton}
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

        {/* Success Alert */}
        {showSuccessAlert && (
          <Animated.View style={[styles.successAlertOverlay, successAlertAnimatedStyle]}>
            <View style={[styles.successAlert, { backgroundColor: theme.card }]}>
              <View style={styles.successIconContainer}>
                <Image source={require('../assets/google.jpg')} style={{ height: 26, width: 28, borderRadius: 40 }} />
              </View>
              <Text style={[styles.successAlertTitle, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.successAlertMessage, { color: theme.textSecondary }]}>{successMessage}</Text>
              <View style={styles.successProgressBar}>
                <View style={styles.successProgressFill} />
              </View>
              <TouchableOpacity style={styles.successCloseButton} onPress={hideSuccessMessage}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Login Prompt Modal */}
        <LoginPrompt
          visible={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          title="You need to log in to continue"
          message="Please sign in to upload profile images and access all features."
          isDarkMode={isDarkMode}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    height: RH(250),
    paddingTop: Platform.OS === 'ios' ? RH(50) : RH(100),
    paddingHorizontal: RW(20),
    borderBottomLeftRadius: RW(20),
    borderBottomRightRadius: RW(20),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: RH(20),
    left: RW(5),
    justifyContent: 'space-between',
    flex: 1,
  },
  backButton: {
    width: RW(40),
    height: RH(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: RFValue(22),
    color: 'white',
    flex: 1,
    marginLeft: RW(10),
    fontFamily: "Lato-Regular",
    fontWeight: "500"
  },
  headerSpacer: {
    width: RW(40),
  },
  mainContainer: {
    position: 'absolute',
    width: '90%',
    backgroundColor: 'white',
    marginHorizontal: RW(20),
    borderRadius: RW(15),
    bottom: RH(5),
    borderTopRightRadius: RW(10),
    borderTopLeftRadius: RW(10),
  },
  profileCard: {
    position: 'relative',
    width: '100%',
    padding: RW(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: RW(8),
    elevation: 4,
    borderBottomWidth: 1,
    borderTopLeftRadius: RW(10),
    borderTopRightRadius: RW(10),
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopRightRadius: RW(10),
    borderTopLeftRadius: RW(10),
  },
  loginCardContent: {
    alignItems: 'center',
    paddingVertical: RH(20),
    borderTopRightRadius: RW(10),
    borderTopLeftRadius: RW(10),
  },
  loginTitle: {
    fontSize: RFValue(24),
    fontWeight: '500',
    marginTop: RH(16),
    marginBottom: RH(8),
    fontFamily: "lato.semibold"
  },
  loginSubtitle: {
    fontSize: RFValue(16),
    textAlign: 'center',
    marginBottom: RH(24),
    fontFamily: "lato.medium"

  },
  loginButton: {
    paddingVertical: RH(12),
    paddingHorizontal: RW(24),
    borderRadius: RW(20),
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "Inter_28pt-Regular",
    fontWeight: "400"
  },
  loginButtonText: {
    color: 'white',
    fontSize: RFValue(16),
    fontWeight: '300',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: RW(16),
  },
  profileImage: {
    width: RW(80),
    height: RW(80),
    borderRadius: RW(40),
  },
  profileImagePlaceholder: {
    width: RW(80),
    height: RW(80),
    borderRadius: RW(40),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: RH(-2),
    right: RW(-2),
    backgroundColor: '#4A90E2',
    borderRadius: RW(15),
    width: RW(30),
    height: RW(30),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: RFValue(20),
    color: '#333',
    marginBottom: RH(4),
    fontFamily: "Lato-Regular",
    fontWeight: "500"
  },
  userEmail: {
    fontSize: RFValue(10),
    color: '#666',
    fontFamily: "Lato-Regular",
    fontWeight: "400"
  },
  editButton: {

    paddingHorizontal: RW(20),
    paddingVertical: RH(8),
    borderRadius: RW(20),

  },
  editButtonText: {
    color: 'white',
    fontSize: RFValue(14),
    fontFamily: "Lato-Regular",
    fontWeight: "400"
  },
  menuContainer: {
    position: 'relative',
    backgroundColor: 'white',
    marginBottom: RH(16),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RH(16),
    paddingHorizontal: RW(20),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: RFValue(16),
    color: '#333',
    marginLeft: RW(16),
    fontFamily: "Lato-Regular",
    fontWeight: "500"
  },
  menuSeparator: {
    height: RH(1),
    backgroundColor: '#F0F0F0',
    width: '95%',
    alignSelf: 'center',
  },
  settingsContainer: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: RW(16),
    marginBottom: RH(16),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: RH(16),
    paddingHorizontal: RW(20),
  },
  logoutButton: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: RH(1),
    paddingHorizontal: RW(20),
    marginBottom: RH(30),
  },
  logoutText: {
    fontSize: RFValue(16),
    color: '#EF4444',
    marginLeft: RW(16),
    fontFamily: "lato.medium"
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: RH(40),
  },
  footerLink: {
    paddingVertical: RH(8),
  },
  footerText: {
    fontSize: RFValue(14),
    color: '#666',
    textAlign: 'center',
    fontFamily: "Lato-Regular",
    fontWeight: "500"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: RW(20),
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: RW(16),
    padding: RW(24),
    width: '100%',
    maxWidth: RW(400),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RH(24),
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: '400',
    color: '#333',
    fontFamily: "lato.semibold"
  },
  modalBody: {
    marginBottom: RH(24),
  },
  inputContainer: {
    marginBottom: RH(16),
  },
  inputLabel: {
    fontSize: RFValue(14),
    fontWeight: '400',
    color: '#333',
    marginBottom: RH(8),
    fontFamily: "lato.medium"
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RW(8),
    paddingHorizontal: RW(12),
    paddingVertical: RH(12),
    fontSize: RFValue(16),
    fontFamily: "lato.medium",
    fontWeight: '400'
  },
  modalFooter: {
    flexDirection: 'row',
    gap: RW(12),
  },
  modalButton: {
    flex: 1,
  },
  successAlertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successAlert: {
    backgroundColor: 'white',
    borderRadius: RW(16),
    padding: RW(24),
    marginHorizontal: RW(20),
    maxWidth: RW(320),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: RH(4) },
    shadowOpacity: 0.25,
    shadowRadius: RW(12),
    elevation: 8,
  },
  successIconContainer: {
    width: RW(60),
    height: RW(60),
    borderRadius: RW(30),
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: RH(16),
  },
  successAlertTitle: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#333',
    marginBottom: RH(8),
  },
  successAlertMessage: {
    fontSize: RFValue(16),
    color: '#666',
    textAlign: 'center',
    lineHeight: RFValue(22),
  },
  successCloseButton: {
    position: 'absolute',
    top: RH(12),
    right: RW(12),
    width: RW(32),
    height: RW(32),
    borderRadius: RW(16),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successProgressBar: {
    width: '100%',
    height: RH(3),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: RW(2),
    marginTop: RH(16),
    overflow: 'hidden',
  },
  successProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: RW(2),
    width: '100%',
  },
});

export default Profilepage;
