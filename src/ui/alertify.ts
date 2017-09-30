import * as alertify from 'alertifyjs'

export const prompt = (...args: any[]) => new Promise<string | null>((resolve, reject) => {
    alertify.prompt(...args, (ev, value: string) => {
        resolve(value)
    }, () => {
        resolve(null)
    })
})

export const confirm = (text: string) => new Promise((resolve) => {
    alertify.confirm(text, () => {
        resolve(true)
    }, () => {
        resolve(false)
    })
})
