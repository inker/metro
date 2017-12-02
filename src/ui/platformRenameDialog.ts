import alertify, { prompt, confirm } from './alertify'

import { Platform } from '../network'
import getSecondLanguage from '../util/lang/getSecondLanguage'

function assignNames(platform: Platform, newNames: string[]) {
  const second = getSecondLanguage()
  const { altNames } = platform
  if (second) {
      [platform.name, altNames[second], altNames.en] = newNames
  } else {
      [platform.name, altNames.en] = newNames
  }
}

export default async (platform: Platform) => {
  const ru = platform.name
  const { fi, en } = platform.altNames
  const names = en ? [ru, fi, en] : fi ? [ru, fi] : [ru]
  const nameString = names.join('|')

  const val = await prompt('New name', nameString)
  if (val === null) {
      alertify.warning('Name change cancelled')
      return
  }
  const newNames = val.split('|')
  assignNames(platform, newNames)
  if (val === nameString) {
      return alertify.warning('Name was not changed')
  }
  const oldNamesStr = names.slice(1).join(', ')
  const newNamesStr = newNames.slice(1).join(', ')
  alertify.success(`${ru} (${oldNamesStr}) renamed to ${newNames[0]} (${newNamesStr})`)
  const station = platform.station
  if (station.platforms.length < 2) {
      return
  }

  const confirmed = await confirm('Rename the entire station?')
  if (!confirmed) {
      return
  }
  for (const p of station.platforms) {
      assignNames(p, newNames)
  }
  alertify.success(`The entire station was renamed to ${val}`)
}
