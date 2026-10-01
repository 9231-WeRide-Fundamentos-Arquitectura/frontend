import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Plan } from '../../../domain/model/plan.entity';
import { PlanStore } from '../../../application/plan.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './plan-list.html',
  styleUrl: './plan-list.css'
})
export class PlanList implements OnInit {
  private readonly store = inject(PlanStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  plans$: Observable<Plan[]> = this.store.plans$;
  selectedPlan$: Observable<Plan | null> = this.store.selectedPlan$;
  loading$: Observable<boolean> = this.store.loading$;

  ngOnInit(): void {
    this.store.loadPlans();
  }

  selectPlan(plan: Plan): void {
    this.store.selectPlan(plan);
  }

  getFormattedDuration(plan: Plan): string {
    const durationKey = `plans.${plan.duration}`;
    return this.translate.instant(durationKey) || plan.duration;
  }

  getFormattedPrice(plan: Plan): string {
    return `$${plan.price.toFixed(2)}`;
  }

  onPayment(plan: Plan): void {
    if (!plan || !plan.id) {
      console.error('No se puede navegar: plan o plan.id es null/undefined', plan);
      return;
    }
    this.router.navigate(['/plan/payment', plan.id]);
  }
}
