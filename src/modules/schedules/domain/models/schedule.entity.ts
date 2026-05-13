export class Schedule {
  public id?: string;
  public proposalId: string;
  public scheduledDate: Date;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(
    props: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
    },
  ) {
    this.id = props.id;
    this.proposalId = props.proposalId;
    this.scheduledDate = props.scheduledDate;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  static restore(row: any): Schedule | null {
    if (!row) return null;
    return new Schedule({
      id: row.id,
      proposalId: row.proposalId ?? row.proposal_id,
      scheduledDate: row.scheduledDate ?? row.scheduled_date,
      createdAt: row.createdAt ?? row.created_at,
      updatedAt: row.updatedAt ?? row.updated_at,
    });
  }
}
