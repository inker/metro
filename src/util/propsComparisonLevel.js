import { Component } from 'react'
import equalsByLevel from './equalsByLevel'

/**
 * @param {number} defaultLevel
 * @param {object} specificProps
 * @return {boolean}
 */
const propsComparisonLevel = (defaultLevel, specificProps) =>
  (Class) => {
    Class.prototype.shouldComponentUpdate = function (newProps) {
      const oldProps = this.props
      if (!specificProps) {
        return !equalsByLevel(oldProps, newProps, defaultLevel)
      }

      const genericOldProps = {}
      for (const [prop, val] of Object.entries(oldProps)) {
        if (!specificProps.hasOwnProperty(prop)) {
          genericOldProps[prop] = val
        }
      }

      const genericNewProps = {}
      for (const [prop, val] of Object.entries(newProps)) {
        if (!specificProps.hasOwnProperty(prop)) {
          genericNewProps[prop] = val
        }
      }

      return equalsByLevel(genericOldProps, genericNewProps, defaultLevel)
        && Object.entries(specificProps)
          .every(([prop, level]) => equalsByLevel(oldProps[prop], newProps[prop], level))
    }
  }

export default propsComparisonLevel
