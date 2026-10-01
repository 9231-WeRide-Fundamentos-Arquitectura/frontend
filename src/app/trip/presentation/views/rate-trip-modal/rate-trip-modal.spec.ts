import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RateTripModal } from './rate-trip-modal';
import { environment } from '../../../../../environments/environment';

describe('Rate completed trip', () => {
  let modal: RateTripModal;
  let http: HttpTestingController;
  let close: jasmine.Spy;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    close = jasmine.createSpy('close');
    navigate = jasmine.createSpy('navigate').and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: Router, useValue: { navigate } },
      { provide: TranslateService, useValue: { instant: (key: string) => key } }
    ] });
    modal = TestBed.runInInjectionContext(() => new RateTripModal({ close } as unknown as MatDialogRef<RateTripModal>, { bookingId: 'completed-booking' }));
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps score, comment and selected tags after a failure, prevents duplicate submits and retries', () => {
    modal.onSubmit();
    http.expectNone(environment.apiUrl + '/bookings/completed-booking/rating');
    modal.setRating(4);
    modal.comment = 'Buen viaje';
    modal.toggleTag('clean');
    modal.toggleTag('Cómodo');
    modal.toggleTag('Cómodo');
    modal.onSubmit();
    modal.onSubmit();
    const initial = http.expectOne(environment.apiUrl + '/bookings/completed-booking/rating');
    expect(initial.request.method).toBe('POST');
    expect(initial.request.body).toEqual({ score: 4, comment: 'Buen viaje', tags: ['clean'] });
    expect(modal.saving).toBeTrue();
    initial.flush({}, { status: 500, statusText: 'Failed' });
    expect(modal.saving).toBeFalse();
    expect(modal.error).toBe('trip.rateTrip.error');
    expect(close).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    modal.onSubmit();
    const retry = http.expectOne(environment.apiUrl + '/bookings/completed-booking/rating');
    expect(retry.request.body).toEqual(initial.request.body);
    expect(modal.error).toBe('');
    retry.flush({ rating: { score: 4, comment: 'Buen viaje', tags: ['clean'] } });
    expect(close).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledOnceWith(['/home']);
  });

  it('skips without recording a rating and returns home', () => {
    modal.onClose();
    expect(close).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledOnceWith(['/home']);
    http.expectNone(environment.apiUrl + '/bookings/completed-booking/rating');
  });
});
