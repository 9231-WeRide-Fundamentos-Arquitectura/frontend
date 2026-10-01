import { normalizeLocationResponse } from '../../booking/infraestructure/location-assembler';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Location } from '../domain/model/location.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationsApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}${environment.endpoints.locations}`;

  // GET /api/v1/location devuelve la entidad tal cual: `id` numérico y `active` en vez de `isActive`.
  getAll(): Observable<Location[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(locations => locations.map(normalizeLocationResponse))
    );
  }

  // ponytail: el backend no expone GET /location/{id}; se busca en la lista. Pasar a GET por id si se agrega.
  getById(id: string): Observable<Location> {
    return this.getAll().pipe(
      map(locations => {
        const location = locations.find(l => l.id === String(id));
        if (!location) throw new Error(`Location ${id} not found`);
        return location;
      })
    );
  }
}
