import { Plan } from '../domain/model/plan.entity';
import { PlanResponse } from './plans-response';

export class PlanAssembler {
  static toDomain(response: PlanResponse): Plan {
    return new Plan(
      response.id,
      response.name,
      response.description,
      response.price,
      response.currency,
      response.pricePerMinute,
      response.duration,
      response.durationDays,
      response.maxTripsPerDay,
      response.maxMinutesPerTrip,
      response.freeMinutesPerMonth,
      response.discountPercentage,
      response.benefits,
      response.color,
      response.isPopular,
      response.isActive,
      response.studentVerificationRequired,
      response.corporateVerificationRequired
    );
  }

  static toDomainList(responses: PlanResponse[]): Plan[] {
    return responses.map(response => this.toDomain(response));
  }
}

