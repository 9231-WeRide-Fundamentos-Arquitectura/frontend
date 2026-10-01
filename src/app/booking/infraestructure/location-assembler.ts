import { Location } from '../domain/model/location.entity';
import { LocationResponse } from './locations-response';

// Convierte LocationResponse (infraestructura) a Location (dominio)
export function toDomainLocation(response: LocationResponse): Location {
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
