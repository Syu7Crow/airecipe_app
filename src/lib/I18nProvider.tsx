import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { I18nContext } from './i18nContext'
import {
  getInitialLanguage,
  isLanguageCode,
  saveLanguage,
  translate,
  type LanguageCode,
  type TranslateFn,
} from './i18n'
import type { UserPreferences } from '../types/ui'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(
    getInitialLanguage,
  )

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
  }, [])

  const t = useMemo<TranslateFn>(
    () => (key, values) => translate(language, key, values),
    [language],
  )

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  )

  useEffect(() => {
    saveLanguage(language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    function handlePreferencesUpdated(event: Event) {
      const displayLanguage = (
        event as CustomEvent<{ preferences?: UserPreferences }>
      ).detail?.preferences?.displayLanguage

      if (displayLanguage && isLanguageCode(displayLanguage)) {
        setLanguageState(displayLanguage)
      }
    }

    window.addEventListener('preferences-updated', handlePreferencesUpdated)

    return () => {
      window.removeEventListener('preferences-updated', handlePreferencesUpdated)
    }
  }, [])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
