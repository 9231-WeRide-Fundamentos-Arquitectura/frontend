import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarageFilter } from './garage-filter';

describe('GarageFilter', () => {
  let component: GarageFilter;
  let fixture: ComponentFixture<GarageFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GarageFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GarageFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
