import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AdminService } from '../../application/services/admin.service';
import { AdminGuard } from '../guards/admin.guard';
import { adminsSchema } from '../schemas/admin.schema';

type AdminRequest = {
  admin: typeof adminsSchema.$inferSelect;
};

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Listar todos os usuários' })
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @ApiOperation({ summary: 'Desativar um usuário' })
  @Patch('users/:id/deactivate')
  async deactivateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    await this.adminService.setUserStatus(id, 'suspended');
    await this.adminService.createAuditLog({
      adminId: req.admin.id,
      action: 'DEACTIVATE_USER',
      targetType: 'user',
      targetId: id,
      description: `Usuário ${id} desativado`,
    });
    return { message: 'Usuário desativado' };
  }

  @ApiOperation({ summary: 'Ativar um usuário' })
  @Patch('users/:id/activate')
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    await this.adminService.setUserStatus(id, 'active');
    await this.adminService.createAuditLog({
      adminId: req.admin.id,
      action: 'ACTIVATE_USER',
      targetType: 'user',
      targetId: id,
      description: `Usuário ${id} reativado`,
    });
    return { message: 'Usuário ativado' };
  }

  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  @Get('payments')
  listPayments() {
    return this.adminService.listPayments();
  }

  @ApiOperation({ summary: 'Marcar pagamento como pago manualmente' })
  @Post('payments/:id/mark-paid')
  async markPaymentPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    await this.adminService.markPaymentPaid(id, req.admin.id);
    return { message: 'Pagamento marcado como pago' };
  }

  @ApiOperation({ summary: 'Reembolsar pagamento via PIX' })
  @ApiBody({ schema: { properties: { pixKey: { type: 'string' } }, required: ['pixKey'] } })
  @Post('payments/:id/refund')
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('pixKey') pixKey: string,
    @Req() req: AdminRequest,
  ) {
    await this.adminService.refundPayment(id, pixKey, req.admin.id);
    return { message: 'Reembolso registrado' };
  }

  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @Get('audit')
  listAuditLogs() {
    return this.adminService.listAuditLogs();
  }
}
