export interface UserResponse {
  id: number;
  accountId: number;
  name: string | null;
  phone: string | null;
  profilePicture: string | null;
  dateOfBirth: string | null;
  address: string | null;
  emergencyContact: string | null;
  language: string;
  notifications: boolean;
  theme: string;
}
