import { CreateRequestDto, UpdateRequestDto } from "../../application/dto/create-request.dto";
import { RequestService } from "../../application/services/request.service";
export declare class RequestsController {
    private readonly requestService;
    constructor(requestService: RequestService);
    findAll(): Promise<import("../../application/dto/request.dto").RequestDto[]>;
    findByClientId(clientId: string): Promise<import("../../application/dto/request.dto").RequestDto[]>;
    findByCategory(category: string): Promise<import("../../application/dto/request.dto").RequestDto[]>;
    findByCity(city: string): Promise<import("../../application/dto/request.dto").RequestDto[]>;
    findById(id: string): Promise<import("../../application/dto/request.dto").RequestDto>;
    create(body: CreateRequestDto & {
        clientId?: string;
    }): Promise<import("../../application/dto/request.dto").RequestDto>;
    update(id: string, body: UpdateRequestDto & {
        clientId?: string;
    }): Promise<import("../../application/dto/request.dto").RequestDto>;
    remove(id: string, body: {
        clientId?: string;
    }): Promise<void>;
}
