import { Vehicle } from '../../domain/model/vehicle.model';
import { VehicleFilter } from '../../domain/model/vehicle-filter.model';

export class VehicleFilterService {
  static apply(vehicles: Vehicle[], filter: VehicleFilter): Vehicle[] {
    return vehicles.filter(v => {
      return (!filter.type || v.type === filter.type) &&
        (!filter.minPrice || v.pricePerMinute >= filter.minPrice) &&
        (!filter.maxPrice || v.pricePerMinute <= filter.maxPrice) &&
        (!filter.status || v.status === filter.status) &&
        (!filter.minRating || v.rating >= filter.minRating) &&
        (!filter.brand || v.brand.toLowerCase().includes(filter.brand.toLowerCase())) &&
        (!filter.companyId || v.companyId === filter.companyId) &&
        (!filter.minBattery || v.battery >= filter.minBattery) &&
        (!filter.color || v.color.toLowerCase() === filter.color.toLowerCase()) &&
        (!filter.showFavoritesOnly || v.favorite === true);
    });
  }
}
