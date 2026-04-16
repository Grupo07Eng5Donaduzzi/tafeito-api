import { CreateServiceDto, UpdateServiceDto } from "@servicos/application/dto/create-service.dto";
import { ServiceService } from "@servicos/application/services/service.service";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

@Controller("servicos")
export class ServicesController {
  constructor(private readonly serviceService: ServiceService) { }

  @Get()
  async findAll() {
    return this.serviceService.list();
  }

  @Get("prestador/:providerId")
  async findByProviderId(@Param("providerId") providerId: string) {
    return this.serviceService.findByProviderId(providerId);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.serviceService.findById(id);
  }

  @Post()
  async create(@Body() body: CreateServiceDto) {
    // O providerId virá do token JWT futuramente
    // Por enquanto, vamos usar um providerId fixo para teste
    const providerId = body["providerId"] || "00000000-0000-0000-0000-000000000001";
    return this.serviceService.create(providerId, body);
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateServiceDto & { providerId?: string },
  ) {
    const providerId = body.providerId || "00000000-0000-0000-0000-000000000001";
    return this.serviceService.edit(id, providerId, body);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Body() body: { providerId?: string },
  ) {
    const providerId = body.providerId || "00000000-0000-0000-0000-000000000001";
    return this.serviceService.remove(id, providerId);
  }
}