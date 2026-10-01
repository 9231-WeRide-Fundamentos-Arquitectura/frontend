import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-help-card',
  standalone: true,
  imports: [CommonModule, MatIcon, TranslateModule, FormsModule],
  templateUrl: './user-help-card.html',
  styleUrl: './user-help-card.css'
})
export class UserHelpCard {
  searchTerm = '';
  private readonly stateService = inject(UserSettingsStateService);
  private readonly translate = inject(TranslateService);

  get faqs() {
    return [
      {
        question: this.translate.instant('user.help.faq1.question'),
        answer: this.translate.instant('user.help.faq1.answer')
      },
      {
        question: this.translate.instant('user.help.faq2.question'),
        answer: this.translate.instant('user.help.faq2.answer')
      },
      {
        question: this.translate.instant('user.help.faq3.question'),
        answer: this.translate.instant('user.help.faq3.answer')
      },
      {
        question: this.translate.instant('user.help.faq4.question'),
        answer: this.translate.instant('user.help.faq4.answer')
      }
    ];
  }

  get filteredFaqs() {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = normalize(this.searchTerm.trim());
    return this.faqs.filter(faq => normalize(`${faq.question} ${faq.answer}`).includes(query));
  }

  readonly contactInfo = {
    email: 'soporte@weride.com',
    phone: '+51 1 234 5678'
  };

  closeCard(): void {
    this.stateService.closeSection();
  }
}

