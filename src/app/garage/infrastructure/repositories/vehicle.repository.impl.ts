import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleRepository } from '../../application/repositories/vehicle.repository';
import { Injectable } from '@angular/core';
import { VehicleApiService } from '../http/vehicle-api.service';
import { VehicleMapper } from '../mappers/vehicle.mapper';

@Injectable({
  providedIn: 'root'
})
export class VehicleRepositoryImpl implements VehicleRepository {
  constructor(private vehicleApiService: VehicleApiService) {}

  async findAll(): Promise<Vehicle[]> {
    try {
      const apiResponse = await this.vehicleApiService.getVehiclesAsync();
      return VehicleMapper.toDomainList(apiResponse);
    } catch (error) {
      console.error('Error fetching vehicles from API:', error);
      throw new Error('No se pudieron cargar los vehículos desde la API');
    }
  }
}
