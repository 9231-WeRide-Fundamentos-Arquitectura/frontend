export class UnlockRequest {
  constructor(
    public id: string,
    public userId: string,
    public vehicleId: string,
    public bookingId: string,
    public requestedAt: Date,
    public scheduledUnlockTime: Date,
    public actualUnlockTime: Date | null,
    public status: 'pending' | 'unlocked' | 'failed',
    public method: string,
    public location: { lat: number; lng: number },
    public unlockCode: string,
    public attempts: number,
    public errorMessage: string | null
  ) {}
}
