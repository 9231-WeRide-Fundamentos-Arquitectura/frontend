import { hasCriticalBattery } from './vehicle.model';

describe('US09 critical battery', () => {
  it('blocks scooters below 15%, including zero, and exempts bikes', () => {
    expect(hasCriticalBattery({ type: 'electric_scooter', battery: 0 })).toBeTrue();
    expect(hasCriticalBattery({ type: 'electric_scooter', battery: 14 })).toBeTrue();
    expect(hasCriticalBattery({ type: 'electric_scooter', battery: 15 })).toBeFalse();
    expect(hasCriticalBattery({ type: 'bike', battery: 0 })).toBeFalse();
    expect(hasCriticalBattery(null)).toBeFalse();
  });
});
