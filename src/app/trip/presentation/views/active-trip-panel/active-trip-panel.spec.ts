import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveTripPanel } from './active-trip-panel';

describe('ActiveTripPanel', () => {
  let component: ActiveTripPanel;
  let fixture: ComponentFixture<ActiveTripPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveTripPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActiveTripPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
