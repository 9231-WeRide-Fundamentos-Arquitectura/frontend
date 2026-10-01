import { Notification } from '../domain/model/notification';
import { NotificationResponse } from './notifications-response';

// Convierte NotificationResponse (infraestructura) a Notification (dominio)
export function toDomainNotification(response: NotificationResponse): Notification {
  return new Notification(
    response.id,
    response.userId,
    response.title,
    response.message,
    response.type,
    response.category,
    response.priority,
    new Date(response.createdAt),
    response.readAt ? new Date(response.readAt) : null,
    response.isRead,
    response.actionRequired,
    response.relatedEntityId,
    response.relatedEntityType,
    response.icon,
    response.color,
    response.expiresAt ? new Date(response.expiresAt) : undefined,
    response.promoCode,
    response.discount
  );
}

// Convierte Notification (dominio) a NotificationResponse (infraestructura)
export function toInfraNotification(notification: Notification): Omit<NotificationResponse, 'id'> {
  return {
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    category: notification.category,
    priority: notification.priority,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    isRead: notification.isRead,
    actionRequired: notification.actionRequired,
    relatedEntityId: notification.relatedEntityId,
    relatedEntityType: notification.relatedEntityType,
    icon: notification.icon,
    color: notification.color,
    expiresAt: notification.expiresAt ? notification.expiresAt.toISOString() : undefined,
    promoCode: notification.promoCode,
    discount: notification.discount
  };
}
