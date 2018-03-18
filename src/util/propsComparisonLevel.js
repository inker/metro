import { Component } from 'react'
import equalsByLevel from './equalsByLevel'

function excludedProps(baseObject, specificPropsObject) {
  if (!specificPropsObject) {
    return Object.assign({}, baseObject)
  }

  const genericOldProps = {}
  for (const [prop, val] of Object.entries(baseObject)) {
    if (!specificPropsObject.hasOwnProperty(prop)) {
      genericOldProps[prop] = val
    }
  }
  return genericOldProps
}

/**
 * @param {number} defaultLevel
 * @param {object} specificProps
 * @return {boolean}
 */
const propsComparisonLevel = (defaultLevel, specificProps) =>
  (Class) => {
    Class.prototype.shouldComponentUpdate = function (newProps, newState) {
      const oldProps = this.props
      const oldState = this.state
      if (!specificProps) {
        return !equalsByLevel(oldProps, newProps, defaultLevel) || !equalsByLevel(oldState, newState, defaultLevel)
      }

      const genericOldProps = excludedProps(oldProps, specificProps)
      const genericNewProps = excludedProps(newProps, specificProps)

      return equalsByLevel(genericOldProps, genericNewProps, defaultLevel)
        && Object.entries(specificProps)
          .every(([prop, level]) => equalsByLevel(oldProps[prop], newProps[prop], level))
    }
  }

export default propsComparisonLevel
