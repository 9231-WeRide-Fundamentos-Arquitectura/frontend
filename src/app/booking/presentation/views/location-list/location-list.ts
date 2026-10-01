import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { LocationResponse } from '../../../infraestructure/locations-response';

@Component({
  selector: 'app-location-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  templateUrl: './location-list.html',
  styleUrl: './location-list.css'
})
export class LocationList implements OnInit {
  private locationsApi = inject(LocationsApiEndpoint);

  locations: LocationResponse[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.locationsApi.getAll().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.isLoading = false;
      }
    });
  }

  getCapacityPercentage(location: LocationResponse): number {
    return (location.availableSpots / location.capacity) * 100;
  }

  getCapacityColor(percentage: number): string {
    if (percentage > 50) return 'primary';
    if (percentage > 20) return 'accent';
    return 'warn';
  }
}
