import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { timer, firstValueFrom } from 'rxjs';
import { BookingStore } from './booking.store';
import { AuthService } from '../../core/services/auth.service';
import { toDomainBooking } from '../infraestructure/booking-assembler';
import { environment } from '../../../environments/environment';

describe('Unlock server contract', () => {
  it('keeps a rejected code failed, retries the same request and never calls start from the client', async () => {
    localStorage.removeItem('active_booking');
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    TestBed.inject(AuthService).session.set({ id: '42', token: 'test-token', username: 'qa' });
    const http = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(BookingStore);
    TestBed.tick();
    const resource = { id: 'booking-id', userId: '42', vehicleId: '7', startLocationId: '3', endLocationId: '3',
      status: 'reserved', reservedAt: '2026-10-01T12:00:00Z', startDate: '2026-10-01T12:00:00Z' } as any;
    const booking = toDomainBooking(resource);
    store.addBooking(booking);
    const failed = store.unlockVehicleByQR('weride:vehicle:8', booking);
    http.expectOne(environment.apiUrl + '/unlockRequests?bookingId=booking-id').flush([{ id: 'request-id', status: 'pending' }]);
    await firstValueFrom(timer(0));
    const patch = http.expectOne(environment.apiUrl + '/unlockRequests/request-id');
    expect(patch.request.body).toEqual({ method: 'qr_code', unlockCode: 'weride:vehicle:8' });
    patch.flush({ id: 'request-id', status: 'failed', errorMessage: 'Código incorrecto' });
    expect((await failed).success).toBeFalse();
    expect(store.getBookingById(booking.id)?.status).toBe('pending');
    http.expectNone(environment.apiUrl + '/bookings/booking-id/start');
    const retry = store.unlockVehicleManually('', 'XM007', booking, 'request-id');
    http.expectOne(environment.apiUrl + '/unlockRequests/request-id').flush({ id: 'request-id', status: 'unlocked' });
    await firstValueFrom(timer(0));
    http.expectOne(environment.apiUrl + '/bookings').flush([{ ...resource, status: 'in_progress', actualStartDate: resource.startDate }]);
    expect((await retry).success).toBeTrue();
    expect(store.getBookingById(booking.id)?.status).toBe('active');
    http.expectNone(environment.apiUrl + '/bookings/booking-id/start');
    http.verify();
    TestBed.inject(AuthService).logout();
  });
});
