import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Favorite } from '../../domain/model/favorite.model';
import { FavoriteRepository } from '../repositories/favorite.repository';

@Injectable({
  providedIn: 'root'
})
export class GetUserFavoritesUseCase {
  private favoriteRepository = inject(FavoriteRepository);

  execute(userId: string): Observable<Favorite[]> {
    return this.favoriteRepository.getUserFavorites(userId);
  }
}
