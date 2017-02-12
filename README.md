# react-native-transition
A fully customizable view transition library for react-native. The library
could be used to transition entire screens or small parts within a View.

Check out a demo application available at
[Transition Demo](https://github.com/sharingapples/react-native-transition-demo).

### Installation
` $ npm install --save react-native-transition`

### Usage
```javascript
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import Transition, { Flip } from 'react-native-transition';

class MyView extends Component {
  this.switch = () => {
    // Perform the transition with the new element to be
    // shown via transition
    this._transition.add(
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text>This is another view</Text>
      </View>
    );
  }

  render() {
    return (
      <Transition style={Flip} ref={(node) => { this._transition = node; }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text>This the initial View</Text>
          <Button title="Press to Switch" onPress={this.switch} />
        </View>
      </Transition>
    )
  }
}
```

### Props
**style** object
Defines the transition style to be used. The library provides `Fade` and
`Flip` styles. `Fade` is the default style. See **Custom Transitions** below
for examples on creating custom transitions.

**animation** function
Override the animation mechanism used during the transition. The default
animation method is timed Animation. See **Custom Animations** below
for examples on creating custom animations.

Any other property passed to the the component is directly available to
the `animation` implementaions. For example `duration` props if passed
would be used by the `timedAnimation` and work accordingly.

*The `Transition` component should have **one and only one element** as a child.
This child element is rendered before any transition takes place. Once the
transition has occured, this initial child would not be mounted.*

### Methods
**add(element, [style], [animation])**
The transition is trigged by adding an element to the `Transition` instance.
The existing element will be replaced by the supplied element through a
transition animation. The `style` parameter could be passed to override
the transition style passed to the component. Similarly `animation` parameter
could be passed to override the default animation of the component.

### Custom Transitions
The transition library comes with two different transitions at the moment -
Flip and Fade, which are quite simple. It is however much easier to create
custom transitions if you have the idea how the `Animated` library of
`react-native` works.

A transition object should have two properties - `out` and `in`. The `out`
property creates the style required for the view that is transitioning out
and the `in` property creates the same for the incoming view. Both the `in`
and `out` properties should be function call that returns a new style object
for the respective container view. The function has following parameters:
> **value** `Animated.Value`
> An animated value that runs from `0` to `1` during the transition. The
various style attributes take interpolated values from this value. Go
through the react-native Animation docs for details on using this value.
>
> **bounds** { width, height }
> Some animation styles need to know the size of the view being transitioned.
>
> **props**
> The props that was passed to the `Transition` component.

Check out

#### Example transition - Slide
```javascript
const Slide = {
  out: (value, bounds) => ({
    left: value.interpolate({
      inputValue: [0, 1],
      outputValue: [0, -bounds.width],
    }),
    width: bounds.width,
  }),
  in: (value, bounds) => ({
    left: value.interpolate({
      inputValue: [0, 1],
      outputValue: [bounds.width, 0],
    }),
    width: bounds.width,
  }),
};
```

#### Example transition - Zooom
```javascript
const Zooom = {
  out: (value, bounds) => ({
    left: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -bounds.width],
    }),
    width: bounds.width,
    transform: [{
      skewX: value.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: ["0deg", "-20deg", "-20deg", "0deg"],
      }),
    }],
  }),
  in: (value, bounds) => ({
    left: value.interpolate({
      inputRange: [0, 1],
      outputRange: [bounds.width, 0],
    }),
    width: bounds.width,
    transform: [{
      skewX: value.interpolate({
        inputRange: [0, 0.1, 0.9, 1],
        outputRange: ["0deg", "-20deg", "-20deg", "0deg"],
      }),
    }],
  }),
}
```

