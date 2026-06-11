export class User {
  private readonly _id?: string;
  private _firebaseUid: string;
  private _name: string;
  private _email: string;
  private _identification: string;
  private _pixKey?: string;
  private _hourlyRate?: number;
  private _avatarUrl?: string;
  private readonly _createdAt?: Date;
  private readonly _updatedAt?: Date;

  private constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string | undefined {
    return this._id;
  }

  get firebaseUid(): string {
    return this._firebaseUid;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get identification(): string {
    return this._identification;
  }

  get pixKey(): string | undefined {
    return this._pixKey;
  }

  get hourlyRate(): number | undefined {
    return this._hourlyRate;
  }

  get avatarUrl(): string | undefined {
    return this._avatarUrl;
  }

  get createdAt(): Date | undefined {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  withFirebaseUid(firebaseUid: string): this {
    this._firebaseUid = firebaseUid;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withIdentification(identification: string): this {
    this._identification = identification;
    return this;
  }

  withPixKey(pixKey?: string): this {
    this._pixKey = pixKey;
    return this;
  }

  withHourlyRate(hourlyRate?: number): this {
    this._hourlyRate = hourlyRate;
    return this;
  }

  withAvatarUrl(avatarUrl?: string): this {
    this._avatarUrl = avatarUrl;
    return this;
  }

  static restore(props?: {
    id?: string;
    firebaseUid: string;
    name: string;
    email: string;
    identification: string;
    pixKey?: string | null;
    hourlyRate?: number | string | null;
    avatarUrl?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): User | null {
    if (!props) return null;
    const user = new User(props.id, props.createdAt, props.updatedAt);
    user._firebaseUid = props.firebaseUid;
    user._name = props.name;
    user._email = props.email;
    user._identification = props.identification;
    user._pixKey = props.pixKey ?? undefined;
    user._hourlyRate =
      props.hourlyRate !== undefined && props.hourlyRate !== null
        ? Number(props.hourlyRate)
        : undefined;
    user._avatarUrl = props.avatarUrl ?? undefined;
    return user;
  }
}
