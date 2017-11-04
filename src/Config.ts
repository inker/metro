export default interface Config {
  containerId: string,
  center?: [number, number],
  zoom: number,
  minZoom: number,
  maxZoom: number,
  detailedZoom: number,
  url: {
      [resource: string]: string,
  },
  [option: string]: any,
}
