import { getStyleRulesAsText } from '../res'

export function download(title: string, dataURL: string) {
    const a = document.createElement('a')
    a.href = dataURL
    a.download = title
    a.click()
}

export function downloadBlob(title: string, blob: Blob) {
    const url = URL.createObjectURL(blob)
    download(title, url)
    URL.revokeObjectURL(url)
}

export function downloadText(title: string, content: string) {
    downloadBlob(title, new Blob([content], { type: 'octet/stream' }))
}

export function downloadSvgAsPicture(title: string, root: SVGSVGElement, format: string) {
    svgToPictureDataUrl(root, format).then(dataURL => download(title, dataURL))
}

export function svgToPictureDataUrl(root: SVGSVGElement, format: string): Promise<string> {
    return svgToCanvas(root).then(canvas => canvas.toDataURL('image/' + format))
}

export function svgToCanvas(root: SVGSVGElement): Promise<HTMLCanvasElement> {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
        const img = svgToImg(root, true)
        img.onload = e => {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const c2d = canvas.getContext('2d')
            if (!c2d) {
                return reject(new Error('2d context does not exist on canvas'))
            }
            c2d.drawImage(img, 0, 0)
            resolve(canvas)
        }
    })
}

export function svgToPicture(root: SVGSVGElement): Promise<HTMLImageElement> {
    const dataUrlPromise = svgToPictureDataUrl(root, 'png')
    const img = document.createElement('img')
    img.width = parseInt(root.getAttribute('width') || '') || parseInt(root.style.width || '')
    img.height = parseInt(root.getAttribute('height') || '') || parseInt(root.style.height || '')
    return dataUrlPromise.then(dataUrl => {
        img.src = dataUrl
        return img
    })
}

export function svgToImg(root: SVGSVGElement, appendExternalStyles = false): HTMLImageElement {
    if (appendExternalStyles) {
        root = optimizeSvg(root)
    }
    const img = document.createElement('img')
    img.width = parseInt(root.getAttribute('width') || '') || parseInt(root.style.width || '')
    img.height = parseInt(root.getAttribute('height') || '') || parseInt(root.style.height || '')
    img.src = svgToDataUrl(root)
    return img
}

export function svgToDataUrl(root: SVGSVGElement): string {
    return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(root))
}

function optimizeSvg(root: SVGSVGElement): SVGSVGElement {
    const optimized = root.cloneNode(true) as SVGSVGElement
    const dummyElements = optimized.querySelectorAll('[id^=dummy]')
    for (let i = 0, len = dummyElements.length; i < len; ++i) {
        const dummy = dummyElements[i]
        const dummysParent = dummy.parentNode
        if (dummysParent) {
            dummysParent.removeChild(dummy)
        }
    }
    optimized.style.left = optimized.style.top = ''
    const plate = optimized.querySelector('#station-plate')
    if (plate) {
        const platesParent = plate.parentNode
        if (platesParent) {
            platesParent.removeChild(plate)
        }
    }
    const styleElement = document.createElement('style')
    styleElement.textContent = getStyleRulesAsText()
    const defs = optimized.querySelector('defs')
    if (defs) {
        defs.insertBefore(styleElement, defs.firstChild)
    }
    return optimized
}
