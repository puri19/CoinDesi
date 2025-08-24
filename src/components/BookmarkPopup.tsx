import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const BookmarkPopup = ({ visible, theme, item }) => {
 
  return (
    <Animated.View
      style={[
        styles.B_main_popup,
        { backgroundColor: theme.background },
        animatedStyle,
      ]}
    >
      <View style={styles.B_img_con}>
        <Image
          source={{ uri: item.image }}
          style={{ width: '100%', height: '100%', borderRadius: 30 }}
          resizeMode="cover"
        />
      </View>
      <Text style={{ color: theme.text }}>Story saved to Profile</Text>
    </Animated.View>
  );
};

export default BookmarkPopup;
const styles = StyleSheet.create({
    B_main_popup: {
      position: 'absolute',
      bottom: 10,
      height: 45,
      width: 200,
      borderRadius: 100,
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 10,
    },
    B_img_con: {
      height: 30,
      width: 30,
      borderRadius: 30,
      overflow: 'hidden',
    },
  });