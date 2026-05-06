import { type OnModuleDestroy } from "@nestjs/common";
export declare class DrizzleService implements OnModuleDestroy {
    private readonly pool;
    readonly db: any;
    constructor();
    onModuleDestroy(): Promise<void>;
}
