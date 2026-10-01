export interface Favorite {
  id: string;
  userId: string;
  vehicleId: string;
  addedAt: Date;
  notes?: string;
}
