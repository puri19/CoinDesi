import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const { height, width } = Dimensions.get('window')

const Cards = ({ item, isFirst, swipe, ...rest }) => {
  return (
    <Animated.View
      style={[
        styles.Container,
        {
          transform: swipe.getTranslateTransform(),
        },
      ]}
      {...rest}
    >
      <Text>
        {item.title}
      </Text>
    </Animated.View>
  )
}

export default Cards

const styles = StyleSheet.create({
  Container: {
    width: width - 20,
    height: height - 100,
    borderWidth: 2,
    alignSelf: 'center',
    position: 'absolute',
    top: 20,
    backgroundColor: '#fff', // optional, to avoid transparent flicker
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
})
