import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { User } from '../../../domain/model/user.entity';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  @Input() user: User | null = null;
  private translate = inject(TranslateService);

  get mainOptions() {
    return [
      { icon: 'account_balance_wallet', label: this.translate.instant('user.wallet.title') },
      { icon: 'history', label: this.translate.instant('user.history.title') },
      { icon: 'security', label: this.translate.instant('user.security.title') },
      { icon: 'help', label: this.translate.instant('user.help.title') },
      { icon: 'settings', label: this.translate.instant('user.settings.title') }
    ];
  }

  get quickActions() {
    return [
      { label: this.translate.instant('user.profile.manageAccount') },
      { label: this.translate.instant('user.profile.customizeProfile') }
    ];
  }

  get stats(): { label: string; value: string }[] {
    if (!this.user?.statistics) {
      return [
        { label: this.translate.instant('user.stats.meters'), value: '0' },
        { label: this.translate.instant('user.stats.trips'), value: '0' }
      ];
    }

    const formatter = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
    const { totalDistance, totalTrips } = this.user.statistics;
    return [
      { label: this.translate.instant('user.stats.meters'), value: formatter.format(totalDistance ?? 0) },
      { label: this.translate.instant('user.stats.trips'), value: formatter.format(totalTrips ?? 0) }
    ];
  }

  get hasProfilePicture(): boolean {
    return !!this.user?.profilePicture;
  }

  getInitials(name?: string | null): string {
    if (!name) {
      return 'G';
    }
    return (
      name
        .split(' ')
        .filter(part => part)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('') || 'G'
    );
  }
}
