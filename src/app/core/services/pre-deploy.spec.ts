import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, timer, of } from 'rxjs';
import { AuthService, authGuard, authInterceptor } from './auth.service';
import { environment } from '../../../environments/environment';
import { BookingsApiEndpoint } from '../../booking/infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../../booking/infraestructure/booking-assembler';
import { normalizeVehicleResponse } from '../../booking/infraestructure/vehicle-assembler';
import { normalizeLocationResponse } from '../../booking/infraestructure/location-assembler';
import { PlanAssembler } from '../../plans/infrastructure/plan-assembler';
import { UserApiEndpoint } from '../../user/infrastructure/user-api-endpoint';
import { NotificationsApiEndpoint } from '../../booking/infraestructure/notifications-api-endpoint';
import { ActiveBookingService } from '../../booking/application/active-booking.service';
import { TripInitializerService } from '../../trip/application/trip-initializer.service';
import { TripStore } from '../../trip/application/trip.store';
import { TripMap } from '../../trip/presentation/views/trip-map/trip-map';
import { BookingStore } from '../../booking/application/booking.store';
import { BookingListComponent } from '../../booking/presentation/views/booking-list/booking-list';

describe('Pre-deploy backend contracts', () => {
  const api = environment.apiUrl;
  const reserved = { id: 'booking-uuid', userId: '42', vehicleId: '7', startLocationId: '3', endLocationId: '3',
    status: 'reserved', reservedAt: '2026-09-30T12:00:00Z', startDate: '2026-09-30T12:00:00Z', actualStartDate: null } as any;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.removeItem('weride_session');
    localStorage.removeItem('active_booking');
    localStorage.removeItem('weride_bookings');
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([]),
      { provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } },
      { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
      { provide: TranslateService, useValue: { instant: (key: string) => key } }
    ] });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    auth.session.set({ id: '42', token: 'test-token', username: 'test-user' });
  });

  afterEach(() => { http.verify(); auth.logout(); localStorage.removeItem('weride_bookings'); });

  it('stores sign-in identity, scopes Bearer headers and clears an unauthorized session', () => {
    auth.signIn('test-user', 'test-password').subscribe();
    const login = http.expectOne(api + '/authentication/sign-in');
    expect(login.request.body).toEqual({ username: 'test-user', password: 'test-password' });
    expect(login.request.headers.has('Authorization')).toBeFalse();
    login.flush({ id: 42, token: 'test-token' });
    expect(auth.userId).toBe('42');
    expect(JSON.parse(localStorage.getItem('weride_session')!).id).toBe('42');
    const client = TestBed.inject(HttpClient);
    client.get('/assets/i18n/es.json').subscribe();
    const asset = http.expectOne('/assets/i18n/es.json');
    expect(asset.request.headers.has('Authorization')).toBeFalse(); asset.flush({});
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    client.get(api + '/bookings').subscribe({ error: () => {} });
    const protectedRequest = http.expectOne(api + '/bookings');
    expect(protectedRequest.request.headers.get('Authorization')).toBe('Bearer test-token');
    protectedRequest.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.session()).toBeNull();
    expect(localStorage.getItem('weride_session')).toBeNull();
    expect(TestBed.runInInjectionContext(() => authGuard({} as any, {} as any))).toBeInstanceOf(UrlTree);
  });

  it('starts and completes bookings without using the cancellation PATCH', () => {
    const bookings = TestBed.inject(BookingsApiEndpoint);
    bookings.start(reserved.id).subscribe(b => expect(b.status).toBe('active'));
    const start = http.expectOne(api + '/bookings/' + reserved.id + '/start');
    expect(start.request.method).toBe('PUT'); start.flush({ ...reserved, status: 'in_progress' });
    const metrics = { totalCost: 2, discount: 0, distance: 1, duration: 10, averageSpeed: 6, rating: null };
    bookings.complete(reserved.id, metrics).subscribe();
    const complete = http.expectOne(api + '/bookings/' + reserved.id + '/complete');
    expect(complete.request.method).toBe('POST'); expect(complete.request.body).toEqual(metrics);
    complete.flush({ ...reserved, status: 'completed' });
    bookings.getById(reserved.id).subscribe(b => expect(b.status).toBe('pending'));
    http.expectOne(api + '/bookings').flush([reserved]);
    bookings.cancel(reserved.id).subscribe();
    const cancel = http.expectOne(api + '/bookings/' + reserved.id);
    expect(cancel.request.method).toBe('PATCH'); expect(cancel.request.body).toBeNull(); cancel.flush({ ...reserved, status: 'cancelled' });
  });

  it('normalizes backend numeric IDs and preserves false flags', () => {
    expect(normalizeVehicleResponse({ id: 7, location: 3, companyId: 2 } as any)).toEqual({ id: '7', location: '3', companyId: '2' });
    expect(normalizeLocationResponse({ id: 3, active: false, isActive: true } as any)).toEqual({ id: '3', active: false, isActive: false });
    const plan = PlanAssembler.toDomain({ id: 8, active: false, popular: false, isActive: true, isPopular: true } as any);
    expect(plan.id).toBe('8'); expect(plan.isActive).toBeFalse(); expect(plan.isPopular).toBeFalse();
  });

  it('uses accountId for profiles and sends only supported update fields', () => {
    const profiles = TestBed.inject(UserApiEndpoint);
    profiles.getAll().subscribe(users => {
      expect(users[0].id).toBe(42);
      profiles.update(users[0].id, users[0]).subscribe();
    });
    http.expectOne(api + '/profiles/42').flush({ id: 900, accountId: 42, name: 'Test', phone: '+51999999999' });
    const update = http.expectOne(api + '/profiles/42');
    expect(update.request.method).toBe('PUT');
    expect(Object.keys(update.request.body).sort()).toEqual(['address', 'dateOfBirth', 'emergencyContact', 'name', 'phone', 'profilePicture']);
    update.flush({ id: 900, accountId: 42 });
  });

  it('reads the text notification acknowledgement', () => {
    TestBed.inject(NotificationsApiEndpoint).markAsRead('note').subscribe(value => expect(value).toBe('Notification marked as read'));
    const read = http.expectOne(api + '/notifications/note/read');
    expect(read.request.method).toBe('PATCH'); expect(read.request.responseType).toBe('text');
    read.flush('Notification marked as read');
  });

  it('prefers a started booking over a newer pending reservation', async () => {
    const active = TestBed.inject(ActiveBookingService); TestBed.tick();
    const check = active.checkAndStoreActiveBooking('42');
    http.expectOne(api + '/bookings').flush([
      { ...reserved, id: 'newer-pending', reservedAt: '2026-09-30T14:00:00Z' },
      { ...reserved, status: 'in_progress', actualStartDate: reserved.startDate }
    ]);
    expect((await check)?.id).toBe(reserved.id);
    expect(active.booking()?.status).toBe('active');
  });

  it('keeps a created reservation when unlock is cancelled and reuses it on retry', async () => {
    const initializer = TestBed.inject(TripInitializerService);
    const unlock = spyOn(initializer, 'requestUnlock').and.rejectWith(new Error('Cancelado'));
    TestBed.tick();
    const failed = initializer.reserveAndStart('7', '3');
    http.expectOne(api + '/bookings').flush([]); await firstValueFrom(timer(0));
    http.expectOne(api + '/location').flush([{ id: 3, coordinates: { lat: -12, lng: -77 } }]);
    await firstValueFrom(timer(0));
    const create = http.expectOne(api + '/bookings'); expect(create.request.method).toBe('POST');
    create.flush(reserved);
    await expectAsync(failed).toBeRejected();
    expect(TestBed.inject(ActiveBookingService).getActiveBooking()?.id).toBe(reserved.id);
    unlock.and.resolveTo();
    const retry = initializer.reserveAndStart('7', '3');
    http.expectOne(api + '/bookings').flush([reserved]);
    await retry;
    expect(unlock.calls.count()).toBe(2);
    http.expectNone(api + '/bookings/booking-uuid/start');
  });

  it('retains the active trip when completion fails', async () => {
    const trip = TestBed.runInInjectionContext(() => new TripMap());
    const store = TestBed.inject(TripStore); TestBed.tick();
    TestBed.inject(ActiveBookingService).setActiveBooking(toDomainBooking({ ...reserved, status: 'in_progress', actualStartDate: reserved.startDate }));
    store.startTrip(new Date(), new Date(), { id: '7', pricePerMinute: 0.2 } as any);
    const finish = trip.endTrip();
    http.expectOne(api + '/bookings/booking-uuid/complete').flush({}, { status: 500, statusText: 'Failed' });
    await finish; expect(store.isActiveTrip()).toBeTrue();
    expect(TestBed.inject(ActiveBookingService).getActiveBooking()?.id).toBe(reserved.id);
  });

  it('opens the selected unlock modal without starting a listed reservation', async () => {
    const list = TestBed.runInInjectionContext(() => new BookingListComponent());
    const store = TestBed.inject(BookingStore); TestBed.tick();
    store.addBooking(toDomainBooking(reserved));
    const dialog = TestBed.inject(MatDialog);
    (dialog.open as jasmine.Spy).and.returnValues(
      { afterClosed: () => of({ action: 'book_now' }) },
      { afterClosed: () => of({ method: 'manual' }) },
      { afterClosed: () => of({ cancelled: true }) }
    );
    await list.activateBooking({ id: reserved.id, vehicleId: '7', status: 'pending' } as any);
    http.expectOne(api + '/vehicles').flush([{ id: 7, location: 3, companyId: 2 }]);
    expect((dialog.open as jasmine.Spy).calls.count()).toBe(3);
    const data = (dialog.open as jasmine.Spy).calls.mostRecent().args[1].data;
    expect(data.booking.id).toBe(reserved.id);
    expect(data.vehicle.id).toBe('7');
    http.expectNone(api + '/bookings/booking-uuid/start');
    expect(store.getBookingById(reserved.id)?.status).toBe('pending');
  });
});
