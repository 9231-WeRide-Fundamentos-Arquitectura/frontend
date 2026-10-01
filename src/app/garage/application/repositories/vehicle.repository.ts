import { Vehicle } from '../../domain/model/vehicle.model';

export abstract class VehicleRepository {
  abstract findAll(): Promise<Vehicle[]>;
}
