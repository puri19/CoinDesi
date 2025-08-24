import { Dimensions } from 'react-native';

let wp, hp;

try {
  // Try to import the real functions
  const {
    widthPercentageToDP,
    heightPercentageToDP
  } = require('react-native-responsive-dimensions');

  wp = widthPercentageToDP;
  hp = heightPercentageToDP;
} catch (error) {
  console.warn('react-native-responsive-dimensions not found, using fallback functions');

  // Fallback: calculate manually
  const { width, height } = Dimensions.get('window');
  wp = (percent) => {
    const num = parseFloat(percent);
    return (width * num) / 100;
  };
  hp = (percent) => {
    const num = parseFloat(percent);
    return (height * num) / 100;
  };
}

export { wp, hp };
