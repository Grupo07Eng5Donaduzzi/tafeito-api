import { CreateRequestDto, UpdateRequestDto } from "../dto/create-request.dto";
import { RequestDto } from "../dto/request.dto";
import { type RequestRepository } from "../../domain/repositories/request-repository.interface";
export declare class RequestService {
    private readonly requestRepository;
    constructor(requestRepository: RequestRepository);
    create(clientId: string, dto: CreateRequestDto): Promise<RequestDto>;
    list(): Promise<RequestDto[]>;
    findById(id: string): Promise<RequestDto>;
    findByClientId(clientId: string): Promise<RequestDto[]>;
    findByCategory(category: string): Promise<RequestDto[]>;
    findByCity(city: string): Promise<RequestDto[]>;
    edit(id: string, clientId: string, dto: UpdateRequestDto): Promise<RequestDto>;
    remove(id: string, clientId: string): Promise<void>;
}
