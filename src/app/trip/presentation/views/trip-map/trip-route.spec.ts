import { signal } from '@angular/core';
import { TripMap } from './trip-map';

describe('Recorded ride route', () => {
  it('restores this booking, ignores invalid points and keeps the full route within the server limit', () => {
    const key = 'weride_route_test-user_test-booking';
    sessionStorage.setItem(key, JSON.stringify([{ lat: -12, lng: -77 }]));
    const map = Object.create(TripMap.prototype) as any;
    map.activeBookingService = { getActiveBooking: () => ({ id: 'test-booking', userId: 'test-user' }) };
    map.isActiveTrip = () => true;
    map.routeBookingId = null;
    map.routeCoordinates = [];
    map.routeDistance = 0;
    map.estimatedDistance = signal(0);
    try {
      map.recordRoutePosition({ lat: -12.001, lng: -77 });
      expect(map.routeCoordinates.length).toBe(2);
      expect(map.routeDistance).toBeGreaterThan(0.1);
      map.recordRoutePosition({ lat: -12.001, lng: -77 });
      map.recordRoutePosition({ lat: 91, lng: -77 });
      expect(map.routeCoordinates.length).toBe(2);
      map.routeCoordinates = Array.from({ length: 5000 }, (_, i) => ({ lat: -12 + i / 100000, lng: -77 }));
      map.recordRoutePosition({ lat: -11.95, lng: -77 });
      expect(map.routeCoordinates.length).toBe(2501);
      expect(map.routeCoordinates[0]).toEqual({ lat: -12, lng: -77 });
      expect(map.routeCoordinates.at(-1)).toEqual({ lat: -11.95, lng: -77 });
      expect(JSON.parse(sessionStorage.getItem(key)!).length).toBe(2501);
    } finally { sessionStorage.removeItem(key); }
  });
});
