import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSecurityCard } from './user-security-card';

describe('UserSecurityCard', () => {
  let component: UserSecurityCard;
  let fixture: ComponentFixture<UserSecurityCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSecurityCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSecurityCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

