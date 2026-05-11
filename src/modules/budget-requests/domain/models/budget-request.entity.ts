export type BudgetRequestStatus = 'pending' | 'answered' | 'cancelled';

export class BudgetRequest {
  public id?: string;
  public userId: string;
  public serviceId: string;
  public title: string;
  public description: string;
  public category: string;
  public location: string;
  public requestDate: Date;
  public status: BudgetRequestStatus;
  public photos?: string[];
  public cancellationReason?: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    props: Omit<BudgetRequest, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceId = props.serviceId;
    this.title = props.title;
    this.description = props.description;
    this.category = props.category;
    this.location = props.location;
    this.requestDate = props.requestDate;
    this.status = props.status;
    this.photos = props.photos;
    this.cancellationReason = props.cancellationReason;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static restore(row: any): BudgetRequest | null {
    if (!row) return null;
    return new BudgetRequest({
      id: row.id,
      userId: row.userId ?? row.user_id,
      serviceId: row.serviceId ?? row.service_id,
      title: row.title,
      description: row.description,
      category: row.category,
      location: row.location,
      requestDate: row.requestDate ?? row.request_date,
      status: row.status,
      photos: row.photos,
      cancellationReason: row.cancellationReason ?? row.cancellation_reason,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
    });
  }
}
