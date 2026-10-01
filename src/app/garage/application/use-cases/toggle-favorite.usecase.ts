import { Injectable, inject } from '@angular/core';
import { FavoriteStore } from '../favorite.store';

@Injectable({
  providedIn: 'root'
})
export class ToggleFavoriteUseCase {
  private favoriteStore = inject(FavoriteStore);

  execute(userId: string, vehicleId: string): void {
    this.favoriteStore.toggleFavorite({ userId, vehicleId });
  }
}
