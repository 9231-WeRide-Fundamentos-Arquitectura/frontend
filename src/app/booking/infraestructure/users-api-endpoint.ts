import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponse } from './users-response';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.users}`;

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios
  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.baseUrl);
  }

  // Crear un nuevo usuario
  create(user: Omit<UserResponse, 'id'>): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.baseUrl, user);
  }

  // Obtener un usuario por ID
  getById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`);
  }

  // Actualizar un usuario
  update(id: string, user: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.baseUrl}/${id}`, user);
  }

  // Eliminar un usuario
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
