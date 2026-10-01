import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../domain/model/user.entity';
import { UserResponse } from './user-response';
import { map } from 'rxjs/operators';
import { UserAssembler } from './user-assembler';

@Injectable({
  providedIn: 'root'
})
export class UserApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.users}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]>
  {
    return this.http.get<UserResponse[]>(this.baseUrl).pipe(
      map(responses => responses.map(response => UserAssembler.toDomain(response)))
    );
  }

  getById(id: number): Observable<User>
  {
    return this.http.get<UserResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => UserAssembler.toDomain(response))
    );
  }

  getByName(name: string): Observable<User>
  {
    return this.http.get<UserResponse>(`${this.baseUrl}/name/${name}`).pipe(
      map(response => UserAssembler.toDomain(response))
    );
  }

  create(user: User): Observable<User>
  {
    return this.http.post<UserResponse>(this.baseUrl, user).pipe(
      map(response => UserAssembler.toDomain(response))
    );
  }

  update(id: number, user: User): Observable<User>
  {
    return this.http.put<UserResponse>(`${this.baseUrl}/${id}`, user).pipe(
      map(response => UserAssembler.toDomain(response))
    );
  }

  delete(id: number): Observable<void>
  {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
