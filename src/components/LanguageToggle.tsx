import { getLocale, setLocale, type Locale } from '../i18n/locale'

// ─────────────────────────────────────────────────────────────────────────
// MAQOM-style stacked עב / EN language toggle. The active language is full
// white; the inactive one is dimmed. Single click switches.
// ─────────────────────────────────────────────────────────────────────────

const ACTIVE = '#ffffff'
const INACTIVE = 'rgba(255,255,255,0.45)'

interface Props {
  locale: Locale
}

export default function LanguageToggle ({ locale }: Props) {
  const onActivate = () => setLocale(getLocale() === 'he' ? 'en' : 'he')

  return (
    <div
      className="lang-toggle"
      role="button"
      tabIndex={0}
      dir="ltr"
      title={locale === 'he' ? 'Switch to English' : 'עבור לעברית'}
      onClick={onActivate}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate() }
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.1, color: locale === 'he' ? ACTIVE : INACTIVE }}>
        עב
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1, letterSpacing: '0.05em', color: locale === 'en' ? ACTIVE : INACTIVE }}>
        EN
      </span>
    </div>
  )
}
