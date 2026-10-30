import { importProvidersFrom } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../app/core/services/auth.service';
import { GARAGE_PROVIDERS } from '../app/garage/garage.providers';

/** Browser dependencies for isolated component creation tests. HTTP stays in memory. */
export function componentTestProviders() {
  return [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideNoopAnimations(),
    importProvidersFrom(TranslateModule.forRoot({fallbackLang:'es'})), ...GARAGE_PROVIDERS,
    { provide: AuthService, useFactory: () => {
      localStorage.removeItem('active_booking');
      const auth=new AuthService();
      auth.session.set({id:'component-test-user',token:'component-test-token',username:'component@weride.test'});
      return auth;
    }}
  ];
}
