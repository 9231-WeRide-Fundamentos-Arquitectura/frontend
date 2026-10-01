import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipPlanId: string;
  isActive: boolean;
  profilePicture: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  verificationStatus: string;
  registrationDate: string;
  preferences: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  statistics: {
    totalTrips: number;
    totalDistance: number;
    totalSpent: number;
    averageRating: number;
  };
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  battery: number;
  maxSpeed: number;
  range: number;
  weight: number;
  color: string;
  licensePlate: string;
  location: string;
  status: string;
  type: string;
  companyId: string;
  pricePerMinute: number;
  image: string;
  features: string[];
  maintenanceStatus: string;
  lastMaintenance: string;
  nextMaintenance: string;
  totalKilometers: number;
  rating: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  pricePerMinute: number;
  duration: string;
  durationDays: number;
  maxTripsPerDay: number;
  maxMinutesPerTrip: number;
  freeMinutesPerMonth: number;
  discountPercentage: number;
  benefits: string[];
  color: string;
  isPopular: boolean;
  isActive: boolean;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
  website: string;
  description: string;
  vehicles: string[];
  serviceAreas: string[];
  rating: number;
  isActive: boolean;
  establishedYear: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: string;
  capacity: number;
  availableSpots: number;
  isActive: boolean;
  operatingHours: {
    open: string;
    close: string;
  };
  amenities: string[];
  district: string;
  description: string;
  image: string;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  startLocationId: string;
  endLocationId: string;
  reservedAt: string;
  startDate: string;
  endDate: string;
  actualStartDate: string;
  actualEndDate: string;
  status: string;
  totalCost: number;
  discount: number;
  finalCost: number;
  paymentMethod: string;
  paymentStatus: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  rating?: {
    score: number;
    comment: string;
  };
  issues: any[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: string;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
  actionRequired: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  icon: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiUrl;
  private readonly endpoints = environment.endpoints;

  constructor(private http: HttpClient) {
    console.log('ApiService inicializado - URL base:', this.baseUrl);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}${this.endpoints.users}`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}${this.endpoints.users}/${id}`);
  }

  getVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}${this.endpoints.vehicles}`);
  }

  getAvailableVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.baseUrl}${this.endpoints.vehicles}?status=available`);
  }

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.baseUrl}${this.endpoints.plans}`);
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.baseUrl}${this.endpoints.locations}`);
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}${this.endpoints.bookings}`);
  }

  getUserBookings(userId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}${this.endpoints.bookings}?userId=${userId}`);
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}${this.endpoints.notifications}`);
  }

  getUserNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}${this.endpoints.notifications}?userId=${userId}`);
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.favorites}`);
  }

  getTrips(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.trips}`);
  }

  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.payments}`);
  }

  getUnlockRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}${this.endpoints.unlockRequests}`);
  }
}