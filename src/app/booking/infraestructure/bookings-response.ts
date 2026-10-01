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
}

// Respuesta de la API para listado de reservas
export interface BookingsListResponse {
  bookings: BookingResponse[];
}
