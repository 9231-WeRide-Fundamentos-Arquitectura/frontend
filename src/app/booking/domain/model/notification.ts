export class Notification {
  constructor(
    public id: string,
    public userId: string,
    public title: string,
    public message: string,
    public type: string,
    public category: string,
    public priority: string,
    public createdAt: Date,
    public readAt: Date | null,
    public isRead: boolean,
    public actionRequired: boolean,
    public relatedEntityId: string | undefined,
    public relatedEntityType: string | undefined,
    public icon: string,
    public color: string,
    public expiresAt: Date | undefined,
    public promoCode: string | undefined,
    public discount: number | undefined
  ) {}
}
