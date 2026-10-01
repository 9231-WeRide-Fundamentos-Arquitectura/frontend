import { Provider } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { VehicleRepository } from './application/repositories/vehicle.repository';
import { VehicleRepositoryImpl } from './infrastructure/repositories/vehicle.repository.impl';
import { FavoriteRepository } from './application/repositories/favorite.repository';
import { FavoriteRepositoryImpl } from './infrastructure/repositories/favorite.repository.impl';
import { GetVehiclesUseCase } from './application/use-cases/get-vehicles.usecase';
import { FilterVehiclesUseCase } from './application/use-cases/filter-vehicles.usecase';
import { ToggleFavoriteUseCase } from './application/use-cases/toggle-favorite.usecase';
import { GetUserFavoritesUseCase } from './application/use-cases/get-user-favorites.usecase';
import { VehicleApiService } from './infrastructure/http/vehicle-api.service';
import { FavoriteApiService } from './infrastructure/http/favorite-api.service';
import { FavoriteStore } from './application/favorite.store';

export const GARAGE_PROVIDERS: Provider[] = [
  MatDialog,
  VehicleApiService,
  FavoriteApiService,
  GetVehiclesUseCase,
  FilterVehiclesUseCase,
  ToggleFavoriteUseCase,
  GetUserFavoritesUseCase,
  FavoriteStore,
  {
    provide: VehicleRepository,
    useClass: VehicleRepositoryImpl
  },
  {
    provide: FavoriteRepository,
    useClass: FavoriteRepositoryImpl
  }
];
