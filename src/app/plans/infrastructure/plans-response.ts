export interface PlanResponse {
  active?: boolean;
  popular?: boolean;
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  pricePerMinute: number;
  duration: string;
  durationDays: number;
  maxTripsPerDay: number;
  maxMinutesPerTrip: number;
  freeMinutesPerMonth: number;
  discountPercentage: number;
  benefits: string[];
  color: string;
  isPopular: boolean;
  isActive: boolean;
  studentVerificationRequired?: boolean;
  corporateVerificationRequired?: boolean;
}

