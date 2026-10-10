import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {MatSliderModule} from '@angular/material/slider';
import {TranslateModule} from '@ngx-translate/core';
import {VehicleFilter} from '../../../domain/model/vehicle-filter.model';
import {Vehicle} from '../../../domain/model/vehicle.model';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-garage-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatFormField,
    MatLabel,
    FormsModule,
    MatSelect,
    MatOption,
    MatButton,
    MatSliderModule,
    TranslateModule
  ],
  templateUrl: './garage-filter.html',
  styleUrl: './garage-filter.css'
})
export class GarageFilter implements OnChanges {
  // Vehículos cargados: de ellos salen las marcas y los límites del deslizador de precio.
  @Input() vehicles: Vehicle[] = [];
  @Output() filterChange = new EventEmitter<VehicleFilter>();

  selectedType: 'electric_scooter' | 'bike' | 'electric_bike' | '' = '';
  // 'unavailable' agrupa reservado, en uso y cualquier otro estado, igual que la etiqueta de la tarjeta.
  selectedStatus: 'available' | 'maintenance' | 'unavailable' | '' = '';
  brand = '';
  minRating = 0;
  minBattery = 0;

  brands: string[] = [];
  priceBounds = { min: 0, max: 1 };
  minPrice = 0;
  maxPrice = 1;
  private priceTouched = false;

  ngOnChanges(): void {
    this.brands = [...new Set(this.vehicles.map(v => v.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const prices = this.vehicles.map(v => v.pricePerMinute);
    if (!prices.length) return;
    const min = Math.floor(Math.min(...prices) * 20) / 20;
    let max = Math.ceil(Math.max(...prices) * 20) / 20;
    if (max <= min) max = min + 0.05;
    this.priceBounds = { min, max };
    if (this.priceTouched) {
      this.minPrice = Math.min(Math.max(this.minPrice, min), max);
      this.maxPrice = Math.min(Math.max(this.maxPrice, min), max);
    } else {
      this.minPrice = min;
      this.maxPrice = max;
    }
  }

  // Los filtros se aplican al instante; solo se envían los que se apartan de su valor neutro.
  applyFilters(priceMoved = false) {
    if (priceMoved) this.priceTouched = true;
    const filter: VehicleFilter = {};

    if (this.selectedType) filter.type = this.selectedType;
    if (this.selectedStatus) filter.status = this.selectedStatus;
    if (this.brand) filter.brand = this.brand;
    if (this.minPrice > this.priceBounds.min) filter.minPrice = this.minPrice;
    if (this.maxPrice < this.priceBounds.max) filter.maxPrice = this.maxPrice;
    if (this.minRating > 0) filter.minRating = this.minRating;
    if (this.minBattery > 0) filter.minBattery = this.minBattery;

    this.filterChange.emit(filter);
  }

  resetFilters() {
    this.selectedType = '';
    this.selectedStatus = '';
    this.brand = '';
    this.minRating = 0;
    this.minBattery = 0;
    this.minPrice = this.priceBounds.min;
    this.maxPrice = this.priceBounds.max;
    this.priceTouched = false;
    this.filterChange.emit({});
  }
}
