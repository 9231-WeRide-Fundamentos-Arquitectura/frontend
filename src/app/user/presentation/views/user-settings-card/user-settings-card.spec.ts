import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettingsCard } from './user-settings-card';

describe('UserSettingsCard', () => {
  let component: UserSettingsCard;
  let fixture: ComponentFixture<UserSettingsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettingsCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

