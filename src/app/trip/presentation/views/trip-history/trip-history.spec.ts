import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TripHistory } from './trip-history';
import { environment } from '../../../../../environments/environment';

const api = environment.apiUrl;
const booking = { id: 'completed-uuid', userId: '42', vehicleId: 7, startLocationId: 1, endLocationId: 2,
  status: 'completed', startDate: '2026-10-01T10:00:00Z', actualStartDate: '2026-10-01T10:05:00Z',
  actualEndDate: '2026-10-01T10:15:00Z', duration: 10, distance: 2, averageSpeed: 12,
  finalCost: 3, totalCost: 5, routeCoordinates: [{ lat: -12.1, lng: -77.1 }, { lat: -12.2, lng: -77.2 }] };

describe('Booking-backed trip history', () => {
  let fixture: ComponentFixture<TripHistory>;
  let component: TripHistory;
  let http: HttpTestingController;

  function setup(bookingId?: string) {
    TestBed.configureTestingModule({ imports: [TripHistory, TranslateModule.forRoot()], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(bookingId ? { bookingId } : {}) } } }
    ] });
    fixture = TestBed.createComponent(TripHistory);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }
  function lookups() {
    http.match(api + '/vehicles').forEach(request => { if (!request.cancelled) request.flush([{ id: 7, brand: 'Xiaomi', model: 'M365', image: '' }]); });
    http.match(api + environment.endpoints.locations).forEach(request => { if (!request.cancelled) request.flush([{ id: 1, name: 'Inicio' }, { id: 2, name: 'Fin' }]); });
  }
  function page(number: number, content: unknown[], totalPages = 2) {
    http.expectOne(request => request.url === api + '/bookings/history' && request.params.get('page') === String(number))
      .flush({ content, totalElements: 2, totalPages, number, size: 10 });
    lookups();
    fixture.detectChanges();
  }
  afterEach(() => http.verify());

  it('loads completed bookings with real dates/cost/stations and retries the same next page without losing previous rows', () => {
    setup();
    page(0, [booking]);
    expect(component.trips[0].startedAt).toBe(booking.actualStartDate);
    expect(component.trips[0].finalCost).toBe(3);
    expect(component.trips[0].vehicleName).toBe('Xiaomi M365');
    expect(component.trips[0].route).toBe('Inicio → Fin');
    expect(component.hasMore).toBeTrue();
    component.seeMore();
    http.expectOne(request => request.url === api + '/bookings/history' && request.params.get('page') === '1')
      .flush({}, { status: 500, statusText: 'Failed' });
    lookups();
    expect(component.trips.length).toBe(1);
    expect(component.nextPage).toBe(1);
    expect(component.error).toBe('trip.history.error');
    component.retry();
    page(1, [booking, { ...booking, id: 'second-uuid' }]);
    expect(component.trips.map(trip => trip.id)).toEqual(['completed-uuid', 'second-uuid']);
    expect(component.hasMore).toBeFalse();
    http.expectNone(api + '/trips');
  });

  it('shows an empty state without offering fake pagination', () => {
    setup();
    page(0, [], 0);
    expect(fixture.nativeElement.textContent).toContain('trip.history.empty');
    expect(fixture.nativeElement.querySelector('.see-more-btn')).toBeNull();
    expect(component.formatDate(null)).toBe('—');
  });

  it('opens a completed booking summary by ID even when it is outside the current page', () => {
    setup('completed-uuid');
    http.expectOne(api + '/bookings/history/completed-uuid').flush(booking);
    page(0, [], 0);
    expect(component.selectedTrip?.routeCoordinates).toEqual(booking.routeCoordinates);
    expect(fixture.nativeElement.querySelector('#trip-history-details').textContent).toContain('completed-uuid');
    expect(fixture.nativeElement.querySelectorAll('.route-coordinates li').length).toBe(2);
  });
});
