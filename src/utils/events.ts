type A<El> = El extends HTMLElement
    ? HTMLElementEventMap
    : El extends SVGElement
        ? SVGElementEventMap
        : El extends Window
            ? GlobalEventHandlersEventMap
            : ElementEventMap 

export const once = <El extends Element | Window, EMap extends A<El>, K extends keyof EMap>(
    el: El,
    eventType: K,
) => new Promise<EMap[K]>(resolve => {
    // @ts-ignore
    el.addEventListener(eventType, function handler(e) {
        // @ts-ignore
        el.removeEventListener(eventType, handler)
        // @ts-ignore
        resolve(e)
    })
})

export function onceEscapePress(handler: (ev: KeyboardEvent) => any) {
    const keydownListener = (e: KeyboardEvent) => {
        if (e.keyCode !== 27) {
            return
        }
        removeListener()
        handler(e)
    }
    const backbuttonListener = e => {
        removeListener()
        handler(e)
    }
    function removeListener() {
        removeEventListener('keydown', keydownListener, true)
        removeEventListener('backbutton', backbuttonListener)
    }

    addEventListener('keydown', keydownListener, true)
    addEventListener('backbutton', backbuttonListener)
    // once(window, 'keydown', (e: KeyboardEvent) => {
    //     if (e.keyCode === 27) handler(e);
    // });
}

export const transitionEnd = (el: HTMLElement | SVGElement) =>
    once(el, 'transitionend')

export function triggerMouseEvent(target: Node, eventType: string) {
    const e = document.createEvent('MouseEvents')
    e.initEvent(eventType, true, true)
    target.dispatchEvent(e)
}
