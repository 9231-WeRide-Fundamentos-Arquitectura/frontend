import { VehicleFilterService } from './vehicle-filter.service';
import { Vehicle } from '../../domain/model/vehicle.model';

describe('VehicleFilterService status', () => {
  const vehicle = (status: string) => ({ status, brand: 'X', pricePerMinute: 1, rating: 5, battery: 100, type: 'bike' }) as unknown as Vehicle;
  const vehicles = ['available', 'maintenance', 'reserved', 'in_use', 'other'].map(vehicle);

  it("'unavailable' agrupa reservado, en uso y cualquier otro estado", () => {
    const result = VehicleFilterService.apply(vehicles, { status: 'unavailable' }).map(v => String(v.status));
    expect(result).toEqual(['reserved', 'in_use', 'other']);
  });

  it('available y maintenance siguen filtrando por igualdad', () => {
    expect(VehicleFilterService.apply(vehicles, { status: 'available' }).length).toBe(1);
    expect(VehicleFilterService.apply(vehicles, { status: 'maintenance' }).length).toBe(1);
  });
});
