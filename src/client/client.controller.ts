import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { ApiCreateClient } from './docs/api-create-client.decorator';
import { ApiGetClient } from './docs/api-get-client.decorator';
import { ApiListClients } from './docs/api-list-clients.decorator';
import { ApiUpdateClient } from './docs/api-update-client.decorator';
import { Audit } from '@/common/audit/decorators/audit.decorator';
import { AuditAction } from '@/common/audit/enums/audit-action.enum';
import { InternalAuthGuard } from '@/internal-user/guards/internal-auth.guard';

@Controller('clients')
@ApiTags('Clientes')
@UseGuards(InternalAuthGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateClient()
  @Audit({
    action: AuditAction.CLIENT_CREATED,
    entityType: 'Client',
    description: 'Cliente criado',
    captureNewValues: true,
  })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @ApiListClients()
  async findAll(@Query() queryDto: QueryClientDto) {
    return this.clientService.findAll(queryDto);
  }

  @Get(':id')
  @ApiGetClient()
  async findOne(@Param('id') id: string) {
    return this.clientService.findById(id);
  }

  @Patch(':id')
  @ApiUpdateClient()
  @Audit({
    action: AuditAction.CLIENT_UPDATED,
    entityType: 'Client',
    description: 'Cliente atualizado',
    captureNewValues: true,
    captureOldValues: true,
  })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit({
    action: AuditAction.CLIENT_DELETED,
    entityType: 'Client',
    description: 'Cliente removido',
    captureOldValues: true,
  })
  async remove(@Param('id') id: string) {
    await this.clientService.remove(id);
  }
}
