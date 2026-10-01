// Respuesta de la API para una notificación
export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
  actionRequired: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  icon: string;
  color: string;
  expiresAt?: string;
  promoCode?: string;
  discount?: number;
}

// Respuesta de la API para listado de notificaciones
export interface NotificationsListResponse {
  notifications: NotificationResponse[];
}
