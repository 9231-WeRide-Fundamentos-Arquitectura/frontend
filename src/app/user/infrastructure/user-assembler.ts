import { User } from '../domain/model/user.entity';
import { UserResponse } from './user-response';

export class UserAssembler {
  static toDomain(response: UserResponse): User {
    return new User(
      response.accountId, response.name ?? '', '', 0, response.phone ?? '', '', true,
      response.profilePicture ?? '', response.dateOfBirth ?? '', response.address ?? '',
      response.emergencyContact ?? '', '', new Date(0),
      { language: response.language, notifications: response.notifications, theme: response.theme },
      { totalTrips: 0, totalDistance: 0, totalSpent: 0, averageRating: 0 }
    );
  }
}
