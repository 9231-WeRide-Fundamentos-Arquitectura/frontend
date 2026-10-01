import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProblemReport {
  id?: string;
  vehicleId: string;
  userId?: string;
  tripId?: string;
  categories: string[];
  description: string;
  status?: string;
  reportDate?: string;
  resolvedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProblemReportsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.problemReports}`;

  getAll(): Observable<ProblemReport[]> {
    return this.http.get<ProblemReport[]>(this.baseUrl);
  }

  getById(id: string): Observable<ProblemReport> {
    return this.http.get<ProblemReport>(`${this.baseUrl}/${id}`);
  }

  create(data: Partial<ProblemReport>): Observable<ProblemReport> {
    return this.http.post<ProblemReport>(this.baseUrl, {
      ...data,
      reportDate: new Date().toISOString(),
      status: 'pending'
    });
  }

  update(id: string, data: Partial<ProblemReport>): Observable<ProblemReport> {
    return this.http.patch<ProblemReport>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
