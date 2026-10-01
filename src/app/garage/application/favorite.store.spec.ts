import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoriteStore } from './favorite.store';
import { FavoriteRepository } from './repositories/favorite.repository';
import { FavoriteRepositoryImpl } from '../infrastructure/repositories/favorite.repository.impl';
import { FilterVehiclesUseCase } from './use-cases/filter-vehicles.usecase';
import { VehicleRepository } from './repositories/vehicle.repository';
import { environment } from '../../../environments/environment';

describe('Persisted vehicle favorites', () => {
  it('loads, filters, preserves state on a failed delete and clears another account before loading', async () => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), FavoriteStore,
      { provide: FavoriteRepository, useClass: FavoriteRepositoryImpl },
      { provide: VehicleRepository, useValue: { findAll: async () => [{ id: '7' }, { id: '8' }] } }
    ] });
    const store = TestBed.inject(FavoriteStore);
    const http = TestBed.inject(HttpTestingController);
    const api = environment.apiUrl + environment.endpoints.favorites;
    const load = store.loadUserFavorites('42');
    http.expectOne(api + '?userId=42').flush([]);
    await load;
    const add = store.toggleFavorite({ userId: '42', vehicleId: '7' });
    const create = http.expectOne(api);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ userId: '42', vehicleId: '7', notes: undefined });
    create.flush({ id: '1', userId: '42', vehicleId: '7', addedAt: '2026-10-01T12:00:00Z' });
    await add;
    expect((await TestBed.inject(FilterVehiclesUseCase).execute({ showFavoritesOnly: true })).map(vehicle => vehicle.id)).toEqual(['7']);
    const failedDelete = store.toggleFavorite({ userId: '42', vehicleId: '7' });
    http.expectOne(api + '/1').flush({}, { status: 500, statusText: 'Failed' });
    await expectAsync(failedDelete).toBeRejected();
    expect(store.favoriteVehicleIds()).toEqual(['7']);
    const reload = store.loadUserFavorites('42');
    http.expectOne(api + '?userId=42').flush([{ id: '1', userId: '42', vehicleId: '7', addedAt: '2026-10-01T12:00:00Z' }]);
    await reload;
    const remove = store.toggleFavorite({ userId: '42', vehicleId: '7' });
    const deletion = http.expectOne(api + '/1');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
    await remove;
    expect(store.favoriteVehicleIds()).toEqual([]);
    const anotherAccount = store.loadUserFavorites('43');
    expect(store.favorites()).toEqual([]);
    http.expectOne(api + '?userId=43').flush([]);
    await anotherAccount;
    http.verify();
  });
});
