import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FavoriteRepository } from '../../application/repositories/favorite.repository';
import { Favorite } from '../../domain/model/favorite.model';
import { FavoriteApiService } from '../http/favorite-api.service';
import { FavoriteMapper } from '../mappers/favorite.mapper';

@Injectable({
  providedIn: 'root'
})
export class FavoriteRepositoryImpl extends FavoriteRepository {
  constructor(private favoriteApiService: FavoriteApiService) {
    super();
  }

  getUserFavorites(userId: string): Observable<Favorite[]> {
    return this.favoriteApiService.getUserFavorites(userId).pipe(
      map(response => FavoriteMapper.toDomainList(response))
    );
  }

  addFavorite(userId: string, vehicleId: string, notes?: string): Observable<Favorite> {
    return this.favoriteApiService.addFavorite(userId, vehicleId, notes).pipe(
      map(response => FavoriteMapper.toDomain(response))
    );
  }

  removeFavorite(favoriteId: string): Observable<void> {
    return this.favoriteApiService.removeFavorite(favoriteId);
  }

  isFavorite(userId: string, vehicleId: string): Observable<boolean> {
    return this.favoriteApiService.isFavorite(userId, vehicleId);
  }
}
