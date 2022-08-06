import { Component, ComponentClass } from 'react'

import equalsByLevel from './equalsByLevel'

const comparisonLevel = (level: number) =>
  <P, S, C extends ComponentClass<P, S>>(Class: C) => {
    Class.prototype.shouldComponentUpdate = function (this: Component, nextProps: P, nextState: S) {
      return !equalsByLevel(this.props, nextProps, level)
        || !equalsByLevel(this.state, nextState, level)
    }

    const composedComponentName = Class.displayName
      || Class.name
      || 'Component'

    Class.displayName = `comparisonLevel(${level})(${composedComponentName})`

    return Class
  }

export default comparisonLevel
