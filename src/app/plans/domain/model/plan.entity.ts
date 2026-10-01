export class Plan {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public price: number,
    public currency: string,
    public pricePerMinute: number,
    public duration: string,
    public durationDays: number,
    public maxTripsPerDay: number,
    public maxMinutesPerTrip: number,
    public freeMinutesPerMonth: number,
    public discountPercentage: number,
    public benefits: string[],
    public color: string,
    public isPopular: boolean,
    public isActive: boolean,
    public studentVerificationRequired?: boolean,
    public corporateVerificationRequired?: boolean
  ) {}
}

