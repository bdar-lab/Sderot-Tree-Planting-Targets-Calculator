import { useState, useEffect } from 'react'

export type Locale = 'en' | 'he'

const STORAGE_KEY = 'bdar.locale'
const EVENT_NAME = 'bdar:localechange'

export function getInitialLocale (): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'he' || stored === 'en') return stored
  } catch (_) { /* ignore */ }
  const nav = (navigator?.language || '').toLowerCase()
  return nav.startsWith('he') || nav.startsWith('iw') ? 'he' : 'en'
}

let current: Locale = getInitialLocale()

export function getLocale (): Locale { return current }

export function setLocale (loc: Locale): void {
  if (loc !== 'en' && loc !== 'he') return
  if (loc === current) return
  current = loc
  try { window.localStorage.setItem(STORAGE_KEY, loc) } catch (_) { /* ignore */ }
  applyDocumentDir(loc)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: loc }))
}

export function applyDocumentDir (loc: Locale): void {
  if (typeof document === 'undefined') return
  // Set lang for accessibility / font-shaping, but keep <html dir="ltr"> so
  // the overall layout (sidebar on the right) does not flip. RTL is applied
  // per-component on Hebrew text instead.
  const html = document.documentElement
  html.setAttribute('lang', loc === 'he' ? 'he' : 'en')
  html.setAttribute('dir', 'ltr')
}

export function useLocale (): Locale {
  const [loc, setLoc] = useState<Locale>(getLocale())
  useEffect(() => {
    const handler = (e: Event) => setLoc((e as CustomEvent).detail as Locale)
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])
  return loc
}
