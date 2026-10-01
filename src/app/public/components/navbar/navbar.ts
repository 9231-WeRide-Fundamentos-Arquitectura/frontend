import { Component, Output, EventEmitter, inject, signal, OnInit, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { NotificationsApiEndpoint } from '../../../booking/infraestructure/notifications-api-endpoint';
import { Notification } from '../../../booking/domain/model/notification';
import { toDomainNotification } from '../../../booking/infraestructure/notification-assembler';
import { NotificationResponse } from '../../../booking/infraestructure/notifications-response';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    TranslateModule,
    LanguageSwitcher
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  private notificationsApi = inject(NotificationsApiEndpoint);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  isNotificationMenuOpen = signal(false);
  isUserMenuOpen = signal(false);

  ngOnInit() {
    this.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-dropdown') && !target.closest('.notification-button')) {
      this.isNotificationMenuOpen.set(false);
    }
    if (!target.closest('.user-dropdown') && !target.closest('.user-button')) {
      this.isUserMenuOpen.set(false);
    }
  }

  onToggle() {
    this.toggleSidebar.emit();
  }

  toggleNotificationMenu() {
    this.isNotificationMenuOpen.update(val => !val);
    this.isUserMenuOpen.set(false);
    if (this.isNotificationMenuOpen()) {
      this.loadNotifications();
    }
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update(val => !val);
    this.isNotificationMenuOpen.set(false);
  }

  closeMenus() {
    this.isNotificationMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
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

  markAsRead(notification: Notification) {
    if (!notification.isRead) {
      this.notificationsApi.markAsRead(notification.id).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (error) => console.error('Error marking notification as read:', error)
      });
    }
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
    this.closeMenus();
    this.router.navigate(['/profile']);
  }

  logout() {
    this.closeMenus();
    this.router.navigate(['/']);
  }

  getUserInitials(): string {
    return 'U';
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }
}

