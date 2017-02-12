
export default {
  out: value => ({
    opacity: value.interpolate({
      inputRange: [0, 0.5, 0.5, 1],
      outputRange: [1, 1, 0, 0],
    }),
    backfaceVisibility: 'hidden',
    transform: [{
      perspective: 1000,
    }, {
      rotateY: value.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  }),

  in: value => ({
    opacity: value.interpolate({
      inputRange: [0, 0.5, 0.5, 1],
      outputRange: [0, 0, 1, 1],
    }),
    backfaceVisibility: 'hidden',
    transform: [{
      perspective: 1000,
    }, {
      rotateY: value.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
      }),
    }],
  }),
};
