
export const once = <K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    eventType: K,
) => new Promise<HTMLElementEventMap[K]>(resolve => {
    el.addEventListener(eventType, function handler(e) {
        el.removeEventListener(eventType, handler)
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
        removeEventListener('keydown', keydownListener)
        removeEventListener('backbutton', backbuttonListener)
    }

    addEventListener('keydown', keydownListener)
    addEventListener('backbutton', backbuttonListener)
    // once(window, 'keydown', (e: KeyboardEvent) => {
    //     if (e.keyCode === 27) handler(e);
    // });
}

export const transitionEnd = (el: Element) => once(el, 'transitionend') as Promise<Event>
