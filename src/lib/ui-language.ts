import { browser, i18n as browserI18n } from '#imports';

export const UI_LANGUAGES = [
  { code: 'browser', label: 'Browser language' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'fr', label: 'Français' },
  { code: 'ja', label: '日本語' },
] as const;

export type UILanguageCode = (typeof UI_LANGUAGES)[number]['code'];

interface ChromeMessage {
  message: string;
}

type ChromeMessages = Record<string, ChromeMessage>;

const nativeTranslate = browserI18n.t.bind(browserI18n) as (...args: unknown[]) => string;
let activeMessages: ChromeMessages | null = null;
let listening = false;

function isUILanguage(value: unknown): value is UILanguageCode {
  return UI_LANGUAGES.some((language) => language.code === value);
}

export function formatLocalizedMessage(message: string, substitutions: unknown[] = []): string {
  return message.replace(/\$(\d+)/g, (token, index) => {
    const substitution = substitutions[Number(index) - 1];
    return substitution == null ? token : String(substitution);
  });
}

function translate(key: string, ...args: unknown[]): string {
  const entry = activeMessages?.[key.replaceAll('.', '_')];
  if (!entry) return nativeTranslate(key, ...args);

  let substitutions: unknown[] = [];
  let count: number | undefined;
  for (const argument of args) {
    if (typeof argument === 'number') count = argument;
    else if (Array.isArray(argument)) substitutions = argument;
  }
  if (count != null && substitutions.length === 0) substitutions = [count];

  const message = formatLocalizedMessage(entry.message, substitutions);
  if (count == null) return message;
  const variants = message.split(' | ');
  if (variants.length === 2) return variants[count === 1 ? 0 : 1];
  if (variants.length === 3) return variants[count === 0 || count === 1 ? count : 2];
  return variants[0];
}

async function loadMessages(language: Exclude<UILanguageCode, 'browser'>): Promise<ChromeMessages> {
  const directory = language === 'pt-BR' ? 'pt_BR' : language;
  const url = browser.runtime.getURL(`/_locales/${directory}/messages.json`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load interface language ${language}`);
  return response.json() as Promise<ChromeMessages>;
}

export async function initializeUiLanguage(): Promise<void> {
  const stored = await browser.storage.local.get('uiLanguage');
  const language = isUILanguage(stored.uiLanguage) ? stored.uiLanguage : 'browser';
  if (language === 'browser') {
    activeMessages = null;
  } else {
    try {
      activeMessages = await loadMessages(language);
    } catch (error) {
      console.warn('[i18n] Falling back to the browser language', error);
      activeMessages = null;
    }
  }
  browserI18n.t = translate as typeof browserI18n.t;

  const resolvedLanguage = language === 'browser' || !activeMessages ? nativeTranslate('meta.locale') : language;
  document.documentElement.lang = resolvedLanguage;

  if (!listening) {
    listening = true;
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.uiLanguage) window.location.reload();
    });
  }
}
