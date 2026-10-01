import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationResponse } from './notifications-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationsApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.notifications}`;

  constructor(private http: HttpClient) {}

  // Obtener todas las notificaciones
  getAll(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(this.baseUrl);
  }

  // Obtener notificaciones por ID de usuario
  getByUserId(userId: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.baseUrl}?userId=${userId}`);
  }

  // Crear una nueva notificación
  create(notification: Omit<NotificationResponse, 'id'>): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(this.baseUrl, notification);
  }

  // Obtener una notificación por ID
  getById(id: string): Observable<NotificationResponse> {
    return this.http.get<NotificationResponse>(`${this.baseUrl}/${id}`);
  }

  // Actualizar una notificación
  update(id: string, notification: Partial<NotificationResponse>): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${id}`, notification);
  }

  // Eliminar una notificación
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Marcar una notificación como leída
  markAsRead(id: string): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.baseUrl}/${id}`, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  }
}
