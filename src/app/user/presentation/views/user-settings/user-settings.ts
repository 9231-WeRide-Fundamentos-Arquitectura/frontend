import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { UserSettingsStateService, UserSettingsSection } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css'
})
export class UserSettings implements OnInit {
  private readonly stateService = inject(UserSettingsStateService);
  
  activeSection: UserSettingsSection = null;

  readonly settings = [
    { key: 'wallet' as UserSettingsSection, icon: 'account_balance_wallet', label: 'Cartera' },
    { key: 'history' as UserSettingsSection, icon: 'history', label: 'Historial' },
    { key: 'security' as UserSettingsSection, icon: 'security', label: 'Centro de seguridad' },
    { key: 'help' as UserSettingsSection, icon: 'help', label: 'Ayuda' },
    { key: 'settings' as UserSettingsSection, icon: 'settings', label: 'Ajustes' }
  ];

  ngOnInit(): void {
    this.stateService.activeSection$.subscribe(section => {
      this.activeSection = section;
    });
  }

  onSettingClick(section: UserSettingsSection): void {
    if (this.activeSection === section) {
      this.stateService.closeSection();
    } else {
      this.stateService.setActiveSection(section);
    }
  }

  isActive(section: UserSettingsSection): boolean {
    return this.activeSection === section;
  }
}
