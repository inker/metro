import equalsByLevel from './equalsByLevel'

export default (level: number) =>
  (Class) => {
    Class.prototype.shouldComponentUpdate = function (props) {
      return !equalsByLevel(this.props, props, level)
    }
  }
