import { componentTestProviders } from '../../../../../testing/component-test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripSettings } from './trip-settings';

describe('TripSettings', () => {
  let component: TripSettings;
  let fixture: ComponentFixture<TripSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: componentTestProviders(),
      imports: [TripSettings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
