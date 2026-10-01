import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.model';

@Component({
  selector: 'app-vehicle-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule
  ],
  templateUrl: './vehicle-details-modal.html',
  styleUrl: './vehicle-details-modal.css'
})
export class VehicleDetailsModal {
  constructor(
    public dialogRef: MatDialogRef<VehicleDetailsModal>,
    @Inject(MAT_DIALOG_DATA) public vehicle: Vehicle
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  onReserve(): void {
    this.dialogRef.close('reserve');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'available': 'Disponible',
      'in_use': 'En uso',
      'maintenance': 'Mantenimiento',
      'charging': 'Cargando',
      'out_of_service': 'Fuera de servicio'
    };
    return statusMap[status] || status;
  }

  getMaintenanceStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'excellent': 'Excelente',
      'good': 'Bueno',
      'fair': 'Regular',
      'poor': 'Malo',
      'critical': 'Crítico'
    };
    return statusMap[status] || status;
  }

  getMaintenanceStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'excellent': '#4CAF50',
      'good': '#8BC34A',
      'fair': '#FFC107',
      'poor': '#FF9800',
      'critical': '#F44336'
    };
    return colorMap[status] || '#757575';
  }

  getBatteryColor(battery: number): string {
    if (battery > 80) return '#4CAF50';
    if (battery > 50) return '#8BC34A';
    if (battery > 20) return '#FFC107';
    return '#F44336';
  }
}