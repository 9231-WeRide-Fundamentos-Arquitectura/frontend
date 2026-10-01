import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../domain/model/user.entity';
import { UserResponse } from './user-response';
import { UserAssembler } from './user-assembler';

@Injectable({ providedIn: 'root' })
export class UserApiEndpoint {
  private baseUrl = environment.apiUrl + '/profiles';
  private auth = inject(AuthService);
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.getById(Number(this.auth.userId)).pipe(map(user => [user]));
  }

  getById(id: number): Observable<User> {
    return this.http.get<UserResponse>(this.baseUrl + '/' + id).pipe(map(UserAssembler.toDomain));
  }

  update(id: number, user: User): Observable<User> {
    const { name, phone, profilePicture, dateOfBirth, address, emergencyContact } = user;
    return this.http.put<UserResponse>(this.baseUrl + '/' + id, {
      name, phone, profilePicture, dateOfBirth: dateOfBirth || null, address, emergencyContact
    }).pipe(map(UserAssembler.toDomain));
  }
}
