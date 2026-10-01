import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatIconModule} from '@angular/material/icon';
import {TranslateModule} from '@ngx-translate/core';
import {Plan} from '../../../domain/model/plan.entity';
import {PlanStore} from '../../../application/plan.store';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-plan-payment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './plan-payment.html',
  styleUrl: './plan-payment.css'
})
export class PlanPayment implements OnInit, OnDestroy {
  private readonly store = inject(PlanStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  protected readonly length = length;

  selectedPlan$: Observable<Plan | null> = this.store.selectedPlan$;
  selectedPlan: Plan | null = null;

  cardNumber = '';
  expiryDate = '';
  cvv = '';
  saveCard = false;
  billingAddress = '';

  subtotal = 0;
  discount = 0;
  total = 0;

  ngOnInit(): void {
    const planId = this.route.snapshot.paramMap.get('id');

    if (planId) {
      this.store.loadPlanById(planId);
    }

    this.selectedPlan$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(plan => {
      if (plan) {
        this.selectedPlan = plan;
        this.calculatePrices();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/plan']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  calculatePrices(): void {
    if (this.selectedPlan) {
      this.subtotal = this.selectedPlan.price;
      this.discount = (this.selectedPlan.price * this.selectedPlan.discountPercentage) / 100;
      this.total = this.subtotal - this.discount;
    }
  }

  isCardNumberValid(): boolean {
    return this.cardNumber.replace(/\s/g, '').length === 16;
  }

  onCardNumberInput(event: any): void {
    let value = event.target.value.replace(/\s/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || '';
    this.cardNumber = value;
  }

  onExpiryDateInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    this.expiryDate = value;
  }

  verifyAddress(): void {
    this.billingAddress = this.billingAddress.trim();
  }

  isFormValid(): boolean {
    return !!(
      this.cardNumber.replace(/\s/g, '').length === 16 &&
      this.expiryDate.length === 5 &&
      this.cvv.length >= 3 &&
      this.billingAddress
    );
  }

  endPayment(): void {
    if (this.isFormValid()) {
      console.log('Procesando pago...', {
        planId: this.selectedPlan?.id,
        cardNumber: this.cardNumber,
        expiryDate: this.expiryDate,
        cvv: this.cvv,
        saveCard: this.saveCard,
        billingAddress: this.billingAddress,
        total: this.total
      });

      this.router.navigate(['/payment-success']);
    }
  }

}
