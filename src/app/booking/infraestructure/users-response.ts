// Respuesta de la API para un usuario
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  membershipPlanId: string;
  isActive: boolean;
  profilePicture: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  drivingLicense?: string;
  verificationStatus: string;
  registrationDate: string;
  preferences: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  statistics: {
    totalTrips: number;
    totalDistance: number;
    totalSpent: number;
    averageRating: number;
  };
}

// Respuesta de la API para listado de usuarios
export interface UsersListResponse {
  users: UserResponse[];
}
