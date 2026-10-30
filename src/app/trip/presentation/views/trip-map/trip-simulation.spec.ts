import { signal } from '@angular/core';
import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { componentTestProviders } from '../../../../../testing/component-test-providers';
import { ActiveBookingService } from '../../../../booking/application/active-booking.service';
import { BookingStore } from '../../../../booking/application/booking.store';
import { toDomainBooking } from '../../../../booking/infraestructure/booking-assembler';
import { BackendBookingResponse } from '../../../../booking/infraestructure/bookings-response';
import { TripStore } from '../../../application/trip.store';
import { Vehicle } from '../../../domain/model/vehicle.entity';
import { TripMap } from './trip-map';

describe('Trip simulation completion', () => {
  let fixture: ComponentFixture<TripMap>;
  let component: TripMap;
  let http: HttpTestingController;
  let active: { getActiveBooking: jasmine.Spy; clearActiveBooking: jasmine.Spy };
  let store: { endTrip: jasmine.Spy };
  let dialog: { open: jasmine.Spy };
  const resource: BackendBookingResponse = {
    id: 'simulation-booking', userId: 'component-test-user', vehicleId: 'vehicle-1',
    startLocationId: 'station-1', endLocationId: 'station-2',
    reservedAt: new Date().toISOString(), startDate: new Date().toISOString(), endDate: null,
    actualStartDate: new Date().toISOString(), actualEndDate: null, status: 'in_progress',
    totalCost: 0, discount: 0, finalCost: 0, paymentMethod: 'app', paymentStatus: 'pending',
    distance: 0, duration: 0, averageSpeed: 0, rating: null, issues: [],
    destinationLat: -12.04, destinationLng: -77.03, estimatedDuration: 8
  };

  beforeEach(async () => {
    const origin = { id: 'station-1', coordinates: { lat: -12.05, lng: -77.04 } };
    const destination = { id: 'station-2', coordinates: { lat: -12.04, lng: -77.03 } };
    const vehicle = { id: 'vehicle-1', type: 'electric_scooter', battery: 80, pricePerMinute: 0.5 } as Vehicle;
    active = { getActiveBooking: jasmine.createSpy().and.returnValue(toDomainBooking(resource)), clearActiveBooking: jasmine.createSpy() };
    store = { endTrip: jasmine.createSpy() };
    dialog = { open: jasmine.createSpy() };
    await TestBed.configureTestingModule({
      imports: [TripMap], providers: [
        ...componentTestProviders(),
        { provide: ActiveBookingService, useValue: active },
        { provide: TripStore, useValue: {
          ...store, currentVehicle: signal(vehicle), currentLocation: signal(origin),
          destinationLocation: signal(destination), locations: signal([origin, destination]),
          tripStartTime: signal(new Date(Date.now() - 5000)), isActiveTrip: signal(true)
        } },
        { provide: BookingStore, useValue: { updateBooking: jasmine.createSpy(), setActiveBooking: jasmine.createSpy() } },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: { open: jasmine.createSpy() } }
      ]
    }).overrideComponent(TripMap, { set: { template: '' } }).compileComponents();
    fixture = TestBed.createComponent(TripMap);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); fixture.destroy(); });

  it('saves estimated metrics and the complete simulated route before clearing the active ride', async () => {
    const finishing = component.endTrip(true);
    await component.endTrip(true); // A second click cannot submit another completion.
    const request = http.expectOne('/api/v1/bookings/simulation-booking/complete');
    expect(request.request.method).toBe('POST');
    const metrics = request.request.body;
    expect(metrics.routeSource).toBe('simulated');
    expect(metrics.duration).toBe(8);
    expect(metrics.totalCost).toBe(4);
    expect(metrics.distance).toBeGreaterThan(0);
    expect(metrics.routeCoordinates.length).toBe(11);
    expect(metrics.routeCoordinates[0]).toEqual({ lat: -12.05, lng: -77.04 });
    expect(metrics.routeCoordinates.at(-1)).toEqual({ lat: -12.04, lng: -77.03 });
    expect(active.clearActiveBooking).not.toHaveBeenCalled();
    request.flush({ ...resource, ...metrics, status: 'completed', finalCost: 4 });
    await finishing;
    expect(active.clearActiveBooking).toHaveBeenCalledTimes(1);
    expect(store.endTrip).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('keeps the active ride after an error and retries the exact completion payload', async () => {
    component.recordRoutePosition({ lat: -12.05, lng: -77.04 });
    component.recordRoutePosition({ lat: -12.049, lng: -77.039 });
    const first = component.endTrip();
    const failed = http.expectOne('/api/v1/bookings/simulation-booking/complete');
    const metrics = structuredClone(failed.request.body);
    failed.flush({}, { status: 503, statusText: 'Service unavailable' });
    await first;
    expect(active.clearActiveBooking).not.toHaveBeenCalled();
    expect(store.endTrip).not.toHaveBeenCalled();
    component.recordRoutePosition({ lat: -12.048, lng: -77.038 });
    const retry = component.endTrip(true);
    const retried = http.expectOne('/api/v1/bookings/simulation-booking/complete');
    expect(retried.request.body).toEqual(metrics);
    retried.flush({ ...resource, ...metrics, status: 'completed', finalCost: 4 });
    await retry;
    expect(active.clearActiveBooking).toHaveBeenCalledTimes(1);
  });
});
