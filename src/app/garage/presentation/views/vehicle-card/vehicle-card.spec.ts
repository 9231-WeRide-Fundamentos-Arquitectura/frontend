import { componentTestProviders } from '../../../../../testing/component-test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleCard } from './vehicle-card';

describe('VehicleCard', () => {
  let component: VehicleCard;
  let fixture: ComponentFixture<VehicleCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: componentTestProviders(),
      imports: [VehicleCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('vehicle', {
      id: 'vehicle-test', brand: 'Test', model: 'Bike', year: 2026, battery: 0,
      maxSpeed: 20, range: 30, weight: 12, color: 'blue', licensePlate: 'LOCAL',
      location: 'station-test', status: 'available', type: 'bike', companyId: 'company-test',
      pricePerMinute: 0.3, image: '', features: [], maintenanceStatus: 'good',
      lastMaintenance: '', nextMaintenance: '', totalKilometers: 0, rating: 4
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
