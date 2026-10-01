import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { UserStore } from '../../../application/user.store';
import { User } from '../../../domain/model/user.entity';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css'
})
export class UserStats implements OnInit {
  private readonly userStore = inject(UserStore);
  user$: Observable<User | null> = this.userStore.getGuestUser$();

  ngOnInit(): void {
    this.userStore.loadUsers();
  }

  getInitials(name?: string | null): string {
    if (!name) {
      return 'G';
    }
    return name
      .split(' ')
      .filter(part => part)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'G';
  }
}
