import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../application/user.store';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-settings-card',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule, TranslateModule],
  templateUrl: './user-settings-card.html',
  styleUrl: './user-settings-card.css'
})
export class UserSettingsCard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.userStore.getGuestUser$();
  
  preferences = {
    language: 'es',
    notifications: true,
    theme: 'light'
  };

  ngOnInit(): void {
    this.user$.subscribe(user => {
      if (user?.preferences) {
        this.preferences = { ...user.preferences };
      }
    });
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  savePreferences(): void {
    console.log('Guardando preferencias:', this.preferences);
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

