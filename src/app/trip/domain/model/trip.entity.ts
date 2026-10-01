export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  bookingId: string;
  userId: string;
  vehicleId: string;
  startLocationId: string;
  endLocationId: string;
  route: string;
  routeCoordinates: RouteCoordinate[];
  startDate: string;
  endDate: string;
  duration: number;
  distance: number;
  averageSpeed: number;
  maxSpeed: number;
  totalCost: number;
  carbonSaved: number;
  caloriesBurned: number;
  weather: string;
  temperature: number;
  status: string;
  incidentReports: string[];
  photos: string[];
}

