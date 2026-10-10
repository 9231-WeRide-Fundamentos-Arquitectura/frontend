import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { CommonModule } from '@angular/common';
import { PreferencesService } from '../../../core/services/preferences.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonToggleGroup,
    MatButtonToggle
  ],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher implements OnInit {
  currentLang: string = 'es';
  languages = ['en', 'es'];

  constructor(private translate: TranslateService, private preferences: PreferencesService) {}

  ngOnInit() {
    this.currentLang = this.translate.currentLang || 'es';
    this.translate.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
    });
  }

  useLanguage(language: string) {
    // Mismo valor que el selector de Ajustes: se guarda en las preferencias y se aplica.
    this.preferences.save({ language: language as 'es' | 'en' });
    this.currentLang = language;
  }
}
