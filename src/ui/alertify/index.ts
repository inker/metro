import * as alertify from 'alertifyjs'

import 'alertifyjs/build/css/alertify.css'
import 'alertifyjs/build/css/themes/default.css'

import { transitionEnd } from '../../util/events'

import './styles.css'

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
    const dimmer = document.querySelector('.ajs-dimmer')
    if (dimmer) {
        transitionEnd(dimmer).then(() => input.type = 'text')
    }
    return val
}

export const confirm = (text: string) => new Promise<boolean>((resolve) => {
    alertify.confirm(text, () => {
        resolve(true)
    }, () => {
        resolve(false)
    })
})
