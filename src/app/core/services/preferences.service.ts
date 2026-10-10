import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface AppPreferences {
  language: 'es' | 'en';
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}

const STORAGE_KEY = 'weride_preferences';
const LANGUAGES = ['es', 'en'];

/**
 * Preferencias de la app (idioma, tema, notificaciones).
 * La persistencia es por navegador (localStorage) hasta que el backend guarde las preferencias del perfil.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private translate = inject(TranslateService);

  /** Preferencias guardadas en este navegador; null si el usuario nunca las guardó. */
  load(): Partial<AppPreferences> | null {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return saved && typeof saved === 'object' ? saved : null;
    } catch {
      return null;
    }
  }

  /** Guarda y aplica; solo se persisten los campos recibidos. */
  save(changes: Partial<AppPreferences>): void {
    const next = { ...this.load(), ...changes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.apply(next);
  }

  /** Aplica idioma y tema al documento. */
  apply(preferences: Partial<AppPreferences>): void {
    if (preferences.language && LANGUAGES.includes(preferences.language) && this.translate.currentLang !== preferences.language) {
      this.translate.use(preferences.language);
    }
    if (preferences.theme) {
      const dark = preferences.theme === 'dark'
        || (preferences.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    }
  }

  /** Idioma inicial: el guardado, si no el del navegador, si no español. */
  initialLanguage(): 'es' | 'en' {
    const saved = this.load()?.language;
    if (saved && LANGUAGES.includes(saved)) return saved;
    const browser = navigator.language.split('-')[0];
    return LANGUAGES.includes(browser) ? browser as 'es' | 'en' : 'es';
  }
}
