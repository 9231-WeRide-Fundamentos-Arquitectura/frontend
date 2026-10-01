import { Injectable } from '@angular/core';
import { ApiService, User } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadUsers(): Observable<User[]> {
    return this.apiService.getUsers().pipe(
      tap(users => {
        this.usersSubject.next(users);
      })
    );
  }

  getUserById(id: string): Observable<User> {
    return this.apiService.getUserById(id);
  }

  getCachedUsers(): User[] {
    return this.usersSubject.value;
  }

  findUserById(id: string): User | undefined {
    return this.usersSubject.value.find(user => user.id === id);
  }
}
