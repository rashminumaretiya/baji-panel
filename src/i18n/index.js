// Mirrors the Angular @ngx-translate setup. Translation files live under
// public/i18n/{lng}.json (copied from sbex-user-fe verbatim).
import i18n from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    supportedLngs: ['en', 'bn', 'hi', 'ur'],
    debug: false,
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/i18n/{{lng}}.json',
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
