import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWalletCard } from './user-wallet-card';

describe('UserWalletCard', () => {
  let component: UserWalletCard;
  let fixture: ComponentFixture<UserWalletCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserWalletCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserWalletCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

