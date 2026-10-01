import { User } from '../domain/model/user.entity';
import {UserResponse} from './user-response';

export class UserAssembler {
  static toDomain(response: UserResponse): User {
    return new User(
      response.id,
      response.name,
      response.email,
      response.password,
      response.phone,
      response.membershipPlanId,
      response.isActive,
      response.profilePicture,
      response.dateOfBirth,
      response.address,
      response.emergencyContact,
      response.verificationStatus,
      new Date(response.registrationDate),
      response.preferences,
      response.statistics
    );
  }

  static toDomainList(responses: UserResponse[]): User[] {
    return responses.map(response => this.toDomain(response));
  }
}
