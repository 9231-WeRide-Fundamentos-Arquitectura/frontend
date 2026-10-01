import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AccountSecurityActions } from './account-security-actions';
import { AccountSecurityApiService } from '../../../infrastructure/account-security-api.service';
import { AuthService } from '../../../../core/services/auth.service';

describe('Account security actions', () => {
  it('shows zero sessions, keeps the password dialog on a rejected password, and logs out after deletion', async () => {
    const api = {
      revokeOthers: jasmine.createSpy().and.returnValue(of({ revoked: 0 })),
      changePassword: jasmine.createSpy().and.returnValue(throwError(() => ({ error: { message: 'CURRENT_PASSWORD_INVALID' } }))),
      deleteAccount: jasmine.createSpy().and.returnValue(of(undefined))
    };
    const auth = { logout: jasmine.createSpy() };
    const router = { navigate: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({ providers: [
      { provide: AccountSecurityApiService, useValue: api }, { provide: AuthService, useValue: auth },
      { provide: Router, useValue: router }, { provide: MatDialog, useValue: {} },
      { provide: TranslateService, useValue: { instant: (key: string) => key } }
    ] });
    const component = TestBed.runInInjectionContext(() => new AccountSecurityActions());
    await component.revokeOthers();
    expect(component.message).toBe('accountSecurity.noOtherSessions');
    component.currentPassword = 'current';
    component.newPassword = component.confirmPassword = 'new-password';
    await component.submit();
    expect(component.error).toBe('accountSecurity.wrongPassword');
    expect(auth.logout).not.toHaveBeenCalled();
    component.mode = 'delete';
    await component.submit();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
