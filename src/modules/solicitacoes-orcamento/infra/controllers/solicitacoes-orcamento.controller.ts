import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SolicitacaoOrcamentoService } from '../../application/services/solicitacao-orcamento.service';
import { CreateSolicitacaoOrcamentoDto } from '../../application/dto/create-solicitacao-orcamento.dto';

@Controller('solicitacoes-orcamento')
export class SolicitacoesOrcamentoController {
  constructor(private readonly service: SolicitacaoOrcamentoService) {}

  @Post()
  create(@Body() dto: CreateSolicitacaoOrcamentoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get('usuario/:usuarioId')
  findByUsuarioId(@Param('usuarioId') usuarioId: string) {
    return this.service.findByUsuarioId(usuarioId);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}

