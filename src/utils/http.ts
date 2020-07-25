const now = Date.now()

export const cachelessFetch = (url: string) =>
  fetch(`${url}?${now}`)

export const getJSON = (url: string) =>
  cachelessFetch(url).then(data => data.json())
