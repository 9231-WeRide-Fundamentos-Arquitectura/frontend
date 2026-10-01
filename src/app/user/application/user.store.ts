import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../domain/model/user.entity';
import { UserApiEndpoint } from '../infrastructure/user-api-endpoint';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private usersSubject = new BehaviorSubject<User[]>([]);
  readonly users$ = this.usersSubject.asObservable();

  private selectedUserSubject = new BehaviorSubject<User | null>(null);
  readonly selectedUser$ = this.selectedUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(private userApiEndpoint: UserApiEndpoint) {}

  loadUsers(): void {
    this.loadingSubject.next(true);
    this.userApiEndpoint.getAll().pipe(
      tap(users => {
        this.usersSubject.next(users);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar usuarios:', error);
        this.loadingSubject.next(false);
        this.usersSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  loadUsersById(id: number): void {
    this.loadingSubject.next(true);
    this.userApiEndpoint.getById(id).pipe(
      tap(user => {
        this.selectedUserSubject.next(user);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar usuario por ID:', error);
        this.loadingSubject.next(false);
        this.selectedUserSubject.next(null);
        return of(null);
      })
    ).subscribe();
  }

  getGuestUser$(): Observable<User | null> {
    return this.users$.pipe(
      map(users => users.length ? users[0] : null),
      tap(user => this.selectedUserSubject.next(user))
    );
  }

  selectUser(user: User): void {
    this.selectedUserSubject.next(user);
  }

  createUser(user: User): Observable<User> {
    return this.userApiEndpoint.create(user)
      .pipe(
        tap(newUser => {
          const currentUsers = this.usersSubject.getValue();
          this.usersSubject.next([...currentUsers, newUser]);
        })
      );
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.userApiEndpoint.update(id, user)
      .pipe(
        tap(updatedUser => {
          const currentUsers = this.usersSubject.value;
          const index = currentUsers.findIndex(u => u.id === id);
          if (index !== -1) {
            currentUsers[index] = updatedUser;
            this.usersSubject.next([...currentUsers]);
          }
        })
      );
  }

  deleteUser(id: number): Observable<void> {
    return this.userApiEndpoint.delete(id)
      .pipe(
        tap(() => {
          const currentUsers = this.usersSubject.value;
          this.usersSubject.next(currentUsers.filter(u => u.id !== id));
        })
      );
  }
}
