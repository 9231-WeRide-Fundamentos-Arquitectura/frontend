import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserHistoryCard } from './user-history-card';

describe('UserHistoryCard', () => {
  let component: UserHistoryCard;
  let fixture: ComponentFixture<UserHistoryCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserHistoryCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserHistoryCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

