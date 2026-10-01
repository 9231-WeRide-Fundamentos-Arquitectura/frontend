import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { VehicleDetailsModal } from './vehicle-details-modal';

describe('US09 battery warning in vehicle details', () => {
  it('shows the alert and disables reservation below 15%, while bikes remain exempt', async () => {
    const vehicle = { type: 'electric_scooter', battery: 14, status: 'available', features: [] };
    const close = jasmine.createSpy();
    await TestBed.configureTestingModule({
      imports: [VehicleDetailsModal, TranslateModule.forRoot()],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: vehicle }, { provide: MatDialogRef, useValue: { close } }]
    }).compileComponents();
    const fixture = TestBed.createComponent(VehicleDetailsModal);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reserve-button').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    fixture.componentInstance.onReserve();
    expect(close).not.toHaveBeenCalled();
    vehicle.battery = 15;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reserve-button').disabled).toBeFalse();
    vehicle.type = 'bike';
    vehicle.battery = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.reserve-button').disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
