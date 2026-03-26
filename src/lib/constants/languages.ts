export interface LanguageOption {
  id: string;
  labelKey: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'en', labelKey: 'modals.selectLanguageModal.languages.en', nativeName: 'English' },
  { id: 'es', labelKey: 'modals.selectLanguageModal.languages.es', nativeName: 'Espanol' },
];
