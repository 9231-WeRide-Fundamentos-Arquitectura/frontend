import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../domain/model/vehicle.entity';

export interface ProblemCategory {
  key: string;
  label: string;
}

@Component({
  selector: 'app-report-problem-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './report-problem-modal.html',
  styleUrl: './report-problem-modal.css'
})
export class ReportProblemModal {
  selectedCategories: string[] = [];
  description = '';

  categories: ProblemCategory[] = [
    { key: 'mechanical', label: 'trip.reportProblem.categories.mechanical' },
    { key: 'tires', label: 'trip.reportProblem.categories.tires' },
    { key: 'gps', label: 'trip.reportProblem.categories.gps' },
    { key: 'battery', label: 'trip.reportProblem.categories.battery' },
    { key: 'lock', label: 'trip.reportProblem.categories.lock' },
    { key: 'other', label: 'trip.reportProblem.categories.other' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReportProblemModal>,
    @Inject(MAT_DIALOG_DATA) public vehicle: Vehicle
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  toggleCategory(categoryKey: string): void {
    const index = this.selectedCategories.indexOf(categoryKey);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(categoryKey);
    }
  }

  isCategorySelected(categoryKey: string): boolean {
    return this.selectedCategories.includes(categoryKey);
  }

  onSubmit(): void {
    if (this.selectedCategories.length > 0) {
      this.dialogRef.close({
        categories: this.selectedCategories,
        description: this.description,
        vehicleId: this.vehicle.id
      });
    }
  }

  canSubmit(): boolean {
    return this.selectedCategories.length > 0;
  }
}
