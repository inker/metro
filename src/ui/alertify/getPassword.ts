import { transitionEnd } from 'utils/events'
import { prompt } from '.'

export default async (...args: any[]) => {
  const input = document.querySelector('.ajs-input') as HTMLInputElement
  input.type = 'password'
  const val = await prompt(...args)
  const dimmer = document.querySelector('.ajs-dimmer')
  if (dimmer) {
      transitionEnd(dimmer).then(() => input.type = 'text')
  }
  return val
}
