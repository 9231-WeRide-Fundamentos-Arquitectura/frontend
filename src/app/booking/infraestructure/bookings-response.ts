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
  archived?: boolean;
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
// GET /bookings/{id}/details: reserva con vehículo, estaciones y solicitud de desbloqueo vigente.
// currentBattery y unlock solo vienen en reservas reserved / in_progress.
export interface BookingDetailsResponse {
  booking: BookingResponse;
  vehicle: { id: string; brand: string; model: string; type: string; image: string | null; color: string | null;
    pricePerMinute: number; currentBattery: number | null } | null;
  startLocation: { id: string; name: string; address: string | null } | null;
  endLocation: { id: string; name: string; address: string | null } | null;
  unlock: { id: string; status: string; accessCode: string | null; codeExpiresAt: string | null } | null;
}

export type BackendBookingResponse = Omit<BookingResponse, 'status'> & {
  status: BookingResponse['status'] | 'reserved' | 'in_progress';
};
