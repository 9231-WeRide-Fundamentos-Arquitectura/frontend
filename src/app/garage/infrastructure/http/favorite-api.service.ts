import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface FavoriteApiResponse {
  id: string;
  userId: string;
  vehicleId: string;
  addedAt: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteApiService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.favorites}`;

  constructor(private http: HttpClient) {}

  getUserFavorites(userId: string): Observable<FavoriteApiResponse[]> {
    return this.http.get<FavoriteApiResponse[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addFavorite(userId: string, vehicleId: string, notes?: string): Observable<FavoriteApiResponse> {
    const body = {
      userId,
      vehicleId,
      addedAt: new Date().toISOString(),
      notes
    };
    return this.http.post<FavoriteApiResponse>(this.apiUrl, body);
  }

  removeFavorite(favoriteId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${favoriteId}`);
  }

  isFavorite(userId: string, vehicleId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check?userId=${userId}&vehicleId=${vehicleId}`);
  }
}
