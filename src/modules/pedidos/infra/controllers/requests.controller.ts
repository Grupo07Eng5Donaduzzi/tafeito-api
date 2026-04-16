import { CreateRequestDto, UpdateRequestDto } from "@pedidos/application/dto/create-request.dto";
import { RequestService } from "@pedidos/application/services/request.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";

@Controller("pedidos")
export class RequestsController {
  constructor(private readonly requestService: RequestService) { }

  @Get()
  async findAll() {
    return this.requestService.list();
  }

  @Get("cliente/:clientId")
  async findByClientId(@Param("clientId") clientId: string) {
    return this.requestService.findByClientId(clientId);
  }

  @Get("categoria/:category")
  async findByCategory(@Param("category") category: string) {
    return this.requestService.findByCategory(category);
  }

  @Get("cidade")
  async findByCity(@Query("cidade") city: string) {
    return this.requestService.findByCity(city);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.requestService.findById(id);
  }

  @Post()
  async create(@Body() body: CreateRequestDto & { clientId?: string }) {
    const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
    return this.requestService.create(clientId, body);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateRequestDto & { clientId?: string },
  ) {
    const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
    return this.requestService.edit(id, clientId, body);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Body() body: { clientId?: string },
  ) {
    const clientId = body.clientId || "00000000-0000-0000-0000-000000000001";
    return this.requestService.remove(id, clientId);
  }
}