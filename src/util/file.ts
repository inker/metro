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
