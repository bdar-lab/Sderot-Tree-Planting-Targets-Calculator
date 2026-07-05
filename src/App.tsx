import { useCallback, useState } from 'react'
import MapPanel from './map/MapPanel'
import Sidebar from './calculator/Sidebar'
import Header from './components/Header'
import Dialog from './components/Dialog'
import { INSTRUCTIONS_HTML, ABOUT_HTML } from './components/dialog-content'
import type { WebMapHandle } from './map/useWebMap'
import { useLocale } from './i18n/locale'
import { t } from './i18n/strings'

// Top-level layout shell: header + map + calculator sidebar + dialogs.
export default function App () {
  const locale = useLocale()
  const [mapHandle, setMapHandle] = useState<WebMapHandle | null>(null)
  const [dialog, setDialog] = useState<'instructions' | 'about' | null>(null)
  const onMapReady = useCallback((h: WebMapHandle) => setMapHandle(h), [])

  return (
    <div className={`app-shell ${locale === 'he' ? 'rtl' : ''}`}>
      <Header
        locale={locale}
        onOpenInstructions={() => setDialog('instructions')}
        onOpenAbout={() => setDialog('about')}
      />
      <main className="app-main">
        <MapPanel onReady={onMapReady} />
        {mapHandle && <Sidebar locale={locale} map={mapHandle} />}
      </main>

      <Dialog
        open={dialog === 'instructions'}
        title={t(locale, 'instructions')}
        html={INSTRUCTIONS_HTML[locale]}
        locale={locale}
        onClose={() => setDialog(null)}
      />
      <Dialog
        open={dialog === 'about'}
        title={t(locale, 'about')}
        html={ABOUT_HTML[locale]}
        locale={locale}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
