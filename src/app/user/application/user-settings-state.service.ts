import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UserSettingsSection = 'wallet' | 'history' | 'security' | 'help' | 'settings' | 'account' | null;

@Injectable({
  providedIn: 'root'
})
export class UserSettingsStateService {
  private activeSectionSubject = new BehaviorSubject<UserSettingsSection>(null);
  readonly activeSection$ = this.activeSectionSubject.asObservable();

  setActiveSection(section: UserSettingsSection): void {
    this.activeSectionSubject.next(section);
  }

  getActiveSection(): UserSettingsSection {
    return this.activeSectionSubject.value;
  }

  closeSection(): void {
    this.activeSectionSubject.next(null);
  }
}

