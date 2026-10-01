import { Injectable, inject } from '@angular/core';
import { FavoriteStore } from '../favorite.store';
import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleFilter } from '../../domain/model/vehicle-filter.model';
import { VehicleRepository } from '../repositories/vehicle.repository';
import { VehicleFilterService } from '../services/vehicle-filter.service';

@Injectable({
  providedIn: 'root'
})
export class FilterVehiclesUseCase {
  private favorites = inject(FavoriteStore);
  constructor(private vehicleRepo: VehicleRepository) {}

  async execute(filter: VehicleFilter): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo.findAll();
    return VehicleFilterService.apply(vehicles.map(vehicle => ({ ...vehicle, favorite: this.favorites.isFavorite(vehicle.id) })), filter);
  }
}
