import React, { PureComponent } from 'react'
import ReactDOM from 'react-dom'
import htmlTags from 'html-tags'

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

type TagName = keyof ElementTagNameMap

interface Props {
  tagName: TagName,
  modalRoot: Element,
}

class Modal extends PureComponent<Props> {
  el: HTMLElement

  constructor(props) {
    super(props)
    const ns = htmlTags.includes(props.tagName) && props.tagName !== 'svg' ? HTML_NAMESPACE : SVG_NAMESPACE
    this.el = document.createElementNS(ns, props.tagName) as HTMLElement
  }

  componentDidMount() {
    // The portal element is inserted in the DOM tree after
    // the Modal's children are mounted, meaning that children
    // will be mounted on a detached DOM node. If a child
    // component requires to be attached to the DOM tree
    // immediately when mounted, for example to measure a
    // DOM node, or uses 'autoFocus' in a descendant, add
    // state to Modal and only render the children when Modal
    // is inserted in the DOM tree.
    this.props.modalRoot.appendChild(this.el)
  }

  componentWillUnmount() {
    this.props.modalRoot.removeChild(this.el)
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children,
      this.el, // this.props.modalRoot is possible
    )
  }
}

export default Modal
