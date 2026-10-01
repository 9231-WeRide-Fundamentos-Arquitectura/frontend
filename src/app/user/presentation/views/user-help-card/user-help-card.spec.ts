import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserHelpCard } from './user-help-card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('UserHelpCard', () => {
  let component: UserHelpCard;
  let fixture: ComponentFixture<UserHelpCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserHelpCard, TranslateModule.forRoot()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserHelpCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters questions and answers ignoring case and accents and handles no results', () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { user: { help: { faq1: { question: '¿Cómo reservar?', answer: 'Elige un vehículo.' } } } });
    translate.use('es');
    component.searchTerm = ' VEHICULO ';
    expect(component.filteredFaqs.length).toBe(1);
    component.searchTerm = 'imposiblexyz';
    fixture.detectChanges();
    expect(component.filteredFaqs.length).toBe(0);
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
    component.searchTerm = '';
    expect(component.filteredFaqs.length).toBe(4);
  });
});

