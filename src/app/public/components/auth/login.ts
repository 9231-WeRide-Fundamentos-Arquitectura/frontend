import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  imports: [RouterLink, TranslateModule],
  styleUrl: './login.css',
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1 class="title">{{ 'auth.login.title' | translate }}</h1>
        <p class="subtitle">{{ 'auth.login.subtitle' | translate }}</p>

        <div class="buttons-container">
          <a class="btn btn-primary" routerLink="/auth/email-login">{{ 'auth.login.loginWithEmail' | translate }}</a>
          <a class="btn btn-guest" routerLink="/auth/register">{{ 'auth.register.createAccount' | translate }}</a>
        </div>

        <div class="terms">
          <p>{{ 'auth.login.termsLine' | translate }}</p>
        </div>
      </div>

      <div class="illustration">
        <img src="assets/auth/weride-loginscreen.png" alt="" />
      </div>
    </div>`
})
export class LoginComponent {}
