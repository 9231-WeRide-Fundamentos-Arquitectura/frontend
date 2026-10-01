import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VehicleDetailsModal } from './vehicle-details-modal';
import { Vehicle } from '../../../domain/model/vehicle.model';

describe('VehicleDetailsModal', () => {
  let component: VehicleDetailsModal;
  let fixture: ComponentFixture<VehicleDetailsModal>;

  const mockVehicle: Vehicle = {
    id: '1',
    brand: 'Xiaomi',
    model: 'M365',
    year: 2023,
    battery: 82,
    maxSpeed: 25,
    range: 30,
    weight: 12.5,
    color: 'black',
    licensePlate: 'XM001',
    location: '1',
    status: 'available',
    type: 'electric_scooter',
    companyId: '1',
    pricePerMinute: 0.5,
    image: 'assets/vehicles/xiaomi-m365.jpg',
    features: ['GPS', 'Bluetooth', 'Mobile App', 'LED Lights'],
    maintenanceStatus: 'good',
    lastMaintenance: '2024-09-15T10:00:00Z',
    nextMaintenance: '2024-11-15T10:00:00Z',
    totalKilometers: 1250.5,
    rating: 4.6
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleDetailsModal],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockVehicle },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleDetailsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display vehicle information', () => {
    expect(component.vehicle).toEqual(mockVehicle);
  });

  it('should close dialog when onClose is called', () => {
    component.onClose();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });
});