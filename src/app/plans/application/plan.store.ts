import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Plan } from '../domain/model/plan.entity';
import { PlansApiEndpoint } from '../infrastructure/plans-api-endpoint';

@Injectable({
  providedIn: 'root'
})
export class PlanStore {
  private plansSubject = new BehaviorSubject<Plan[]>([]);
  public plans$ = this.plansSubject.asObservable();

  private selectedPlanSubject = new BehaviorSubject<Plan | null>(null);
  public selectedPlan$ = this.selectedPlanSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private plansApiEndpoint: PlansApiEndpoint) {}

  loadPlans(): void {
    this.loadingSubject.next(true);
    this.plansApiEndpoint.getAll().pipe(
      tap(plans => {
        this.plansSubject.next(plans);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar planes:', error);
        this.loadingSubject.next(false);
        this.plansSubject.next([]);
        return of([]);
      })
    ).subscribe();
  }

  loadPlanById(id: string): void {
    this.loadingSubject.next(true);
    this.plansApiEndpoint.getById(id).pipe(
      tap(plan => {
        this.selectedPlanSubject.next(plan);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Error al cargar plan por ID:', error);
        this.loadingSubject.next(false);
        this.selectedPlanSubject.next(null);
        return of(null);
      })
    ).subscribe();
  }

  selectPlan(plan: Plan): void {
    this.selectedPlanSubject.next(plan);
  }

  createPlan(plan: Plan): Observable<Plan> {
    return this.plansApiEndpoint.create(plan).pipe(
      tap(newPlan => {
        const currentPlans = this.plansSubject.value;
        this.plansSubject.next([...currentPlans, newPlan]);
      })
    );
  }

  updatePlan(id: string, plan: Plan): Observable<Plan> {
    return this.plansApiEndpoint.update(id, plan).pipe(
      tap(updatedPlan => {
        const currentPlans = this.plansSubject.value;
        const index = currentPlans.findIndex(p => p.id === id);
        if (index !== -1) {
          currentPlans[index] = updatedPlan;
          this.plansSubject.next([...currentPlans]);
        }
      })
    );
  }

  deletePlan(id: string): Observable<void> {
    return this.plansApiEndpoint.delete(id).pipe(
      tap(() => {
        const currentPlans = this.plansSubject.value;
        this.plansSubject.next(currentPlans.filter(p => p.id !== id));
      })
    );
  }
}
