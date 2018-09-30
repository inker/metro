import equalsByLevel from './equalsByLevel'

/**
 * @param {number} level
 * @param {object} specificProps
 * @return {boolean}
 */
const comparisonLevel = (level) =>
  (Class) => {
    Class.prototype.shouldComponentUpdate = function (nextProps, nextState) {
      return !equalsByLevel(this.props, nextProps, level)
        || !equalsByLevel(this.state, nextState, level)
    }
  }

export default comparisonLevel
