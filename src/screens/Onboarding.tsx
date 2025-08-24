import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { createTheme, RFValue, RW, RH } from '../utils/theme';
import Logo from '../assets/Logo.png';
import Logo3 from '../assets/icon_image.png';
import Logo2 from '../assets/icon2.png';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UpdateonboardingDone } from '../redux/action/action';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlideType {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string[];
}

// Precompute all responsive dimensions used in animated styles outside of worklets
const DOT_SMALL = RW(8);
const DOT_LARGE = RW(24);
const DOT_HEIGHT = RH(8);
const DOT_RADIUS = RW(4);
const DOT_MARGIN = RW(4);

const Onboarding = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch()
  const isDarkMode = useSelector((state: any) => state.theme.isDarkMode);
  const theme = createTheme(isDarkMode);
  

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const insets = useSafeAreaInsets();

  const onboardingData: OnboardingSlideType[] = [
    {
      id: '1',
      title: 'Welcome to CoinDesi',
      description:
       " Your gateway to India’s crypto pulse. Stay informed, stay ahead.",
      icon: Logo,
      gradient: theme.gradient.primary,
    },
    {
      id: '2',
      title: 'Discover Crypto News',
      description:
        'Quick, clear, and to the point crypto updates under 60 words.',
      icon: Logo2,
      gradient: theme.gradient.secondary,
    },
    {
      id: '3',
      title: 'Track Events & Conferences',
      description:
        'Explore events, connect with people, and grow your crypto network.',
      icon: Logo3,
      gradient: theme.gradient.accent,
    },
  ];

  const OnboardingSlide = React.memo(
    ({ item, index }: { item: OnboardingSlideType; index: number }) => {
      const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];
        return {
          opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
          transform: [
            {
              scale: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP),
            },
          ],
        };
      });

      return (
        <View style={[styles.slide, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={[styles.gradientBackground, { backgroundColor: theme.background }]}>
            <View>
              <View style={styles.groupContainer}>
                <Image
                  source={require('../assets/Group.png')}
                  style={styles.group}
                  resizeMode="stretch"
                />
              </View>
              <Image source={item.icon} style={styles.logo} resizeMode="contain" />

              <Animated.View style={[styles.textContainer, animatedStyle]}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                  {item.description}
                </Text>
              </Animated.View>
            </View>
          </View>
        </View>
      );
    }
  );

  const PaginationDots = React.memo(() => (
    <View style={[styles.paginationContainer, { bottom: DOT_HEIGHT * 12}]}>
      {onboardingData.map((_, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];
          return {
            width: interpolate(scrollX.value, inputRange, [DOT_SMALL, DOT_LARGE, DOT_SMALL], Extrapolate.CLAMP),
            height: DOT_HEIGHT,
            borderRadius: DOT_RADIUS,
            marginHorizontal: DOT_MARGIN,
            opacity: interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolate.CLAMP),
          };
        });
        return (
          <Animated.View
            key={index}
            style={[styles.paginationDot, { backgroundColor: '#0068ff' }, animatedStyle]}
          />
        );
      })}
    </View>
  ));

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      dispatch(UpdateonboardingDone(true));
      AsyncStorage.getItem("onboardingDone").then(v => console.log("Saved onboardingDone:", v));
      
    }
  };

  const handleSkip = () => navigation.navigate('Login' as never);

  const handleButtonPress = () => {
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });
    handleNext();
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
        translucent
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          renderItem={({ item, index }) => <OnboardingSlide item={item} index={index} />}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          onMomentumScrollEnd={(e) =>
            setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
          }
          scrollEventThrottle={16}
        />

        <PaginationDots />

        <View style={[styles.bottomContainer, { bottom: RH(45) + insets.bottom }]}>
          <TouchableOpacity
            onPress={handleButtonPress}
            style={[styles.nextButton, { backgroundColor: theme.primary, borderColor: theme.border }]}
          >
            <Text style={[styles.nextButtonText, { color: theme.card }]}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
  },
  gradientBackground: { flex: 1 },
  textContainer: {
    maxWidth: RW(300),
    alignSelf: 'center',
    position: 'absolute',
    top: '85%',
  },
  title: {
    fontSize: RFValue(22),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: RH(16),
    lineHeight: RFValue(40),
   fontFamily:"Lato-Bold"
  },
  description: {
    fontSize: RFValue(18),
    textAlign: 'center',
    lineHeight: RFValue(26),
    opacity: 0.9,
    fontFamily:"Lato-Regular"
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  paginationDot: {},
  bottomContainer: {
    flexDirection: 'row',
    position: 'absolute',
    left: RW(20),
    right: RW(20),
    justifyContent: 'flex-end',
  },
  nextButton: {
    width: '25%',
    borderWidth: 1,
    borderRadius: 8,
    padding: RW(12),
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: RFValue(16),
    fontWeight: '500',
    fontFamily:"lato.medium"
  },
  groupContainer: {
    width: RW(700),
    height: RH(500),
    top: RH(-100),
  },
  group: { width: RW(380), height: '100%' },
  logo: { width: RW(220), height: RW(220), position: 'absolute', left: RW(85), top: RH(100) },
});

export default Onboarding;
