import React, { Component, PropTypes } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

import defaultAnimation from './timedAnimation';
import Fade from './Fade';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  animatedContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

const defaultStyle = Fade;

class Transition extends Component {
  static propTypes = {
    /* A transition element requires a single Component element within it */
    children: PropTypes.element.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      currentItem: 0,
      children: [React.Children.only(props.children), null],
      value: new Animated.Value(0),
      animStyle: defaultStyle,
    };

    this.__bounds = null;
  }

  add(element, { style, animation }) {
    const { children, currentItem, value } = this.state;
    const animStyle = style || this.state.animStyle;
    const transitionAnimation = animation || defaultAnimation;

    const incomingItem = 1 - currentItem;
    // console.log('Transition', incomingItem, value.__getValue());
    if (children[incomingItem] === null) {
      // console.log('Start Animation');
      // Start the animation, a new item is being pushed
      transitionAnimation(value, 1, this.props, this.___bounds).then(() => {
        const newChildren = this.state.children.slice();
        newChildren[currentItem] = null;
        this.setState({
          children: newChildren,
          currentItem: incomingItem,
          value: new Animated.Value(0),
        });
      });
    }

    // Update the childrens with the newly added item
    const newChildren = children.slice();
    newChildren[incomingItem] = element;
    this.setState({
      children: newChildren,
      animStyle,
    });
  }

  __onLayout = ({ nativeEvent }) => {
    this.__bounds = nativeEvent.layout;
  }

  __renderElement = (element, idx) => {
    if (!element) {
      return null;
    }

    const { value, currentItem, animStyle } = this.state;
    const styler = idx === currentItem ? animStyle.out : animStyle.in;

    const style = styler(value, this.__bounds, this.props);
    return (
      <Animated.View key={idx} style={[styles.animatedContainer, style]}>
        {element}
      </Animated.View>
    );
  }

  render() {
    const { children } = this.state;
    return (
      <View style={styles.container} onLayout={this.__onLayout}>
        {children.map(this.__renderElement)}
      </View>
    );
  }
}

export default Transition;
