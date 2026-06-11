import { createReadStream } from 'fs';
import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { CurrentUser } from '@shared/infra/current-user.decorator';
import { RequireProviderGuard } from '@shared/infra/guards/require-provider.guard';
import { HateoasItem } from '@shared/infra/hateoas';
import { ProposalStatus } from '../../domain/models/proposal.entity';
import { ProposalService } from '../../application/services/proposal.service';
import { NegotiationService } from '../../application/services/negotiation.service';
import {
  ContestProposalDto,
  CreateProposalDto,
  RejectProposalDto,
  CreateNegotiationMessageDto,
  SendRevisedProposalDto,
  ProposalDto,
  NegotiationMessageDto,
  PaymentCheckResponseDto,
} from '../../application/dto/proposal.dto';

@ApiTags('Proposals')
@ApiBearerAuth('access-token')
@Controller('proposals')
export class ProposalsController {
  constructor(private readonly proposalService: ProposalService) {}

  @ApiOperation({ summary: 'Criar uma nova proposta (somente prestador)' })
  @Post()
  @UseGuards(RequireProviderGuard)
  async create(
    @CurrentUser() providerId: string,
    @Body() body: CreateProposalDto,
  ): Promise<ProposalDto> {
    return this.proposalService.createProposal(providerId, body);
  }

  @ApiOperation({ summary: 'Listar propostas criadas pelo prestador autenticado' })
  @Get('provider/created')
  async findProviderCreated(
    @CurrentUser() providerId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByProvider(providerId);
  }

  @ApiOperation({ summary: 'Listar propostas recebidas pelo cliente autenticado' })
  @Get('client/requested')
  async findClientRequested(
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProposalsByClient(clientId);
  }

  @ApiOperation({ summary: 'Histórico de serviços concluídos do cliente autenticado' })
  @Get('client/history')
  async getClientHistory(
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getClientServiceHistory(clientId);
  }

  @ApiOperation({ summary: 'Histórico de serviços concluídos do prestador autenticado' })
  @Get('provider/history')
  async getProviderHistory(
    @CurrentUser() providerId: string,
  ): Promise<ProposalDto[]> {
    return this.proposalService.getProviderServiceHistory(providerId);
  }

