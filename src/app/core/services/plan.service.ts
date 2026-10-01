import { Injectable } from '@angular/core';
import { ApiService, Plan } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private plansSubject = new BehaviorSubject<Plan[]>([]);
  public plans$ = this.plansSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadPlans(): Observable<Plan[]> {
    return this.apiService.getPlans().pipe(
      tap(plans => {
        this.plansSubject.next(plans);
      })
    );
  }

  getCachedPlans(): Plan[] {
    return this.plansSubject.value;
  }

  getPopularPlans(): Plan[] {
    return this.plansSubject.value.filter(p => p.isPopular);
  }

  getActivePlans(): Plan[] {
    return this.plansSubject.value.filter(p => p.isActive);
  }

  findPlanById(id: string): Plan | undefined {
    return this.plansSubject.value.find(plan => plan.id === id);
  }
}
