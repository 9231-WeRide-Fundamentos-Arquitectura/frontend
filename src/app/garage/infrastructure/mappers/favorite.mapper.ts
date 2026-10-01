import { Favorite } from '../../domain/model/favorite.model';
import { FavoriteApiResponse } from '../http/favorite-api.service';

export class FavoriteMapper {
  static toDomain(apiResponse: FavoriteApiResponse): Favorite {
    return {
      id: apiResponse.id,
      userId: apiResponse.userId,
      vehicleId: apiResponse.vehicleId,
      addedAt: new Date(apiResponse.addedAt),
      notes: apiResponse.notes
    };
  }

  static toDomainList(apiResponses: FavoriteApiResponse[]): Favorite[] {
    return apiResponses.map(response => this.toDomain(response));
  }
}
