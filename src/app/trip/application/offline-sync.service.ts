import { Injectable, inject } from '@angular/core';
import { ProblemReportsApiEndpoint, ProblemReport } from '../infrastructure/problem-reports-api-endpoint';
import { RatingsApiEndpoint, TripRating } from '../infrastructure/ratings-api-endpoint';

interface QueuedProblemReport extends ProblemReport {
  queueId: string;
  timestamp: number;
}

interface QueuedRating extends TripRating {
  queueId: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  private problemReportsApi = inject(ProblemReportsApiEndpoint);
  private ratingsApi = inject(RatingsApiEndpoint);

  private readonly PROBLEM_REPORTS_QUEUE_KEY = 'weride_problem_reports_queue';
  private readonly RATINGS_QUEUE_KEY = 'weride_ratings_queue';


  queueProblemReport(report: Partial<ProblemReport>): void {
    const queue = this.getProblemReportsQueue();
    const queuedReport: QueuedProblemReport = {
      queueId: this.generateId(),
      timestamp: Date.now(),
      vehicleId: report.vehicleId!,
      categories: report.categories!,
      description: report.description || '',
      status: 'pending'
    };
    queue.push(queuedReport);
    this.saveProblemReportsQueue(queue);
  }

  queueRating(rating: Partial<TripRating>): void {
    const queue = this.getRatingsQueue();
    const queuedRating: QueuedRating = {
      queueId: this.generateId(),
      timestamp: Date.now(),
      tripId: rating.tripId!,
      rating: rating.rating!,
      comment: rating.comment || ''
    };
    queue.push(queuedRating);
    this.saveRatingsQueue(queue);
  }

  async syncProblemReports(): Promise<{ success: number; failed: number }> {
    const queue = this.getProblemReportsQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;
    const remainingQueue: QueuedProblemReport[] = [];

    for (const report of queue) {
      try {
        await this.problemReportsApi.create({
          vehicleId: report.vehicleId,
          categories: report.categories,
          description: report.description,
          tripId: report.tripId,
          userId: report.userId
        }).toPromise();
        success++;
      } catch (error) {
        console.error('Failed to sync problem report:', error);
        remainingQueue.push(report);
        failed++;
      }
    }

    this.saveProblemReportsQueue(remainingQueue);
    return { success, failed };
  }

  async syncRatings(): Promise<{ success: number; failed: number }> {
    const queue = this.getRatingsQueue();
    if (queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;
    const remainingQueue: QueuedRating[] = [];

    for (const rating of queue) {
      try {
        await this.ratingsApi.create({
          tripId: rating.tripId,
          rating: rating.rating,
          comment: rating.comment,
          userId: rating.userId
        }).toPromise();
        success++;
      } catch (error) {
        console.error('Failed to sync rating:', error);
        remainingQueue.push(rating);
        failed++;
      }
    }

    this.saveRatingsQueue(remainingQueue);
    return { success, failed };
  }


  async syncAll(): Promise<void> {
    const [reportsResult, ratingsResult] = await Promise.all([
      this.syncProblemReports(),
      this.syncRatings()
    ]);

    if (reportsResult.success > 0 || ratingsResult.success > 0) {
      console.log(`Sync completed: ${reportsResult.success + ratingsResult.success} items synced successfully`);
    }
    if (reportsResult.failed > 0 || ratingsResult.failed > 0) {
      console.warn(`Sync warning: ${reportsResult.failed + ratingsResult.failed} items failed to sync`);
    }
  }

  getPendingCount(): { problemReports: number; ratings: number; total: number } {
    const problemReports = this.getProblemReportsQueue().length;
    const ratings = this.getRatingsQueue().length;
    return {
      problemReports,
      ratings,
      total: problemReports + ratings
    };
  }

  clearAllQueues(): void {
    localStorage.removeItem(this.PROBLEM_REPORTS_QUEUE_KEY);
    localStorage.removeItem(this.RATINGS_QUEUE_KEY);
  }

  // Private helper methods

  private getProblemReportsQueue(): QueuedProblemReport[] {
    try {
      const data = localStorage.getItem(this.PROBLEM_REPORTS_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading problem reports queue:', error);
      return [];
    }
  }

  private saveProblemReportsQueue(queue: QueuedProblemReport[]): void {
    try {
      localStorage.setItem(this.PROBLEM_REPORTS_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving problem reports queue:', error);
    }
  }

  private getRatingsQueue(): QueuedRating[] {
    try {
      const data = localStorage.getItem(this.RATINGS_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading ratings queue:', error);
      return [];
    }
  }

  private saveRatingsQueue(queue: QueuedRating[]): void {
    try {
      localStorage.setItem(this.RATINGS_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving ratings queue:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
