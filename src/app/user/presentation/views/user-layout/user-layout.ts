import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UserStore } from '../../../application/user.store';
import { UserStats } from '../user-stats/user-stats';
import { UserSettings } from '../user-settings/user-settings';
import { UserWalletCard } from '../user-wallet-card/user-wallet-card';
import { UserHistoryCard } from '../user-history-card/user-history-card';
import { UserSecurityCard } from '../user-security-card/user-security-card';
import { UserHelpCard } from '../user-help-card/user-help-card';
import { UserSettingsCard } from '../user-settings-card/user-settings-card';
import { UserPersonalInfoCard } from '../user-personal-info-card/user-personal-info-card';
import { UserSettingsStateService, UserSettingsSection } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [
    CommonModule,
    UserStats,
    UserSettings,
    UserWalletCard,
    UserHistoryCard,
    UserSecurityCard,
    UserHelpCard,
    UserSettingsCard,
    UserPersonalInfoCard
  ],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.css'
})
export class UserLayout implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);

  activeSection: UserSettingsSection = null;

  ngOnInit(): void {
    this.userStore.loadUsers();
    this.stateService.activeSection$.subscribe(section => {
      this.activeSection = section;
    });
  }
}

