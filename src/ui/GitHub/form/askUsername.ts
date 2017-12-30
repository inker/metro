import { makeLink } from '../../../util/dom'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ '../../alertify')

const TITLE = 'GitHub username'
const GITHUB_URL = 'https://github.com'

const here = makeLink(GITHUB_URL, 'here', true)
const message = `If you don't have an account, create it ${here}`

export default () => alertifyPromise.then(mod => mod.prompt(TITLE, message, null))
