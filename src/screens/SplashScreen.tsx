import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { createTheme, RFValue } from '../utils/theme';
// NEW: Safe area context for status bar & nav bar insets
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Responsive scaling helpers
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
const RW = (val) => (width * val) / 100;
const RH = (val) => (height * val) / 100;

const SplashScreen = () => {
  const navigation = useNavigation();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);

  // NEW: Get device safe area insets (top, bottom, etc.)
  const insets = useSafeAreaInsets();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const gradientOpacity = useSharedValue(0);

  const startAnimations = async () => {
    logoScale.value = 0;
    logoOpacity.value = 0;
    textOpacity.value = 0;
    textTranslateY.value = 30;
    gradientOpacity.value = 0;

    gradientOpacity.value = withTiming(1, { duration: 500 });
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withSpring(1.1, { damping: 8, stiffness: 100 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
    await new Promise((resolve) => setTimeout(resolve, 400));
    textOpacity.value = withTiming(1, { duration: 600 });
    textTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });

    setTimeout(() => {
      navigation.navigate('Onboarding');
    }, 3000);
  };

  useFocusEffect(
    useCallback(() => {
      startAnimations();
    }, [])
  );

  const gradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    // Ensure SafeAreaProvider wraps your navigation root (App.js or index.js)
    // so this hook works properly!
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,         // status bar safe
          paddingBottom: insets.bottom,   // nav bar/gesture bar safe
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
        translucent
      />

      <Animated.View style={[styles.gradientContainer, gradientAnimatedStyle]}>
        <View
          style={[styles.gradient, { backgroundColor: theme.background }]}
        >
          <View style={styles.content}>
            {/* Logo */}
            <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
              <View style={[styles.logoBackground, { backgroundColor: theme.card }]}>
                <Image
                  source={require('../assets/Logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            {/* App Name */}
            <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
              <Text style={[styles.appName, { color: theme.primary }]}>
                COINDESI
              </Text>
              <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Your Desi Crypto Companion
              </Text>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: RH(6),
  },
  logoBackground: {
    width: RW(22),
    height: RW(22),
    borderRadius: RW(11),
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: RW(34), // Fix: Should not be 40% of screen, keep it contained
    height: RW(34),
    resizeMode: 'contain',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: RW(5),
  },
  appName: {
    fontSize: RFValue(32),
    fontWeight: "900",
    letterSpacing: RW(0.5),
    marginBottom: RH(1),
    textAlign: 'center',
    fontFamily:"Lato-Bold"
  },
  tagline: {
    fontSize: RFValue(16),
    fontWeight: '500',
    opacity: 0.9,
    textAlign: 'center',
    paddingHorizontal: RW(5),
    fontFamily:"lato.medium"
  },
});
