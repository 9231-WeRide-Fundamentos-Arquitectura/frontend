import { Trip } from '../domain/model/trip.entity';

export function toDomainTrip(response: Trip): Trip {
  return {
    ...response,
    id: String(response.id), bookingId: String(response.bookingId), userId: String(response.userId),
    vehicleId: String(response.vehicleId), startLocationId: String(response.startLocationId),
    endLocationId: response.endLocationId == null ? '' : String(response.endLocationId)
  };
}
