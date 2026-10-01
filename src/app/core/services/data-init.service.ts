import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { UserService } from './user.service';
import { VehicleService } from './vehicle.service';
import { PlanService } from './plan.service';
import { LocationService } from './location.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DataInitService {
  private dataLoadedSubject = new BehaviorSubject<boolean>(false);
  public dataLoaded$ = this.dataLoadedSubject.asObservable();

  constructor(
    private userService: UserService,
    private vehicleService: VehicleService,
    private planService: PlanService,
    private locationService: LocationService,
    private apiService: ApiService
  ) {}

  async initializeData(): Promise<void> {
    // TEMPORALMENTE DESHABILITADO: Carga de datos desde API
    // Retornar inmediatamente sin hacer peticiones HTTP
    this.dataLoadedSubject.next(true);
    return;

    /* CÓDIGO ORIGINAL COMENTADO PARA RESTAURACIÓN FUTURA
    try {

      const loadRequests = forkJoin({
        users: this.userService.loadUsers(),
        vehicles: this.vehicleService.loadVehicles(),
        plans: this.planService.loadPlans(),
        locations: this.locationService.loadLocations()
      });

      const results = await loadRequests.toPromise();

      this.dataLoadedSubject.next(true);
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      this.dataLoadedSubject.next(false);
    }
    */
  }

  getUsers() {
    return this.userService.getCachedUsers();
  }

  getVehicles() {
    return this.vehicleService.getCachedVehicles();
  }

  getPlans() {
    return this.planService.getCachedPlans();
  }

  getLocations() {
    return this.locationService.getCachedLocations();
  }

  getAvailableVehicles() {
    return this.vehicleService.getAvailableVehicles();
  }

  getVehiclesByCompany(companyId: string) {
    return this.vehicleService.getVehiclesByCompany(companyId);
  }

  getUserById(id: string) {
    return this.userService.findUserById(id);
  }

  getVehicleById(id: string) {
    return this.vehicleService.findVehicleById(id);
  }

  getPlanById(id: string) {
    return this.planService.findPlanById(id);
  }
}
