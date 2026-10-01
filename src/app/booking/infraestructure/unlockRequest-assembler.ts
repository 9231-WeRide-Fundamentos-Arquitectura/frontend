import { UnlockRequest } from '../domain/model/unlockRequest.entity';
import { UnlockRequestResponse } from './unlockRequests-response';

// Convierte UnlockRequestResponse (infraestructura) a UnlockRequest (dominio)
export function toDomainUnlockRequest(response: UnlockRequestResponse): UnlockRequest {
  return new UnlockRequest(
    response.id,
    response.userId,
    response.vehicleId,
    response.bookingId,
    new Date(response.requestedAt),
    new Date(response.scheduledUnlockTime),
    response.actualUnlockTime ? new Date(response.actualUnlockTime) : null,
    response.status,
    response.method,
    response.location,
    response.unlockCode,
    response.attempts,
    response.errorMessage
  );
}

// Convierte UnlockRequest (dominio) a UnlockRequestResponse (infraestructura)
export function toInfraUnlockRequest(unlockRequest: UnlockRequest): Omit<UnlockRequestResponse, 'id'> {
  return {
    userId: unlockRequest.userId,
    vehicleId: unlockRequest.vehicleId,
    bookingId: unlockRequest.bookingId,
    requestedAt: unlockRequest.requestedAt.toISOString(),
    scheduledUnlockTime: unlockRequest.scheduledUnlockTime.toISOString(),
    actualUnlockTime: unlockRequest.actualUnlockTime ? unlockRequest.actualUnlockTime.toISOString() : null,
    status: unlockRequest.status,
    method: unlockRequest.method,
    location: unlockRequest.location,
    unlockCode: unlockRequest.unlockCode,
    attempts: unlockRequest.attempts,
    errorMessage: unlockRequest.errorMessage
  };
}
