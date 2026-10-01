import {Component, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Plan } from '../../../domain/model/plan.entity';
import { PlanStore } from '../../../application/plan.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-plan-detail',
  standalone: true,
  imports: [CommonModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatButtonModule, TranslateModule],
  templateUrl: './plan-detail.html',
  styleUrl: './plan-detail.css'
})
export class PlanDetail implements OnInit {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  plan$: Observable<Plan | null>;
  loading$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private planStore: PlanStore
  ) {
    this.plan$ = this.planStore.selectedPlan$;
    this.loading$ = this.planStore.loading$;
  }

  ngOnInit(): void {
    const planId = this.route.snapshot.paramMap.get('id');
    console.log('Plan ID desde ruta:', planId);

    if (planId) {
      this.planStore.loadPlanById(planId);
    }
  }

  onPayment(plan: Plan | null): void {
    if (!plan || !plan.id) {
      console.error('No se puede navegar: plan o plan.id es null/undefined', plan);
      return;
    }

    console.log('Navegando a payment con plan:', plan);
    console.log('Plan ID:', plan.id);
    console.log('Ruta completa:', ['/plan/payment', plan.id]);

    try {
      this.router.navigate(['/plan/payment', plan.id]).catch(error => {
        console.error('Error al navegar a la página de pago:', error);
      });
    } catch (error) {
      console.error('Error inesperado al intentar navegar:', error);
    }
  }


  getFormattedPrice(plan: Plan): string {
    return `${plan.currency === 'USD' ? '$' : plan.currency}${plan.price.toFixed(2)}`;
  }

  getFormattedDuration(plan: Plan): string {
    const durationKey = `plans.${plan.duration}`;
    return this.translate.instant(durationKey) || plan.duration;
  }
}
