import { Vehicle } from '../domain/model/vehicle.entity';
import { VehicleResponse } from './vehicle-response';

export function toDomainVehicle(response: VehicleResponse): Vehicle {
  return new Vehicle(
    response.id,
    response.brand,
    response.model,
    response.year,
    response.battery,
    response.maxSpeed,
    response.range,
    response.weight,
    response.color,
    response.licensePlate,
    response.location,
    response.status,
    response.type,
    response.companyId,
    response.pricePerMinute,
    response.image,
    response.features,
    response.maintenanceStatus,
    new Date(response.lastMaintenance),
    new Date(response.nextMaintenance),
    response.totalKilometers,
    response.rating
  );
}

export function toInfraVehicle(vehicle: Vehicle): Omit<VehicleResponse, 'id'> {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    battery: vehicle.battery,
    maxSpeed: vehicle.maxSpeed,
    range: vehicle.range,
    weight: vehicle.weight,
    color: vehicle.color,
    licensePlate: vehicle.licensePlate,
    location: vehicle.location,
    status: vehicle.status,
    type: vehicle.type,
    companyId: vehicle.companyId,
    pricePerMinute: vehicle.pricePerMinute,
    image: vehicle.image,
    features: vehicle.features,
    maintenanceStatus: vehicle.maintenanceStatus,
    lastMaintenance: vehicle.lastMaintenance.toISOString(),
    nextMaintenance: vehicle.nextMaintenance.toISOString(),
    totalKilometers: vehicle.totalKilometers,
    rating: vehicle.rating
  };
}
