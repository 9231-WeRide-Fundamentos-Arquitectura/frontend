// Respuesta de la API para una ubicación
export interface LocationResponse {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: string;
  capacity: number;
  availableSpots: number;
  isActive: boolean;
  operatingHours: { open: string; close: string };
  amenities: string[];
  district: string;
  description: string;
  image: string;
}

// Respuesta de la API para listado de ubicaciones
export interface LocationsListResponse {
  locations: LocationResponse[];
}
