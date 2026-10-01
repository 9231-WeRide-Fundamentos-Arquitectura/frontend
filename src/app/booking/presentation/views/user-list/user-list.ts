import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { UsersApiEndpoint } from '../../../infraestructure/users-api-endpoint';
import { UserResponse } from '../../../infraestructure/users-response';

@Component({
  selector: 'app-user-list',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserList implements OnInit {
  private usersApi = inject(UsersApiEndpoint);

  users: UserResponse[] = [];
  isLoading = true;
  displayedColumns: string[] = ['name', 'email', 'phone', 'membershipPlanId', 'verificationStatus', 'isActive', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.usersApi.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  getVerificationColor(status: string): string {
    switch (status) {
      case 'verified': return 'primary';
      case 'pending': return 'accent';
      case 'rejected': return 'warn';
      default: return '';
    }
  }

  editUser(id: string): void {
    console.log('Edit user:', id);
  }

  deleteUser(id: string): void {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.usersApi.delete(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== id);
        },
        error: (error) => console.error('Error deleting user:', error)
      });
    }
  }
}
