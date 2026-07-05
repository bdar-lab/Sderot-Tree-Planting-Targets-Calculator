import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { type Locale } from '../i18n/locale'

// ─────────────────────────────────────────────────────────────────────────
// Simple modal dialog. Renders rich HTML content; closes on backdrop click
// or Escape. Replaces the ExB dialog widget.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  title: string
  /** Pre-translated rich HTML (already direction-tagged per <p dir>). */
  html: string
  locale: Locale
  onClose: () => void
}

export default function Dialog ({ open, title, html, locale, onClose }: Props) {
  // Close on Escape; scroll body to top whenever the dialog opens.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog-window"
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        <div className="dialog-header">
          <span className="dialog-title">{title}</span>
          <button className="dialog-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div
          className="dialog-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>,
    document.body
  )
}
