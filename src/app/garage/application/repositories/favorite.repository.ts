import { Observable } from 'rxjs';
import { Favorite } from '../../domain/model/favorite.model';

export abstract class FavoriteRepository {
  abstract getUserFavorites(userId: string): Observable<Favorite[]>;
  abstract addFavorite(userId: string, vehicleId: string, notes?: string): Observable<Favorite>;
  abstract removeFavorite(favoriteId: string): Observable<void>;
  abstract isFavorite(userId: string, vehicleId: string): Observable<boolean>;
}
