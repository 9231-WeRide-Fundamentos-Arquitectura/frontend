import { componentTestProviders } from '../../../../../testing/component-test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanDetail } from './plan-detail';

describe('PlanDetail', () => {
  let component: PlanDetail;
  let fixture: ComponentFixture<PlanDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: componentTestProviders(),
      imports: [PlanDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
