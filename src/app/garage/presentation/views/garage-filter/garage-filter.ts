import {Component, EventEmitter, Output} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {TranslateModule} from '@ngx-translate/core';
import {VehicleFilter} from '../../../domain/model/vehicle-filter.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-garage-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatSelect,
    MatOption,
    MatButton,
    TranslateModule
  ],
  templateUrl: './garage-filter.html',
  styleUrl: './garage-filter.css'
})
export class GarageFilter {
  selectedType: 'electric_scooter' | 'bike' | 'electric_bike' | '' = '';
  selectedStatus: 'available' | 'reserved' | 'maintenance' | 'in_use' | '' = '';
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  brand: string | null = null;
  minBattery: number | null = null;

  @Output() filterChange = new EventEmitter<VehicleFilter>();

  applyFilters() {
    const filter: VehicleFilter = {};

    if (this.selectedType) filter.type = this.selectedType;
    if (this.selectedStatus) filter.status = this.selectedStatus;
    if (this.minPrice !== null) filter.minPrice = this.minPrice;
    if (this.maxPrice !== null) filter.maxPrice = this.maxPrice;
    if (this.minRating !== null) filter.minRating = this.minRating;
    if (this.brand) filter.brand = this.brand;
    if (this.minBattery !== null) filter.minBattery = this.minBattery;

    this.filterChange.emit(filter);
  }

  resetFilters() {
    this.selectedType = '';
    this.selectedStatus = '';
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.brand = null;
    this.minBattery = null;
    this.filterChange.emit({});
  }
}
