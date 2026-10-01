import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Favorite } from '../domain/model/favorite.model';
import { FavoriteRepository } from './repositories/favorite.repository';

const initialState = { favorites: [] as Favorite[], favoriteVehicleIds: [] as string[], isLoading: false, error: null as string | null };

export const FavoriteStore = signalStore(
  withState(initialState),
  withMethods(store => {
    const repository = inject(FavoriteRepository);
    const setFavorites = (favorites: Favorite[]) => patchState(store, {
      favorites, favoriteVehicleIds: favorites.map(favorite => favorite.vehicleId)
    });
    return {
      async loadUserFavorites(userId: string): Promise<void> {
        patchState(store, { ...initialState, isLoading: true });
        try {
          setFavorites(await firstValueFrom(repository.getUserFavorites(userId)));
        } catch {
          patchState(store, { error: 'garage.favorites.error' });
        } finally {
          patchState(store, { isLoading: false });
        }
      },
      async toggleFavorite({ userId, vehicleId }: { userId: string; vehicleId: string }): Promise<void> {
        patchState(store, { error: null });
        try {
          const existing = store.favorites().find(favorite => favorite.vehicleId === vehicleId);
          if (existing) {
            await firstValueFrom(repository.removeFavorite(existing.id));
            setFavorites(store.favorites().filter(favorite => favorite.id !== existing.id));
          } else {
            const favorite = await firstValueFrom(repository.addFavorite(userId, vehicleId));
            setFavorites([...store.favorites().filter(item => item.vehicleId !== vehicleId), favorite]);
          }
        } catch (error) {
          patchState(store, { error: 'garage.favorites.error' });
          throw error;
        }
      },
      isFavorite: (vehicleId: string) => store.favoriteVehicleIds().includes(vehicleId),
      clearError: () => patchState(store, { error: null }),
      reset: () => patchState(store, initialState)
    };
  })
);
