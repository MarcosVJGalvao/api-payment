import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BackofficeUser,
  BackofficeUserStatus,
} from '../entities/backoffice-user.entity';
import { CreateBackofficeUserDto } from '../dto/create-backoffice-user.dto';
// Assuming this helper exists and handles bcrypt
import { AppLoggerService } from '@/common/logger/logger.service';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BackofficeUserService {
  private readonly context = BackofficeUserService.name;

  constructor(
    @InjectRepository(BackofficeUser)
    private readonly repository: Repository<BackofficeUser>,
    private readonly logger: AppLoggerService,
  ) {}

  async create(
    dto: CreateBackofficeUserDto,
    clientId: string,
  ): Promise<BackofficeUser> {
    this.logger.log(
      `Creating backoffice user for client ${clientId}`,
      this.context,
    );

    // Validate if user already exists
    const existing = await this.repository.findOne({
      where: { email: dto.email, clientId },
    });
    if (existing) {
      throw new CustomHttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
        ErrorCode.USER_ALREADY_EXISTS,
      );
    }

    const hashedPassword = await bcrypt.hash(String(dto.password), 10);
    const hashedSecretAnswer = await bcrypt.hash(
      String(dto.secretAnswer).toLowerCase(),
      10,
    );

    const user = this.repository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      secretAnswer: hashedSecretAnswer,
      clientId: clientId,
      status: BackofficeUserStatus.ACTIVE,
    });

    return this.repository.save(user);
  }

  async findByEmail(email: string): Promise<BackofficeUser | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<BackofficeUser | null> {
    return this.repository.findOne({ where: { id } });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.repository.update(id, { password: hashedPassword });
    this.logger.log(`Password updated for user ${id}`, this.context);
  }

  async remove(id: string): Promise<void> {
    await this.repository.softDelete(id);
    this.logger.log(`User ${id} soft deleted`, this.context);
  }
}
