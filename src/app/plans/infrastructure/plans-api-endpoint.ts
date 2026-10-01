import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Plan } from '../domain/model/plan.entity';
import { PlanResponse } from './plans-response';
import { PlanAssembler } from './plan-assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlansApiEndpoint {
  private baseUrl = `${environment.apiUrl}${environment.endpoints.plans}`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Plan[]> {
    return this.http.get<PlanResponse[]>(this.baseUrl).pipe(
      map(responses => PlanAssembler.toDomainList(responses))
    );
  }

  getById(id: string): Observable<Plan> {
    return this.http.get<PlanResponse>(`${this.baseUrl}/${id}`).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
  }

  create(plan: Plan): Observable<Plan> {
    return this.http.post<PlanResponse>(this.baseUrl, plan).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
  }

  update(id: string, plan: Plan): Observable<Plan> {
    return this.http.put<PlanResponse>(`${this.baseUrl}/${id}`, plan).pipe(
      map(response => PlanAssembler.toDomain(response))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

