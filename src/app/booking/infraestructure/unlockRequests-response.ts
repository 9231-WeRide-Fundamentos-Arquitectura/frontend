// Respuesta de la API para una solicitud de desbloqueo
export interface UnlockRequestResponse {
  id: string;
  userId: string;
  vehicleId: string;
  bookingId: string;
  requestedAt: string;
  scheduledUnlockTime: string;
  actualUnlockTime: string | null;
  status: 'pending' | 'unlocked' | 'failed';
  method: string;
  location: { lat: number; lng: number };
  unlockCode: string;
  attempts: number;
  errorMessage: string | null;
}

// Respuesta de la API para listado de solicitudes de desbloqueo
export interface UnlockRequestsListResponse {
  unlockRequests: UnlockRequestResponse[];
}
