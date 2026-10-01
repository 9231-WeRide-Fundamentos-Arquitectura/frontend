import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { VehicleResponse } from '../../../infraestructure/vehicle-response';

@Component({
  selector: 'app-vehicle-list',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleList implements OnInit {
  private vehiclesApi = inject(VehiclesApiEndpoint);

  vehicles: VehicleResponse[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehiclesApi.getAll().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available': return 'primary';
      case 'reserved': return 'accent';
      case 'maintenance': return 'warn';
      default: return '';
    }
  }

  getBatteryColor(battery: number): string {
    if (battery > 70) return 'primary';
    if (battery > 30) return 'accent';
    return 'warn';
  }
}
