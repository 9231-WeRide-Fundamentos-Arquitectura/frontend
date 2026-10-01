import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPersonalInfoCard } from './user-personal-info-card';

describe('UserPersonalInfoCard', () => {
  let component: UserPersonalInfoCard;
  let fixture: ComponentFixture<UserPersonalInfoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPersonalInfoCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPersonalInfoCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
