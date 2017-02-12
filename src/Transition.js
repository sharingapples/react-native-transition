import React, { Component, PropTypes } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

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

let uniqueId = 0;

const createUniqueId = () => {
  uniqueId += 1;
  return uniqueId;
};

const createTransition = (style = Fade, animation = Animated.timing) => {
  let instance = null;

  return class Transition extends Component {
    static propTypes = {
      /* A transition element requires a single Component element within it */
      children: PropTypes.element.isRequired,

      /* An optional function that is called, once the transition is completed */
      onTransitioned: PropTypes.func,
    };

    static defaultProps = {
      onTransitioned: undefined,
    }

    /**
     * A helper method to run the transition to avoid using "ref" in
     * most of the use cases. There is normally only one Transition component
     * used most of the time. In such case, this method could be used to
     * directly perform the transition on the last created Transition element.
     * For advanced and instance specific use case, use the instance method
     * instead.
     *
     * You can also provide a customStyle and customAnimation that will override
     * the default values that were provided during createTransition for this
     * one transition.
     */
    static show(element, customStyle = null, customAnimation = null) {
      if (instance === null) {
        throw new Error('No transition component rendered to show a transition');
      }

      // Start the transition
      return instance.show(element, customStyle, customAnimation);
    }

    constructor(props) {
      super(props);

      // Store the instance on the scoped variable
      instance = this;

      /**
       * How is the state being used. The children array keeps track of
       * two elements. The array consists of two elements only during the
       * transition period otherwise there is only one element and the other
       * one is null.
       *
       * To avoid the react from rendering the incoming element at the end of
       * the transition, the currentItem state is being used, which keeps
       * track of the current item within the children array. This way, we
       * could keep the most recently added element at the same position in
       * which it was added, avoiding react from rendering the incoming element
       * at the end of the transition, if the children were to be changed after
       * transition.
       */
      this.state = {
        currentItem: 0,
        bounds: null,
        children: [{
          id: createUniqueId(),
          element: React.Children.only(props.children),
        }, null],
        value: new Animated.Value(0),
        animStyle: null,
      };

      this.__animation = null;
    }

    componentWillUnmount() {
      // Stop any running animation, we don't want setState to be called
      // on a unmounted component
      if (this.__animation) {
        this.__animation.stop();
        this.__animation = null;
      }
    }

    /**
     * Instance method to run the transition. Use this method instead of
     * the static helper method, if more than one Transition instance is
     * expected to be created. Specially when Transition is included within
     * inner views, that might be recreated with every render. Even in
     * such cases, the static helper method could be used, if the method
     * is not being invoked on a regular interval like via timers.
     */
    show(element, customStyle = null, customAnimation = null) {
      const { children, currentItem, value } = this.state;
      const { onTransitioned } = this.props;

      // Get the animation to be used
      const transitionAnimation = customAnimation || animation;

      // Get the complementary value
      const incomingItem = 1 - currentItem;

      if (children[incomingItem] === null) {
        // A new item has been pushed, we are going to start an animation.
        // In case, there was already a transition taking place, the incoming
        // item will simply replace the last added item, which can make the
        // animation look abrupt

        // Create a config parameter for the animation, taking in the values
        // provided as the parameters for customizability. But always run the
        // the value form 0 to 1.
        const config = Object.assign({}, this.props, {
          toValue: 1,
        });

        this.__animation = transitionAnimation(value, config);
        this.__animation.start((complete) => {
          this.__animation = null;

          // Once the animation is complete, maintain the stable
          // state
          if (complete) {
            const newChildren = this.state.children.slice();
            newChildren[currentItem] = null;
            this.setState({
              children: newChildren,
              currentItem: incomingItem,
              value: new Animated.Value(0),
            });

            // Also perform a callback
            if (onTransitioned) {
              onTransitioned(newChildren[incomingItem].id);
            }
          }
        });
      } else if (onTransitioned) {
        // The transitioning item is being replaced by a new one, so
        // the existing item is considered to be transitioned
        onTransitioned(children[incomingItem].id);
      }

      // Update the childrens with the newly added item
      const id = createUniqueId();
      const newChildren = children.slice();
      newChildren[incomingItem] = { id, element };
      this.setState({
        children: newChildren,
        animStyle: customStyle,
      });

      return id;
    }

    __onLayout = ({ nativeEvent }) => {
      this.setState({
        bounds: {
          width: nativeEvent.layout.width,
          height: nativeEvent.layout.height,
        },
      });
    }

    __renderElement = (element, idx) => {
      // we get one null element, after the transition is completed
      if (!element) {
        return null;
      }

      const { bounds, value, currentItem, animStyle } = this.state;
      // bounds are needed by some of the transition styles, so don't
      // render as long as the onLayout has not been invoked
      if (!bounds) {
        return null;
      }

      // Get the transition style to be used, either provided during
      // the transtion call or the default provided during the creation.
      const userStyle = animStyle || style;

      // Decide weather the incoming or the outgoing style needs to be used
      // Both 'in' and 'out' styles are used for different items during the
      // transition, whereas only 'out' style is used in stable state. This
      // seems a bit confusing for the stable state item - but consider this
      // that the stable state is the beginning of the outgoing state.
      const styler = idx === currentItem ? userStyle.out : userStyle.in;

      const animatedStyle = styler(value, bounds, this.props);
      return (
        <Animated.View key={idx} style={[styles.animatedContainer, animatedStyle]}>
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
  };
};

export default createTransition;
