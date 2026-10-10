// Respuesta de la API para una reserva
export interface BookingResponse {
  id: string;
  userId: string;
  vehicleId: string;
  startLocationId: string;
  endLocationId: string;
  reservedAt: string;
  startDate: string;
  endDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: 'draft' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  totalCost: number | null;
  discount: number | null;
  finalCost: number | null;
  paymentMethod: string;
  paymentStatus: string;
  distance: number | null;
  duration: number | null;
  averageSpeed: number | null;
  rating: { score: number; comment: string } | null;
  issues: string[];
  // Destino libre marcado en el mapa; null en reservas antiguas.
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationAddress?: string | null;
  estimatedDistance?: number | null;
  estimatedDuration?: number | null;
  estimatedCost?: number | null;
  destinationChangeFees?: number | null;
}

// Cotización calculada por el backend para un punto de destino
export interface DestinationQuote {
  distanceKm: number;
  durationMinutes: number;
  pricePerMinute: number;
  estimatedCost: number;
  discount: number;
  changeFee: number;
  total: number;
}

// Respuesta de la API para listado de reservas
export interface BookingsListResponse {
  bookings: BookingResponse[];
}
export type BackendBookingResponse = Omit<BookingResponse, 'status'> & {
  status: BookingResponse['status'] | 'reserved' | 'in_progress';
};
