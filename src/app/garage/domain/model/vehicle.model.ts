export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  battery: number;
  maxSpeed: number;
  range: number;
  weight: number;
  color: string;
  licensePlate: string;
  location: string;
  status: 'available' | 'reserved' | 'maintenance' | 'in_use';
  type: 'electric_scooter' | 'bike' | 'electric_bike';
  companyId: string;
  pricePerMinute: number;
  image: string;
  features: string[];
  maintenanceStatus: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKilometers: number;
  rating: number;
  favorite?: boolean;
}

export function hasCriticalBattery(vehicle: { type: string; battery: number } | null): boolean {
  return vehicle?.type === 'electric_scooter' && vehicle.battery < 15;
}