  @ApiOperation({ summary: 'Buscar proposta por ID' })
  @Get(':id')
  @HateoasItem<ProposalDto>({
    basePath: '/proposals',
    itemLinks: (item) => ({
      self: { href: `/proposals/${item.id}`, method: 'GET' },
      budgetRequest: { href: `/budgetRequests/${item.requestId}`, method: 'GET' },
      chat: item.linkedChatId
        ? { href: `/proposals/${item.id}/chat`, method: 'GET' }
        : null,
      payment: item.status === ProposalStatus.AWAITING_PAYMENT
        ? { href: `/proposals/${item.id}/payment`, method: 'GET' }
        : null,
      accept: (item.status === ProposalStatus.PENDING || item.status === ProposalStatus.NEGOTIATING)
        ? { href: `/proposals/${item.id}/accept`, method: 'POST' }
        : null,
      contest: item.status === ProposalStatus.PENDING
        ? { href: `/proposals/${item.id}/contest`, method: 'PATCH' }
        : null,
      reject: (item.status === ProposalStatus.PENDING || item.status === ProposalStatus.NEGOTIATING)
        ? { href: `/proposals/${item.id}/reject`, method: 'PATCH' }
        : null,
      providerConfirm: item.status === ProposalStatus.ACCEPTED
        ? { href: `/proposals/${item.id}/providerConfirm`, method: 'PATCH' }
        : null,
      clientConfirm: item.status === ProposalStatus.PROVIDER_CONFIRMED
        ? { href: `/proposals/${item.id}/clientConfirm`, method: 'PATCH' }
        : null,
      invoice: item.invoiceFile
        ? { href: `/proposals/${item.id}/invoice`, method: 'GET' }
        : null,
      uploadInvoice: (item.status === ProposalStatus.ACCEPTED || item.status === ProposalStatus.PROVIDER_CONFIRMED)
        ? { href: `/proposals/${item.id}/invoice`, method: 'POST' }
        : null,
    }),
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.getProposal(id, userId);
  }

  @ApiOperation({ summary: 'Contestar uma proposta e iniciar negociação' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/contest')
  async contest(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: ContestProposalDto,
  ): Promise<void> {
    await this.proposalService.contestProposal(proposalId, clientId, body);
  }

  @ApiOperation({ summary: 'Recusar uma proposta definitivamente' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
    @Body() body: RejectProposalDto,
  ): Promise<void> {
    await this.proposalService.rejectProposal(proposalId, clientId, body);
  }

  @ApiOperation({ summary: 'Aceitar uma proposta — QR code PIX disponível em GET :id/payment após processamento' })
  @Post(':id/accept')
  async accept(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<ProposalDto> {
    return this.proposalService.acceptProposal(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Consultar status do pagamento — ativa a proposta e cria agenda após confirmação' })
  @Get(':id/payment')
  async checkPayment(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<PaymentCheckResponseDto> {
    return this.proposalService.checkPaymentStatus(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Prestador confirma conclusão do serviço' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/providerConfirm')
  @UseGuards(RequireProviderGuard)
  async providerConfirm(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() providerId: string,
  ): Promise<void> {
    await this.proposalService.providerConfirmCompletion(proposalId, providerId);
  }

  @ApiOperation({ summary: 'Cliente confirma conclusão do serviço — dispara repasse PIX ao prestador' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id/clientConfirm')
  async clientConfirm(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() clientId: string,
  ): Promise<void> {
    await this.proposalService.clientConfirmCompletion(proposalId, clientId);
  }

  @ApiOperation({ summary: 'Fazer upload da nota fiscal (PDF ou XML) ao confirmar conclusão' })
  @ApiConsumes('multipart/form-data')
  @Post(':id/invoice')
  @UseGuards(RequireProviderGuard)
  @UseInterceptors(
    FileInterceptor('invoice', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowedMimes = ['application/pdf', 'application/xml', 'text/xml'];
        const allowedExts = ['.pdf', '.xml'];
        const fileExt = extname(file.originalname).toLowerCase();
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(fileExt)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and XML files are allowed for invoices'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadInvoice(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() providerId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProposalDto> {
    if (!file) {
      throw new BadRequestException('Invoice file is required');
    }
    return this.proposalService.uploadInvoice(proposalId, providerId, file.filename);
  }

  @ApiOperation({ summary: 'Baixar nota fiscal de uma proposta (cliente ou prestador)' })
  @Get(':id/invoice')
  async downloadInvoice(
    @Param('id', ParseUUIDPipe) proposalId: string,
    @CurrentUser() userId: string,
    @Res({ passthrough: true }) res: { set: (headers: Record<string, string>) => void },
  ): Promise<StreamableFile> {
    const { filePath, filename, mimeType } = await this.proposalService.getInvoiceFile(proposalId, userId);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(createReadStream(filePath));
  }

}

@ApiTags('Negotiations')
@ApiBearerAuth('access-token')
@Controller('negotiations')
export class NegotiationsController {
  constructor(private readonly negotiationService: NegotiationService) {}

  @ApiOperation({ summary: 'Enviar mensagem de negociação' })
  @Post(':proposalId/messages')
  async sendMessage(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() userId: string,
    @Body() body: CreateNegotiationMessageDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendMessage(proposalId, userId, body);
  }

  @ApiOperation({ summary: 'Enviar proposta revisada (somente prestador)' })
  @Post(':proposalId/revisedProposal')
  @UseGuards(RequireProviderGuard)
  async sendRevisedProposal(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() providerId: string,
    @Body() body: SendRevisedProposalDto,
  ): Promise<NegotiationMessageDto> {
    return this.negotiationService.sendRevisedProposal(proposalId, providerId, body);
  }

  @ApiOperation({ summary: 'Encerrar uma negociação' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':proposalId/close')
  async closeNegotiation(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    await this.negotiationService.closeNegotiation(proposalId, userId);
  }

  @ApiOperation({ summary: 'Listar mensagens de negociação de uma proposta' })
  @Get(':proposalId/messages')
  async getMessages(
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
  ): Promise<NegotiationMessageDto[]> {
    return this.negotiationService.getMessages(proposalId);
  }
}
