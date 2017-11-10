import { prompt } from '../alertify'
import { makeLink } from '../../util/dom'

const TITLE = 'GitHub username'
const GITHUB_URL = 'https://github.com'

const here = makeLink(GITHUB_URL, 'here', true)
const message = `If you don't have an account, create it ${here}`

export default () => prompt(TITLE, message, null)
