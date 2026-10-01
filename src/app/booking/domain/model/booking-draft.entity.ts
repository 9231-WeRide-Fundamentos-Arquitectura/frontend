export class BookingDraft {
  constructor(
    public id: string,
    public userId: string,
    public vehicleId: string,
    public selectedDate: string,
    public unlockTime: string,
    public duration: number,
    public smsReminder: boolean,
    public emailConfirmation: boolean,
    public pushNotification: boolean,
    public savedAt: Date,
    public expiresAt: Date
  ) {}
}
