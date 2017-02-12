export default {
  out: (value, bounds) => ({
    top: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -bounds.height],
    }),
    height: bounds.height,
  }),
  in: (value, bounds) => ({
    top: value.interpolate({
      inputRange: [0, 1],
      outputRange: [bounds.height, 0],
    }),
    height: bounds.height,
  }),
};
