import { User } from '../domain/model/user.entity';
import { UserResponse } from './users-response';

// Convierte UserResponse (infraestructura) a User (dominio)
export function toDomainUser(response: UserResponse): User {
  return new User(
    response.id,
    response.name,
    response.email,
    '',
    response.phone,
    response.membershipPlanId,
    response.isActive,
    response.profilePicture,
    response.dateOfBirth,
    response.address,
    response.emergencyContact,
    undefined,
    response.verificationStatus,
    new Date(response.registrationDate),
    response.preferences,
    response.statistics
  );
}

// Convierte User (dominio) a UserResponse (infraestructura)
export function toInfraUser(user: User): Omit<UserResponse, 'id'> {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    membershipPlanId: user.membershipPlanId,
    isActive: user.isActive,
    profilePicture: user.profilePicture,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    emergencyContact: user.emergencyContact,
    verificationStatus: user.verificationStatus,
    registrationDate: user.registrationDate.toISOString(),
    preferences: user.preferences,
    statistics: user.statistics
  };
}
