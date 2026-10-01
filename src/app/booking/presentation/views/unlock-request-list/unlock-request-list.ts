import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { UnlockRequestsApiEndpoint } from '../../../infraestructure/unlockRequests-api-endpoint';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { UnlockRequestResponse } from '../../../infraestructure/unlockRequests-response';
import { forkJoin } from 'rxjs';

interface UnlockRequestView {
  id: string;
  vehicleName: string;
  requestedAt: Date;
  scheduledUnlockTime: Date;
  status: 'pending' | 'unlocked' | 'failed';
  method: string;
  unlockCode: string;
  attempts: number;
}

@Component({
  selector: 'app-unlock-request-list',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, RouterModule],
  templateUrl: './unlock-request-list.html',
  styleUrl: './unlock-request-list.css'
})
export class UnlockRequestList implements OnInit {
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);

  unlockRequests: UnlockRequestView[] = [];
  isLoading = true;
  displayedColumns: string[] = ['vehicleName', 'requestedAt', 'status', 'method', 'unlockCode', 'attempts', 'actions'];

  ngOnInit(): void {
    this.loadUnlockRequests();
  }

  loadUnlockRequests(): void {
    forkJoin({
      unlockRequests: this.unlockRequestsApi.getAll(),
      vehicles: this.vehiclesApi.getAll()
    }).subscribe({
      next: ({ unlockRequests, vehicles }) => {
        this.unlockRequests = unlockRequests.map(request => {
          const vehicle = vehicles.find(v => v.id === request.vehicleId);
          return {
            id: request.id,
            vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown',
            requestedAt: new Date(request.requestedAt),
            scheduledUnlockTime: new Date(request.scheduledUnlockTime),
            status: request.status,
            method: request.method,
            unlockCode: request.unlockCode,
            attempts: request.attempts
          };
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading unlock requests:', error);
        this.isLoading = false;
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'unlocked': return 'primary';
      case 'pending': return 'accent';
      case 'failed': return 'warn';
      default: return '';
    }
  }

  retryUnlock(id: string): void {
    console.log('Retry unlock:', id);
  }
}
