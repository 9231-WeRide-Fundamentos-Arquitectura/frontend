import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

// Único punto de referencia del logo: para cambiarlo, sustituir public/WeRideLogo.png.
const LOGO_SRC = '/WeRideLogo.png';

@Component({
  selector: 'app-login',
  imports: [RouterLink, TranslateModule, LanguageSwitcher],
  styleUrl: './login.css',
  template: `
    <div class="login-container">
      <app-language-switcher class="lang"></app-language-switcher>
      <div class="login-card">
        <img class="logo" [src]="logo" alt="WeRide" />
        <h2 class="welcome">{{ 'auth.login.welcome' | translate }}</h2>
        <h1 class="title">{{ 'auth.login.title' | translate }}</h1>
        <p class="subtitle">{{ 'auth.login.subtitle' | translate }}</p>

        <div class="buttons-container">
          <a class="btn btn-primary" routerLink="/auth/email-login">{{ 'auth.login.loginWithEmail' | translate }}</a>
          <a class="btn btn-guest" routerLink="/auth/register">{{ 'auth.register.createAccount' | translate }}</a>
        </div>

        <div class="terms">
          <p>{{ 'auth.login.terms' | translate }}
            <a routerLink="/privacy" target="_blank">{{ 'auth.login.privacyPolicy' | translate }}</a>
            {{ 'common.and' | translate }}
            <a routerLink="/terms" target="_blank">{{ 'auth.login.termsOfUse' | translate }}</a>
            {{ 'auth.login.ofWeRide' | translate }}.</p>
        </div>
      </div>
    </div>`
})
export class LoginComponent {
  readonly logo = LOGO_SRC;
}
