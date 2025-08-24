import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { THEME } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShimmerEffectProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const shimmerTranslate = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(SCREEN_WIDTH, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
      opacity: interpolate(
        shimmerTranslate.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [0.3, 0.7, 0.3]
      ),
    };
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.border,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    backgroundColor: THEME.card,
  },
});

export default ShimmerEffect;
