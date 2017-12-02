import alertify from 'alertifyjs'

import 'alertifyjs/build/css/alertify.css'
import 'alertifyjs/build/css/themes/default.css'

import './styles.css'

export default alertify
export { default as getPassword } from './getPassword'

export const prompt = (...args: any[]) => new Promise<string | null>((resolve, reject) => {
    alertify.prompt(...args, (ev, value: string) => {
        resolve(value)
    }, () => {
        resolve(null)
    })
})

export const confirm = (text: string) => new Promise<boolean>((resolve) => {
    alertify.confirm(text, () => {
        resolve(true)
    }, () => {
        resolve(false)
    })
})
