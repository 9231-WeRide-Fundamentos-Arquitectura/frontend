export type BookingActivationStatus = 
  | 'scheduled'
  | 'active'
  | 'completed'
  | 'cancelled';

export class Booking {
  constructor(
    public id: string,
    public userId: string,
    public vehicleId: string,
    public startLocationId: string,
    public endLocationId: string,
    public reservedAt: Date,
    public startDate: Date,
    public endDate: Date | null,
    public actualStartDate: Date | null,
    public actualEndDate: Date | null,
    public status: 'draft' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled',
    public totalCost: number | null,
    public discount: number | null,
    public finalCost: number | null,
    public paymentMethod: string,
    public paymentStatus: string,
    public distance: number | null,
    public duration: number | null,
    public averageSpeed: number | null,
    public rating: { score: number; comment: string } | null,
    public issues: string[],
    public activationStatus?: BookingActivationStatus,
    public isActivated?: boolean,
    public activatedAt?: Date,
    public qrCode?: string,
    public unlockCode?: string
  ) {}
}
