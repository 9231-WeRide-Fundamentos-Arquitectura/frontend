export class Vehicle {
  constructor(
    public id: string,
    public brand: string,
    public model: string,
    public year: number,
    public battery: number,
    public maxSpeed: number,
    public range: number,
    public weight: number,
    public color: string,
    public licensePlate: string,
    public location: string,
    public status: 'available' | 'reserved' | 'maintenance',
    public type: string,
    public companyId: string,
    public pricePerMinute: number,
    public image: string,
    public features: string[],
    public maintenanceStatus: string,
    public lastMaintenance: Date,
    public nextMaintenance: Date,
    public totalKilometers: number,
    public rating: number
  ) {}
}
