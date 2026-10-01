import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountSecurityApiService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/accounts/me`;

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<void>(`${this.url}/password`, { currentPassword, newPassword });
  }
  revokeOthers() { return this.http.post<{ revoked: number }>(`${this.url}/sessions/revoke-others`, {}); }
  deleteAccount(password: string) { return this.http.post<void>(`${this.url}/delete`, { password }); }
}
