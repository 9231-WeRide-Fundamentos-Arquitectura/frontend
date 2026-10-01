import { Injectable } from '@angular/core';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleFilter } from '../../domain/model/vehicle-filter.model';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { VehicleFilterService } from '../services/vehicle-filter.service';

@Injectable({
  providedIn: 'root'
})
export class FilterVehiclesUseCase {
  constructor(private vehicleRepo: VehicleRepository) {}

  async execute(filter: VehicleFilter): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo.findAll();
    return VehicleFilterService.apply(vehicles, filter);
  }
}
