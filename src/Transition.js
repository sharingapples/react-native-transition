import React, { Component, PropTypes } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// The default transition style
import Fade from './transitions/Fade';

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

      /* An optional callback invoked when the transition has been configured */
      onLayout: PropTypes.func,
    };

    static defaultProps = {
      onTransitioned: undefined,
      onLayout: undefined,
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
       * The items that need to be transitioned to care included in the
       * children state. A transition takes place to reduce the number
       * of elements on the array to one.
       */
      this.state = {
        bounds: null,
        children: [{
          id: createUniqueId(),
          element: React.Children.only(props.children),
          style,
          animation,
        }],
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
      const { children } = this.state;

      // Add the newly added elements to the state. The render method
      // has been designed to render at most 2 elements only.
      const id = createUniqueId();
      this.setState({
        children: children.concat({
          id,
          element,
          style: customStyle || style,
          animation: customAnimation || animation,
        }),
      }, this.__animate);

      // Update the childrens with the newly added item
      return id;
    }

    /**
     * Retrieve the bounds of the transition layer.
     * @returns Object with { width, height }. Caution, the bounds are
     *          available only after the component has been attached.
     */
    getBounds() {
      return this.state.bounds;
    }

    __animate = () => {
      const { children, value } = this.state;
      // eslint-disable-next-line no-unused-vars
      const { onTransitioned, onLayout, ...other } = this.props;

      // Run the animation only when there are two children not less not more
      // less means, the transition is in stable state, more means new items
      // have been queued, and need to run animation only after the running
      // animation completes
      if (children.length !== 2) {
        return;
      }

      // The animation is defined by the incoming element
      const item = children[1];
      console.log('Using nativeDriver', item.style.useNativeDriver);

      const config = Object.assign({}, other, {
        toValue: 1,
        useNativeDriver: item.style.useNativeDriver,
      });

      this.__animation = item.animation(value, config);
      this.__animation.start((complete) => {
        this.__animation = null;

        // Only if the animation completes, we move further, the animation
        // is incomplete only in case the component was unmounted
        if (complete) {
          const newChildren = this.state.children.slice();

          // Remove the outgoing element
          newChildren.shift();

          // If any additional item has been added, transition them out
          // as well, leaving out the last item
          const skipped = newChildren.splice(1, newChildren.length - 2);

          if (onTransitioned) {
            onTransitioned(newChildren[0].id);

            skipped.forEach(itm => onTransitioned(itm.id));
          }

          // Update the transition state, and try to run animation again
          // if anything has been queued
          this.setState({
            children: newChildren,
            value: new Animated.Value(0),
          }, this.__animate);
        }
      });
    }

    __onLayout = ({ nativeEvent }) => {
      this.setState({
        bounds: {
          width: nativeEvent.layout.width,
          height: nativeEvent.layout.height,
        },
      }, () => this.props.onLayout && this.props.onLayout(this.state.bounds));
    }

    __renderElement = (item, idx, allItems) => {
      // we get one null element, after the transition is completed
      if (!item) {
        return null;
      }

      // Also only render at most 2 items
      if (idx > 1) {
        return null;
      }

      const { bounds, value } = this.state;
      // bounds are needed by some of the transition styles, so don't
      // render as long as the onLayout has not been invoked
      if (!bounds) {
        return null;
      }

      // Get the transition style to be used, either provided during
      // the transtion call or the default provided during the creation.
      const userStyle = allItems.length > 1 ? allItems[1].style : item.style;

      // Decide weather the incoming or the outgoing style needs to be used
      // Both 'in' and 'out' styles are used for different items during the
      // transition, whereas only 'out' style is used in stable state. This
      // seems a bit confusing for the stable state item - but consider this
      // that the stable state is the beginning of the outgoing state.
      const styler = idx === 0 ? userStyle.out : userStyle.in;

      const animatedStyle = styler(value, bounds, this.props);
      return (
        <Animated.View key={item.id} style={[styles.animatedContainer, animatedStyle]}>
          {item.element}
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
