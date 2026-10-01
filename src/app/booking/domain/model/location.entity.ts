export class Location {
  constructor(
    public id: string,
    public name: string,
    public address: string,
    public coordinates: { lat: number; lng: number },
    public type: string,
    public capacity: number,
    public availableSpots: number,
    public isActive: boolean,
    public operatingHours: { open: string; close: string },
    public amenities: string[],
    public district: string,
    public description: string,
    public image: string
  ) {}
}
