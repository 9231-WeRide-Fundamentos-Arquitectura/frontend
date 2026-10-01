import {Component, OnInit, inject, computed, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {TranslateModule} from '@ngx-translate/core';
import {VehicleCard} from '../vehicle-card/vehicle-card';
import {Vehicle} from '../../../domain/model/vehicle.model';
import {GetVehiclesUseCase} from '../../../application/use-cases/get-vehicles.usecase';
import {ToggleFavoriteUseCase} from '../../../application/use-cases/toggle-favorite.usecase';
import {FavoriteStore} from '../../../application/favorite.store';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, VehicleCard, TranslateModule],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class Favorites implements OnInit {
  private getVehiclesUseCase = inject(GetVehiclesUseCase);
  private toggleFavoriteUseCase = inject(ToggleFavoriteUseCase);
  private favoriteStore = inject(FavoriteStore);

  // Use signal for reactivity
  allVehicles = signal<Vehicle[]>([]);
  isLoading = computed(() => this.favoriteStore.isLoading());
  error = computed(() => this.favoriteStore.error());

  // Reactive computed property that automatically updates when favorites change
  favoriteVehicles = computed(() => {
    const favoriteIds = this.favoriteStore.favoriteVehicleIds();
    const vehicles = this.allVehicles();

    const filtered = vehicles.filter(v => {
      const match = favoriteIds.includes(v.id);
      return match;
    });

    return filtered.map(v => ({
      ...v,
      favorite: true
    }));
  });

  async ngOnInit() {
    // Load all vehicles once
    await this.loadVehicles();
  }

  async loadVehicles() {
    try {
      const vehicles = await this.getVehiclesUseCase.execute();
      this.allVehicles.set(vehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  get hasFavorites(): boolean {
    return this.favoriteVehicles().length > 0;
  }
}

// Debug log
