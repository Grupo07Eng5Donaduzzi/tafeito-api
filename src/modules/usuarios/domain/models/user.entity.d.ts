export declare class User {
    private readonly _id?;
    private _firebaseUid;
    private _name;
    private _email;
    private _identification;
    private readonly _createdAt?;
    private readonly _updatedAt?;
    private constructor();
    get id(): string | undefined;
    get firebaseUid(): string;
    get name(): string;
    get email(): string;
    get identification(): string;
    get createdAt(): Date | undefined;
    get updatedAt(): Date | undefined;
    withFirebaseUid(firebaseUid: string): this;
    withName(name: string): this;
    withEmail(email: string): this;
    withIdentification(identification: string): this;
    static restore(props?: {
        id?: string;
        firebaseUid: string;
        name: string;
        email: string;
        identification: string;
        createdAt?: Date;
        updatedAt?: Date;
    }): User | null;
}
