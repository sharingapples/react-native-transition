import React, { Component, PropTypes } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'purple',
  },
  animatedContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

const defaultAnimation = (value, toValue) => new Promise((resolve, reject) => {
  Animated.timing(value, {
    toValue,
    duration: 1000,
  }).start((complete) => {
    if (complete) {
      resolve();
    } else {
      reject(new Error('Interrupted'));
    }
  });
});

const defaultAnimStyle = (item, value) => {
  if (item === 0) {
    // this is the outgoing animation
    return { opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }) };
  }

  // this is the incoming animation
  return { opacity: value };
};

const translateAnimStyle = (item, value) => {
  if (item === 0) {
    return { transform: [{
      scale: value.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
    }] };
    return { transform: [{ translateX: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -637],
    }) }] };
  }

  return { transform: [{ scale: value }]};
  return {
    left: value.interpolate({
      inputRange: [0, 1],
      outputRange: [637, 0],
    }),
  };

  return { transform: [{ translateX: value.interpolate({
    inputRange: [0, 1],
    outputRange: [637, 0],
  }) }] };
};

const transition = (customAnimation = null, customAnimStyle = null) => {
  const animation = customAnimation || defaultAnimation;
  const animStyle = customAnimStyle || translateAnimStyle || defaultAnimStyle;

  let instance = null;

  class MyTransition extends Component {
    constructor(props) {
      super(props);
      instance = this;

      this.value = new Animated.Value(0);

      this.currentItem = 0;
      this.state = {
        children: [React.Children.only(props.children), null],
      };
    }

    _getIncomingItem() {
      return 1 - this.currentItem;
    }

    componentWillReceiveProps(nextProps) {
      this.add(React.Children.only(nextProps.children));
    }

    add(element) {
      const { children } = this.state;

      const incomingItem = this._getIncomingItem();

      if (children[incomingItem] === null) {
        // Start the animation, a new item is being pushed
        animation(this.value, incomingItem).then(() => {
          const newChildren = this.state.children.slice();
          newChildren[this.currentItem] = null;
          this.currentItem = incomingItem;
          this.value.setValue(0);
          this.setState({
            children: newChildren,
          });
        });
      }

      const newChildren = children.slice();
      newChildren[incomingItem] = element;
      this.setState({
        children: newChildren,
      });
    }

    renderElement = (element, idx) => {
      if (!element) {
        return null;
      }

      const style = animStyle(idx === this.currentItem ? 0 : 1, this.value);
      return (
        <Animated.View key={idx} style={[styles.animatedContainer, style]}>
          {element}
        </Animated.View>
      );
    }

    render() {
      const { children } = this.state;
      return (
        <View style={styles.container}>
          {children.map(this.renderElement)}
        </View>
      );
    }
  }

  MyTransition.propTypes = {
    children: PropTypes.element.isRequired,
  };

  MyTransition.push = (element) => {
    if (instance !== null) {
      instance.push(element);
    }
  };

  return MyTransition;
};

module.exports = transition;

