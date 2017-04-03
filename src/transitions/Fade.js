
export default {
  out: value => ({
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  }),
  in: value => ({ opacity: value }),
  useNativeDriver: true,
};
