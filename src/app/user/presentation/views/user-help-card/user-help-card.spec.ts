import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserHelpCard } from './user-help-card';

describe('UserHelpCard', () => {
  let component: UserHelpCard;
  let fixture: ComponentFixture<UserHelpCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserHelpCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserHelpCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

