import { t, SITE_TITLE } from '../i18n/strings'
import { type Locale } from '../i18n/locale'
import LanguageToggle from './LanguageToggle'

// ─────────────────────────────────────────────────────────────────────────
// App header: centered site title, Instructions/About buttons, and the
// EN/HE toggle pinned to the far right.
// ─────────────────────────────────────────────────────────────────────────

interface Props {
  locale: Locale
  onOpenInstructions: () => void
  onOpenAbout: () => void
}

export default function Header ({ locale, onOpenInstructions, onOpenAbout }: Props) {
  return (
    <header className="app-header">
      <a
        className="header-logo"
        href="https://oraleks.net.technion.ac.il/en/bdar-lab/"
        target="_blank"
        rel="noopener noreferrer"
        title="Big Data in Architectural Research Lab"
      >
        <img src={`${import.meta.env.BASE_URL}bdar-logo.png`} alt="BDAR Lab" />
      </a>
      <span className="app-title">{SITE_TITLE[locale]}</span>
      <div className="header-actions">
        <button className="header-link" onClick={onOpenInstructions}>
          {t(locale, 'instructions')}
        </button>
        <button className="header-link" onClick={onOpenAbout}>
          {t(locale, 'about')}
        </button>
      </div>
      <div className="header-toggle">
        <LanguageToggle locale={locale} />
      </div>
    </header>
  )
}
