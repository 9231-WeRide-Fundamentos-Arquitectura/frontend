// Respuesta de la API para un vehículo
export interface VehicleResponse {
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
  status: 'available' | 'reserved' | 'maintenance';
  type: string;
  companyId: string;
  pricePerMinute: number;
  image: string;
  features: string[];
  maintenanceStatus: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKilometers: number;
  rating: number;
}

// Respuesta de la API para listado de vehículos
export interface VehiclesListResponse {
  vehicles: VehicleResponse[];
}
