import { componentTestProviders } from '../../../../../testing/component-test-providers';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanList } from './plan-list';

describe('PlanList', () => {
  let component: PlanList;
  let fixture: ComponentFixture<PlanList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: componentTestProviders(),
      imports: [PlanList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
