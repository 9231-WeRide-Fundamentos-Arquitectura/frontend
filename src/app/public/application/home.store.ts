import { Injectable, signal, computed } from '@angular/core';

export interface FeatureCard {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  route?: string;
  order: number;
}

export type HomeStatus = 'idle' | 'loading' | 'success' | 'error';

@Injectable({ providedIn: 'root' })
export class HomeStore {
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _features = signal<FeatureCard[]>([]);
  private readonly _status = signal<HomeStatus>('idle');
  private _retryCount = 0;
  private readonly MAX_RETRIES = 3;

  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly features = this._features.asReadonly();
  readonly status = this._status.asReadonly();

  readonly hasError = computed(() => this._error() !== null);
  readonly hasContent = computed(() => this._features().length > 0);

  constructor() {
    this.initializeFeatures();
  }

  loadContent(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._status.set('loading');

    setTimeout(() => {
      try {
        this.initializeFeatures();
        this._status.set('success');
        this._isLoading.set(false);
        this._retryCount = 0;
      } catch (err) {
        this.handleError(err);
      }
    }, 300);
  }

  retry(): void {
    if (this._retryCount < this.MAX_RETRIES) {
      this._retryCount++;
      this.loadContent();
    } else {
      this._error.set('home.errors.maxRetries');
    }
  }

  private handleError(err: unknown): void {
    const errorMessage = err instanceof Error ? err.message : 'home.errors.unknown';
    this._error.set(errorMessage);
    this._status.set('error');
    this._isLoading.set(false);
  }

  private initializeFeatures(): void {
    const defaultFeatures: FeatureCard[] = [
      {
        id: 'garage',
        icon: 'directions_bike',
        titleKey: 'home.features.garage.title',
        descriptionKey: 'home.features.garage.description',
        route: '/garage',
        order: 1
      },
      {
        id: 'trips',
        icon: 'route',
        titleKey: 'home.features.trips.title',
        descriptionKey: 'home.features.trips.description',
        route: '/trip',
        order: 2
      },
      {
        id: 'plans',
        icon: 'card_membership',
        titleKey: 'home.features.plans.title',
        descriptionKey: 'home.features.plans.description',
        route: '/plan',
        order: 3
      },
      {
        id: 'profile',
        icon: 'person',
        titleKey: 'home.features.profile.title',
        descriptionKey: 'home.features.profile.description',
        route: '/user',
        order: 4
      }
    ];

    this._features.set(defaultFeatures);
  }
}
