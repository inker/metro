import * as alertify from 'alertifyjs'

import 'alertify-dist/css/alertify.css'
import 'alertify-dist/css/themes/default.css'

import './alertify.css'

export default alertify

export const prompt = (...args: any[]) => new Promise<string | null>((resolve, reject) => {
    alertify.prompt(...args, (ev, value: string) => {
        resolve(value)
    }, () => {
        resolve(null)
    })
})

export async function getPassword(...args: any[]) {
    const input = document.querySelector('.ajs-input') as HTMLInputElement
    input.type = 'password'
    const val = await prompt(...args)
    setTimeout(() => input.type = 'text', 500)
    return val
}

export const confirm = (text: string) => new Promise((resolve) => {
    alertify.confirm(text, () => {
        resolve(true)
    }, () => {
        resolve(false)
    })
})
