import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { TranslateModule } from '@ngx-translate/core';
import { UserSettingsStateService, UserSettingsSection } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-settings.html',
  styleUrl: './user-settings.css'
})
export class UserSettings implements OnInit {
  private readonly stateService = inject(UserSettingsStateService);
  
  activeSection: UserSettingsSection = null;

  readonly settings = [
    { key: 'wallet' as UserSettingsSection, icon: 'account_balance_wallet', label: 'user.menu.wallet' },
    { key: 'history' as UserSettingsSection, icon: 'history', label: 'user.menu.history' },
    { key: 'security' as UserSettingsSection, icon: 'security', label: 'user.menu.security' },
    { key: 'help' as UserSettingsSection, icon: 'help', label: 'user.menu.help' },
    { key: 'settings' as UserSettingsSection, icon: 'settings', label: 'user.menu.settings' }
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
