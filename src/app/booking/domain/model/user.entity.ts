export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public password: string,
    public phone: string,
    public membershipPlanId: string,
    public isActive: boolean,
    public profilePicture: string,
    public dateOfBirth: string,
    public address: string,
    public emergencyContact: string,
    public drivingLicense: string | undefined,
    public verificationStatus: string,
    public registrationDate: Date,
    public preferences: {
      language: string;
      notifications: boolean;
      theme: string;
    },
    public statistics: {
      totalTrips: number;
      totalDistance: number;
      totalSpent: number;
      averageRating: number;
    }
  ) {}
}
