import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarageLayout } from './garage-layout';

describe('GarageLayout', () => {
  let component: GarageLayout;
  let fixture: ComponentFixture<GarageLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GarageLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GarageLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
