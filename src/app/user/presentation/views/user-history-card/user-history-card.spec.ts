import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { UserHistoryCard } from './user-history-card';
import { environment } from '../../../../../environments/environment';

describe('Profile booking-backed history', () => {
  let fixture: ComponentFixture<UserHistoryCard>;
  let http: HttpTestingController;
  const api = environment.apiUrl;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UserHistoryCard, TranslateModule.forRoot()], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([])
    ] });
    fixture = TestBed.createComponent(UserHistoryCard);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('separates booking failures from completed trips and opens the same persisted summary', () => {
    const booking = { id: 'completed-uuid', userId: '42', vehicleId: '7', status: 'completed',
      actualStartDate: '2026-10-01T10:05:00Z', duration: 0, distance: 0, finalCost: 0 };
    http.expectOne(request => request.url === api + '/bookings/history').flush({ content: [booking], totalElements: 1, totalPages: 1, number: 0, size: 10 });
    http.expectOne(api + '/vehicles').flush([]);
    http.expectOne(api + environment.endpoints.locations).flush([]);
    http.expectOne(api + '/bookings').flush({}, { status: 500, statusText: 'Failed' });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.trips.length).toBe(1);
    expect(component.error).toBe('');
    expect(component.bookingsError).toBe('trip.history.error');
    expect(component.formatDuration(0)).toBe('0m');
    expect(component.trips[0].finalCost).toBe(0);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component.viewDetails(component.trips[0]);
    expect(navigate).toHaveBeenCalledOnceWith(['/trip/history'], { queryParams: { bookingId: 'completed-uuid' } });
    component.loadBookings();
    http.expectOne(api + '/bookings').flush([]);
    expect(component.bookingsError).toBe('');
    http.expectNone(api + '/trips');
  });
});
