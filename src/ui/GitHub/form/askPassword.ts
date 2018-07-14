import { makeLink } from 'utils/dom'

const alertifyPromise = import(/* webpackChunkName: "alertify" */ 'ui/alertify')

const TITLE = 'GitHub password'
const FILE_URL = 'https://github.com/inker/metro/blob/master/src/ui/GitHub/auth.ts'
const message = makeLink(FILE_URL, "I don't store it anywhere", true)

export default () => alertifyPromise.then(mod => mod.getPassword(TITLE, message, null))
