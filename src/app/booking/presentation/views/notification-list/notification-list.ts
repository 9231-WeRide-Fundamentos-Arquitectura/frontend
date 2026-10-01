import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { NotificationsApiEndpoint } from '../../../infraestructure/notifications-api-endpoint';
import { NotificationResponse } from '../../../infraestructure/notifications-response';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatIconModule, MatBadgeModule, MatChipsModule, RouterModule],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.css'
})
export class NotificationList implements OnInit {
  private notificationsApi = inject(NotificationsApiEndpoint);

  notifications: NotificationResponse[] = [];
  isLoading = true;
  unreadCount = 0;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationsApi.getAll().subscribe({
      next: (notifications) => {
        this.notifications = notifications.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.unreadCount = notifications.filter(n => !n.isRead).length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  markAsRead(id: string): void {
    this.notificationsApi.markAsRead(id).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          this.unreadCount--;
        }
      },
      error: (error) => console.error('Error marking notification as read:', error)
    });
  }

  deleteNotification(id: string): void {
    this.notificationsApi.delete(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      },
      error: (error) => console.error('Error deleting notification:', error)
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'normal': return 'primary';
      case 'low': return 'accent';
      default: return '';
    }
  }
}
