import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, combineLatest, catchError, defer, forkJoin, map, of } from 'rxjs';
import { UserStore } from '../../../application/user.store';
import { User, UserStatistics } from '../../../domain/model/user.entity';
import { AuthService } from '../../../../core/services/auth.service';
import { BookingHistoryApiEndpoint } from '../../../../trip/infrastructure/booking-history-api-endpoint';
import { PaymentsApiEndpoint } from '../../../infrastructure/payments-api-endpoint';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css'
})
export class UserStats implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly auth = inject(AuthService);
  private readonly history = inject(BookingHistoryApiEndpoint);
  private readonly payments = inject(PaymentsApiEndpoint);

  // Viajes y distancia salen de GET /bookings/history, el gasto de GET /payments/summary y la
  // puntuación es el promedio de las calificaciones de esas reservas (hasta las 100 más recientes).
  private readonly stats$: Observable<UserStatistics | null> = defer(() => forkJoin({
    page: this.history.getPage(0, 100).pipe(catchError(() => of(null))),
    summary: this.payments.getSummary(this.auth.userId).pipe(catchError(() => of(null)))
  })).pipe(map(({ page, summary }) => {
    if (!page && !summary) return null;
    const trips = page?.content ?? [];
    const scores = trips.map(t => t.rating?.score).filter((s): s is number => typeof s === 'number');
    return {
      totalTrips: page?.totalElements ?? 0,
      totalDistance: Math.round(trips.reduce((sum, t) => sum + (t.distance ?? 0), 0) * 1000),
      totalSpent: summary?.totalSpent ?? 0,
      averageRating: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    };
  }));

  user$: Observable<User | null> = combineLatest([this.userStore.getGuestUser$(), this.stats$.pipe(catchError(() => of(null)))]).pipe(
    map(([user, statistics]) => user && (statistics ? { ...user, statistics } : user))
  );

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
