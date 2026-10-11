import { Component, Output, EventEmitter, inject, signal, OnInit, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';
import { Notification } from '../../../booking/domain/model/notification';
import { toDomainNotification } from '../../../booking/infraestructure/notification-assembler';
import { NotificationResponse } from '../../../booking/infraestructure/notifications-response';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    TranslateModule,
    LanguageSwitcher
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit {
  @Output() sidebarToggle = new EventEmitter<void>();

  private notificationsApi = inject(NotificationsApiEndpoint);
  private router = inject(Router);
  private auth = inject(AuthService);

  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    // El servidor crea notificaciones sin avisar al cliente: se consulta cada 15 s para que la campana se entere.
    timer(0, 15000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadNotifications());
  }

  toggleSidebar() {
    this.sidebarToggle.emit();
  }

  loadNotifications() {
    this.notificationsApi.getAll().subscribe({
      next: (responses: NotificationResponse[]) => {
        const notificationList = responses.map(r => toDomainNotification(r));
        const sortedNotifications = notificationList
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
        this.notifications.set(sortedNotifications);
      }
    });
  }

  onNotificationMenuOpened() {
    this.loadNotifications();
  }

  // Al pulsar una notificación se marca como leída y, si tiene destino, se navega a él.
  openNotification(notification: Notification, event: Event) {
    const target = ['unlock_request', 'booking'].includes(notification.relatedEntityType ?? '') ? '/booking/list' : null;
    if (!target) { this.markAsRead(notification, event); return; }
    if (!notification.isRead) {
      this.notificationsApi.markAsRead(notification.id).subscribe({
        next: () => this.loadNotifications(),
        error: (error) => console.error('Error marking notification as read:', error)
      });
    }
    void this.router.navigate([target]);
  }

  markAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    if (!notification.isRead) {
      this.notificationsApi.markAsRead(notification.id).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (error) => console.error('Error marking notification as read:', error)
      });
    }
  }

  // Las notificaciones de solicitudes de desbloqueo traen el código de 6 caracteres en el mensaje.
  unlockCodeOf(notification: Notification): string | null {
    if (notification.relatedEntityType !== 'unlock_request') return null;
    return /\b[A-HJ-NP-Z2-9]{6}\b/.exec(notification.message)?.[0] ?? null;
  }

  copyUnlockCode(code: string, event: Event): void {
    event.stopPropagation();
    void navigator.clipboard?.writeText(code);
  }

  getNotificationTime(notification: Notification): string {
    const now = new Date();
    const diff = now.getTime() - notification.createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  }

  navigateToProfile() {
    this.router.navigate(['/user']);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  username = computed(() => this.auth.session()?.username ?? '');

  getUserInitials(): string {
    return this.username().charAt(0).toUpperCase() || 'U';
  }
}
