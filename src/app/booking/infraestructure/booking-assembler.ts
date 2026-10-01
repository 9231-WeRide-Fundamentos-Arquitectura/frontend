import { Booking } from '../domain/model/booking.entity';
import { BookingResponse, BackendBookingResponse } from './bookings-response';

export function normalizeBookingResponse(response: BackendBookingResponse): BookingResponse {
  return {
    ...response,
    id: String(response.id), userId: String(response.userId), vehicleId: String(response.vehicleId),
    startLocationId: String(response.startLocationId), endLocationId: response.endLocationId == null ? '' : String(response.endLocationId),
    status: response.status === 'reserved' ? 'pending' : response.status === 'in_progress' ? 'active' : response.status,
    issues: response.issues ?? []
  };
}

// Convierte BookingResponse (infraestructura) a Booking (dominio)
export function toDomainBooking(raw: BackendBookingResponse): Booking {
  const response = normalizeBookingResponse(raw);
  return new Booking(
    response.id,
    response.userId,
    response.vehicleId,
    response.startLocationId,
    response.endLocationId,
    new Date(response.reservedAt),
    new Date(response.startDate ?? response.reservedAt),
    response.endDate ? new Date(response.endDate) : null,
    response.actualStartDate ? new Date(response.actualStartDate) : null,
    response.actualEndDate ? new Date(response.actualEndDate) : null,
    response.status,
    response.totalCost,
    response.discount,
    response.finalCost,
    response.paymentMethod,
    response.paymentStatus,
    response.distance,
    response.duration,
    response.averageSpeed,
    response.rating,
    response.issues
  );
}

// Convierte Booking (dominio) a BookingResponse (infraestructura)
export function toInfraBooking(booking: Booking): Omit<BookingResponse, 'id'> {
  return {
    userId: booking.userId,
    vehicleId: booking.vehicleId,
    startLocationId: booking.startLocationId,
    endLocationId: booking.endLocationId,
    reservedAt: booking.reservedAt.toISOString(),
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate ? booking.endDate.toISOString() : null,
    actualStartDate: booking.actualStartDate ? booking.actualStartDate.toISOString() : null,
    actualEndDate: booking.actualEndDate ? booking.actualEndDate.toISOString() : null,
    status: booking.status,
    totalCost: booking.totalCost,
    discount: booking.discount,
    finalCost: booking.finalCost,
    paymentMethod: booking.paymentMethod,
    paymentStatus: booking.paymentStatus,
    distance: booking.distance,
    duration: booking.duration,
    averageSpeed: booking.averageSpeed,
    rating: booking.rating,
    issues: booking.issues
  };
}
