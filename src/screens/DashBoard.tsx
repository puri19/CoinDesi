import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import React, { useRef, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { createTheme } from '../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DashBoard = () => {
  const navigation = useNavigation();
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  const insets = useSafeAreaInsets(); // 👈 handles notch + nav bar + gesture spacing

  // Animation refs
  const logoScale = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Section */}
      <View style={[styles.topContainer, { marginTop: insets.top + height * 0.02 }]}>
        <Animated.Image
          source={require('./../assets/coindesi_white_fill.png')}
          style={[
            styles.logoImage,
            { transform: [{ scale: logoScale }] },
          ]}
          resizeMode="contain"
        />
        <Animated.Text
          style={[
            styles.logoText,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
              color: theme.primary,
            },
          ]}
        >
          COINDESI
        </Animated.Text>
      </View>

      {/* Bottom Section */}
      <View style={[styles.container2, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ translateY: buttonTranslateY }],
            width: '100%',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={[
              styles.WelcomeButton,
              {
                borderColor: theme.primary,
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => (navigation as any).navigate('Login')}
          >
            <Text style={[styles.welcomeText, { color: theme.card }]}>
              Welcome
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default DashBoard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topContainer: {
    alignItems: 'center',
  },
  logoImage: {
    height: height * 0.25,
    width: width * 0.5,
  },
  logoText: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    letterSpacing: width * 0.04,
    marginTop: 10,
  },
  WelcomeButton: {
    height: 50,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 5,
  },
  welcomeText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    letterSpacing: width * 0.015,
  },
  container2: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});
