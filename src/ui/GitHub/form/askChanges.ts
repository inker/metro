const alertifyPromise = import(/* webpackChunkName: "alertify" */ '../../alertify')

const TITLE = 'What did you change?'
const ON_REFUSAL = 'Please provide the description of your changes'

export default async () => {
    let message = ''
    const { prompt } = await alertifyPromise
    while (true) {
        const text = await prompt(TITLE, message, null)
        if (text) {
            return text
        }
        message = ON_REFUSAL
    }
}
