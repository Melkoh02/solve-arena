export interface LanguageOption {
  id: string; // the i18n code, e.g. ‘en’, ‘es’
  labelKey: string; // the translation key for the language’s display name
  nativeName: string; // the language name in its own script
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: ‘en’, labelKey: ‘modals.selectLanguageModal.languages.en’, nativeName: ‘English’ },
  { id: ‘es’, labelKey: ‘modals.selectLanguageModal.languages.es’, nativeName: ‘Español’ },
  // later: { id: ‘fr’, labelKey: ‘...’, nativeName: ‘Français’ }, …
];
