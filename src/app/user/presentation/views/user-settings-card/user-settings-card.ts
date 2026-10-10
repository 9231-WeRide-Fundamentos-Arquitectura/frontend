import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../application/user.store';
import { PreferencesService, AppPreferences } from '../../../../core/services/preferences.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { AccountSecurityActions } from '../account-security-actions/account-security-actions';

@Component({
  selector: 'app-user-settings-card',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule, TranslateModule, AccountSecurityActions],
  templateUrl: './user-settings-card.html',
  styleUrl: './user-settings-card.css'
})
export class UserSettingsCard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);
  private readonly prefs = inject(PreferencesService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  user$ = this.userStore.getGuestUser$();
  
  preferences: AppPreferences = {
    language: 'es',
    notifications: true,
    theme: 'light'
  };

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user?.preferences) {
        this.preferences = { ...this.preferences, ...user.preferences } as AppPreferences;
      }
      // Lo guardado en este navegador manda; el idioma activo de la app es la fuente del selector.
      this.preferences = {
        ...this.preferences, ...this.prefs.load(),
        language: (this.translate.currentLang || this.preferences.language) as AppPreferences['language']
      };
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  savePreferences(): void {
    // ponytail: persistencia por navegador (localStorage); pasar al perfil cuando el backend guarde preferencias.
    this.prefs.save(this.preferences);
    this.snackBar.open(this.translate.instant('user.settings.saved'), this.translate.instant('common.close'), { duration: 3000 });
  }

  openPersonalInfo(): void {
    this.stateService.setActiveSection('account');
  }

  getLanguageName(code: string): string {
    const languages: { [key: string]: string } = {
      'es': 'Español',
      'en': 'English',
      'pt': 'Português'
    };
    return languages[code] || code;
  }

  getThemeName(theme: string): string {
    const themes: { [key: string]: string } = {
      'light': 'Claro',
      'dark': 'Oscuro',
      'auto': 'Automático'
    };
    return themes[theme] || theme;
  }
}

