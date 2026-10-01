import { Injectable, inject, effect } from '@angular/core';
import { BehaviorSubject, Observable, map, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BookingDraft } from '../domain/model/booking-draft.entity';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DraftBookingService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/bookingDrafts`;
  
  private draftsSubject = new BehaviorSubject<BookingDraft[]>([]);
  drafts$ = this.draftsSubject.asObservable();

  constructor() {
    effect(() => {
      const userId = this.auth.session()?.id;
      this.draftsSubject.next([]);
      if (userId) this.loadDrafts(userId);
    });
  }

  private loadDrafts(userId: string) {
    this.http.get<any[]>(this.apiUrl).pipe(
      map(drafts => drafts
        .map(d => new BookingDraft(
          d.id,
          d.userId,
          d.vehicleId,
          d.selectedDate,
          d.unlockTime,
          d.duration,
          d.smsReminder,
          d.emailConfirmation,
          d.pushNotification,
          new Date(d.savedAt),
          new Date(d.expiresAt)
        ))
        .filter(d => d.expiresAt > new Date())
      ),
      catchError(() => of([]))
    ).subscribe(drafts => {
      if (this.auth.session()?.id === userId) this.draftsSubject.next(drafts);
    });
  }

  saveDraft(draft: Partial<BookingDraft>): Observable<BookingDraft> {
    const userId = this.auth.session()?.id;
    const draftData = { ...draft };

    return this.http.post<any>(this.apiUrl, draftData).pipe(
      map(d => new BookingDraft(
        d.id,
        d.userId,
        d.vehicleId,
        d.selectedDate,
        d.unlockTime,
        d.duration,
        d.smsReminder,
        d.emailConfirmation,
        d.pushNotification,
        new Date(d.savedAt),
        new Date(d.expiresAt)
      )),
      tap(draft => {
        if (this.auth.session()?.id !== userId) return;
        const currentDrafts = this.draftsSubject.value;
        this.draftsSubject.next([...currentDrafts, draft]);
      })
    );
  }

  deleteDraft(draftId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${draftId}`).pipe(
      tap(() => {
        const currentDrafts = this.draftsSubject.value;
        this.draftsSubject.next(currentDrafts.filter(d => d.id !== draftId));
      })
    );
  }

  getDrafts(): BookingDraft[] {
    return this.draftsSubject.value;
  }
}
