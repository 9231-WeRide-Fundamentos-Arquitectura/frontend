import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { UserResponse } from './users-response';
import { Observable } from 'rxjs';
@Injectable({providedIn:'root'})
export class UsersApiEndpoint {
  private api=inject(ApiService);
  getAll(): Observable<UserResponse[]> {return this.api.getUsers();}
  getById(id:string): Observable<UserResponse> {return this.api.getUserById(id);}
}
