export interface UserPreferences {
  language: string;
  notifications: boolean;
  theme: string;
}

export interface UserStatistics {
  totalTrips: number;
  totalDistance: number;
  totalSpent: number;
  averageRating: number;
}

export class User {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public password: number,
    public phone: string,
    public membershipPlanId: string,
    public isActive: boolean,
    public profilePicture: string,
    public dateOfBirth: string,
    public address: string,
    public emergencyContact: string,
    public verificationStatus: string,
    public registrationDate: Date,
    public preferences: UserPreferences,
    public statistics: UserStatistics
  ) {}
}
