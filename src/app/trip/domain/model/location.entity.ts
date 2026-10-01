export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OperatingHours {
  open: string;
  close: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  type: string;
  capacity: number;
  availableSpots: number;
  isActive: boolean;
  operatingHours: OperatingHours;
  amenities: string[];
  district: string;
  description: string;
  image: string;
}

