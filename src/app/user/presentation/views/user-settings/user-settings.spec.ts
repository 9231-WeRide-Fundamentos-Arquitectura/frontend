import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSettings } from './user-settings';
import { TranslateModule } from '@ngx-translate/core';

describe('UserSettings', () => {
  let component: UserSettings;
  let fixture: ComponentFixture<UserSettings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettings, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
