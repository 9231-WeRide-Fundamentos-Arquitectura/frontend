import { Location } from '../domain/model/location.entity';
import { LocationResponse } from './locations-response';

export function normalizeLocationResponse<T extends { id: string; isActive: boolean; active?: boolean }>(response: T): T {
  return { ...response, id: String(response.id), isActive: response.active ?? response.isActive };
}

// Convierte LocationResponse (infraestructura) a Location (dominio)
export function toDomainLocation(raw: LocationResponse): Location {
  const response = normalizeLocationResponse(raw);
  return new Location(
    response.id,
    response.name,
    response.address,
    response.coordinates,
    response.type,
    response.capacity,
    response.availableSpots,
    response.isActive,
    response.operatingHours,
    response.amenities,
    response.district,
    response.description,
    response.image
  );
}

// Convierte Location (dominio) a LocationResponse (infraestructura)
export function toInfraLocation(location: Location): Omit<LocationResponse, 'id'> {
  return {
    name: location.name,
    address: location.address,
    coordinates: location.coordinates,
    type: location.type,
    capacity: location.capacity,
    availableSpots: location.availableSpots,
    isActive: location.isActive,
    operatingHours: location.operatingHours,
    amenities: location.amenities,
    district: location.district,
    description: location.description,
    image: location.image
  };
}
