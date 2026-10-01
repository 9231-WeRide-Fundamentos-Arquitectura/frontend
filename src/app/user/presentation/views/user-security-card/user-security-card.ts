import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { UserStore } from '../../../application/user.store';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-security-card',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule],
  templateUrl: './user-security-card.html',
  styleUrl: './user-security-card.css'
})
export class UserSecurityCard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);

  user$ = this.userStore.getGuestUser$();

  ngOnInit(): void {
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  getVerificationStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'verified': 'Verificado',
      'pending': 'Pendiente',
      'unverified': 'No verificado'
    };
    return statusMap[status] || status;
  }

  getVerificationStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'verified': '#10b981',
      'pending': '#f59e0b',
      'unverified': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }
}

