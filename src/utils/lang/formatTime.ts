const inflect = (value: number, str: string) =>
  value === 0 ? '' : `${value}${value > 1 ? `${str}s` : str}`

export default (time?: number) => {
  if (time === undefined) {
      return ''
  }
  if (time < 60) {
      return `${Math.round(time)} seconds`
  }
  if (time < 3570) {
      const mins = Math.round(time / 60)
      return inflect(mins, 'min')
  }
  const hours = Math.floor(time / 3600)
  const mins = Math.floor((time - hours * 3600) / 60)
  return `${hours > 0 ? `${hours}h` : ''} ${inflect(mins, 'min')}`
}
