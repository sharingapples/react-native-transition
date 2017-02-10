import { Animated } from 'react-native';

const timedAnimation = (value, toValue, { duration }) => new Promise((resolve, reject) => {
  Animated.timing(value, {
    toValue,
    duration: duration || 500,
  }).start((complete) => {
    if (complete) {
      resolve();
    } else {
      reject(new Error('Interrupted'));
    }
  });
});

export default timedAnimation;
